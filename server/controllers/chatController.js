const db = require("../db/db_connection");

async function getTaskMessages(req, res) {
  try {
    const [messages] = await db.execute(
      `SELECT
        chat_messages.*,
        sender.full_name AS sender_name,
        receiver.full_name AS receiver_name
      FROM chat_messages
      JOIN users sender ON chat_messages.sender_id = sender.id
      JOIN users receiver ON chat_messages.receiver_id = receiver.id
      WHERE chat_messages.task_id = ?
      ORDER BY chat_messages.created_at ASC`,
      [req.params.taskId],
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
