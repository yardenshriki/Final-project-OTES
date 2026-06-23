const db = require("../db/db_connection");

async function getUserNotifications(req, res) {
  try {
    const [notifications] = await db.execute(
      `SELECT
        notifications.*,
        tasks.title AS task_title
      FROM notifications
      LEFT JOIN tasks ON notifications.task_id = tasks.id
      WHERE notifications.user_id = ?
      ORDER BY notifications.created_at DESC`,
      [req.params.userId],
    );

    res.json(notifications);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get user notifications",
      error: error.message,
    });
  }
}

async function createNotification(req, res) {
  const userId = req.body.userId || req.body.user_id;
  const taskId = req.body.taskId || req.body.task_id || null;
  const { type, title, message } = req.body;

  if (!userId || !title || !message) {
    res.status(400).json({
      message: "Missing required notification fields",
    });
    return;
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO notifications
      (user_id, task_id, type, title, message)
      VALUES (?, ?, ?, ?, ?)`,
      [userId, taskId, type || "general", title, message],
    );

    res.status(201).json({
      message: "Notification created successfully",
      notificationId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create notification",
      error: error.message,
    });
  }
}

async function markNotificationAsRead(req, res) {
  try {
    const [result] = await db.execute(
      `UPDATE notifications
      SET is_read = ?
      WHERE id = ?`,
      [true, req.params.id],
    );

    if (result.affectedRows == 0) {
      res.status(404).json({
        message: "Notification not found",
      });
      return;
    }

    res.json({
      message: "Notification marked as read",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
}

async function deleteNotification(req, res) {
  try {
    const [result] = await db.execute(
      `DELETE FROM notifications
      WHERE id = ?`,
      [req.params.id],
    );

    if (result.affectedRows == 0) {
      res.status(404).json({
        message: "Notification not found",
      });
      return;
    }

    res.json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete notification",
      error: error.message,
    });
  }
}

module.exports = {
  getUserNotifications,
  createNotification,
  markNotificationAsRead,
  deleteNotification,
};
