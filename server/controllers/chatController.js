const db = require("../db/db_connection");

async function getTaskParticipants(taskId) {
  const [tasks] = await db.execute(
    `SELECT requester_id, performer_id
    FROM tasks
    WHERE id = ?`,
    [taskId],
  );

  return tasks[0] || null;
}

function isTaskParticipant(task, userId) {
  return (
    task != null &&
    (String(task.requester_id) == String(userId) ||
      String(task.performer_id) == String(userId))
  );
}

async function getTaskMessages(req, res) {
  const userId = req.query.userId || req.query.user_id;

  if (!userId) {
    res.status(400).json({ message: "Missing user id" });
    return;
  }

  try {
    const task = await getTaskParticipants(req.params.taskId);

    if (task == null) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    if (!isTaskParticipant(task, userId)) {
      res.status(403).json({ message: "You are not a participant in this chat" });
      return;
    }

    const [messages] = await db.execute(
      `SELECT
        chat_messages.*,
        sender.full_name AS sender_name,
        receiver.full_name AS receiver_name
      FROM chat_messages
      JOIN users sender ON chat_messages.sender_id = sender.id
      JOIN users receiver ON chat_messages.receiver_id = receiver.id
      WHERE chat_messages.task_id = ?
        AND ((chat_messages.sender_id = ? AND chat_messages.receiver_id = ?)
          OR (chat_messages.sender_id = ? AND chat_messages.receiver_id = ?))
      ORDER BY chat_messages.created_at ASC`,
      [
        req.params.taskId,
        task.requester_id,
        task.performer_id,
        task.performer_id,
        task.requester_id,
      ],
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get task messages",
      error: error.message,
    });
  }
}

async function createMessage(req, res) {
  const senderId = req.body.senderId || req.body.sender_id;
  const receiverId = req.body.receiverId || req.body.receiver_id;
  const { message } = req.body;

  if (!senderId || !receiverId || !message) {
    res.status(400).json({
      message: "Missing required message fields",
    });
    return;
  }

  try {
    const task = await getTaskParticipants(req.params.taskId);

    if (task == null) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    const messageMatchesTaskParticipants =
      (String(senderId) == String(task.requester_id) &&
        String(receiverId) == String(task.performer_id)) ||
      (String(senderId) == String(task.performer_id) &&
        String(receiverId) == String(task.requester_id));

    if (!messageMatchesTaskParticipants) {
      res.status(403).json({ message: "Invalid chat participants" });
      return;
    }

    const [result] = await db.execute(
      `INSERT INTO chat_messages
      (task_id, sender_id, receiver_id, message)
      VALUES (?, ?, ?, ?)`,
      [req.params.taskId, senderId, receiverId, message],
    );

    res.status(201).json({
      message: "Message created successfully",
      messageId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create message",
      error: error.message,
    });
  }
}

async function markTaskMessagesAsRead(req, res) {
  const userId = req.body.userId || req.body.user_id;

  if (!userId) {
    res.status(400).json({
      message: "Missing user id",
    });
    return;
  }

  try {
    const task = await getTaskParticipants(req.params.taskId);

    if (!isTaskParticipant(task, userId)) {
      res.status(403).json({ message: "You are not a participant in this chat" });
      return;
    }

    const [result] = await db.execute(
      `UPDATE chat_messages
      SET is_read = ?
      WHERE task_id = ? AND receiver_id = ?`,
      [true, req.params.taskId, userId],
    );

    res.json({
      message: "Messages marked as read",
      updatedMessages: result.affectedRows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to mark messages as read",
      error: error.message,
    });
  }
}

module.exports = {
  getTaskMessages,
  createMessage,
  markTaskMessagesAsRead,
};
