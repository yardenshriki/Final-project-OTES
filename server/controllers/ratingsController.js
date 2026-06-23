const db = require("../db/db_connection");

async function getUserRatings(req, res) {
  try {
    const [ratings] = await db.execute(
      `SELECT
        ratings.*,
        tasks.title AS task_title,
        requester.full_name AS requester_name,
        performer.full_name AS performer_name
      FROM ratings
      JOIN tasks ON ratings.task_id = tasks.id
      JOIN users requester ON ratings.requester_id = requester.id
      JOIN users performer ON ratings.performer_id = performer.id
      WHERE ratings.performer_id = ?`,
      [req.params.userId],
    );

    const [ratingSummary] = await db.execute(
      `SELECT
        AVG(rating) AS average_rating,
        COUNT(*) AS total_ratings
      FROM ratings
      WHERE performer_id = ?`,
      [req.params.userId],
    );

    res.json({
      userId: Number(req.params.userId),
      averageRating: Number(ratingSummary[0].average_rating || 0),
      totalRatings: ratingSummary[0].total_ratings,
      ratings,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get user ratings",
      error: error.message,
    });
  }
}

async function createRating(req, res) {
  const taskId = req.body.taskId || req.body.task_id;
  const requesterId = req.body.requesterId || req.body.requester_id;
  const performerId = req.body.performerId || req.body.performer_id;
  const { rating, feedback } = req.body;

  if (!taskId || !requesterId || !performerId || !rating) {
    res.status(400).json({
      message: "Missing required rating fields",
    });
    return;
  }

  if (rating < 1 || rating > 5) {
    res.status(400).json({
      message: "Rating must be between 1 and 5",
    });
    return;
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO ratings
      (task_id, requester_id, performer_id, rating, feedback)
      VALUES (?, ?, ?, ?, ?)`,
      [taskId, requesterId, performerId, rating, feedback || null],
    );

    res.status(201).json({
      message: "Rating created successfully",
      ratingId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create rating",
      error: error.message,
    });
  }
}

module.exports = {
  getUserRatings,
  createRating,
};
