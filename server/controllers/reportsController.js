const db = require("../db/db_connection");

async function getAllReports(req, res) {
  try {
    const [reports] = await db.execute(
      `SELECT
        reports.*,
        reporter.full_name AS reporter_name,
        reported_user.full_name AS reported_user_name,
        tasks.title AS task_title
      FROM reports
      JOIN users reporter ON reports.reporter_id = reporter.id
      LEFT JOIN users reported_user ON reports.reported_user_id = reported_user.id
      LEFT JOIN tasks ON reports.task_id = tasks.id
      ORDER BY reports.created_at DESC`,
    );

    res.json(reports);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get reports",
      error: error.message,
    });
  }
}

async function getReportById(req, res) {
  try {
    const [reports] = await db.execute(
      `SELECT
        reports.*,
        reporter.full_name AS reporter_name,
        reported_user.full_name AS reported_user_name,
        tasks.title AS task_title
      FROM reports
      JOIN users reporter ON reports.reporter_id = reporter.id
      LEFT JOIN users reported_user ON reports.reported_user_id = reported_user.id
      LEFT JOIN tasks ON reports.task_id = tasks.id
      WHERE reports.id = ?`,
      [req.params.id],
    );

    if (reports.length == 0) {
      res.status(404).json({
        message: "Report not found",
      });
      return;
    }

    res.json(reports[0]);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get report",
      error: error.message,
    });
  }
}

async function getReportsByUser(req, res) {
  try {
    const [reports] = await db.execute(
      `SELECT
        reports.*,
        reporter.full_name AS reporter_name,
        reported_user.full_name AS reported_user_name,
        tasks.title AS task_title
      FROM reports
      JOIN users reporter ON reports.reporter_id = reporter.id
      LEFT JOIN users reported_user ON reports.reported_user_id = reported_user.id
      LEFT JOIN tasks ON reports.task_id = tasks.id
      WHERE reports.reporter_id = ? OR reports.reported_user_id = ?
      ORDER BY reports.created_at DESC`,
      [req.params.userId, req.params.userId],
    );

    res.json(reports);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get user reports",
      error: error.message,
    });
  }
}

async function createReport(req, res) {
  const reporterId = req.body.reporterId || req.body.reporter_id;
  const reportedUserId =
    req.body.reportedUserId || req.body.reported_user_id || null;
  const taskId = req.body.taskId || req.body.task_id || null;
  const { reason, description } = req.body;

  if (!reporterId || !reason) {
    res.status(400).json({
      message: "Missing required report fields",
    });
    return;
  }

  if (!reportedUserId && !taskId) {
    res.status(400).json({
      message: "Report must include reported user or task",
    });
    return;
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO reports
      (reporter_id, reported_user_id, task_id, reason, description)
      VALUES (?, ?, ?, ?, ?)`,
      [reporterId, reportedUserId, taskId, reason, description || null],
    );

    res.status(201).json({
      message: "Report created successfully",
      reportId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create report",
      error: error.message,
    });
  }
}

async function updateReportStatus(req, res) {
  const decision = req.body.decision || null;

  try {
    const [reports] = await db.execute(
      `SELECT status, reporter_id, reported_user_id
      FROM reports
      WHERE id = ?`,
      [req.params.id],
    );

    if (reports.length == 0) {
      res.status(404).json({
        message: "Report not found",
      });
      return;
    }

    const { status: currentStatus, reporter_id, reported_user_id } = reports[0];

    if (currentStatus == "closed") {
      res.json({
        message: "Report is already closed",
        status: currentStatus,
      });
      return;
    }

    const nextStatus = currentStatus == "open" ? "in-review" : "closed";

    const [result] = await db.execute(
      `UPDATE reports
      SET status = ?
      WHERE id = ?`,
      [nextStatus, req.params.id],
    );

    if (result.affectedRows == 0) {
      res.status(404).json({
        message: "Report not found",
      });
      return;
    }

    if (nextStatus == "in-review") {
      await db.execute(
        `INSERT INTO notifications (user_id, type, title, message)
        VALUES (?, ?, ?, ?)`,
        [reporter_id, "report", "Report under review", "Your report has been received and is now being reviewed"],
      );
    } else if (nextStatus == "closed") {
      await db.execute(
        `INSERT INTO notifications (user_id, type, title, message)
        VALUES (?, ?, ?, ?)`,
        [reporter_id, "report", "Report closed", "Your report has been reviewed and closed"],
      );

      if (reported_user_id && decision) {
        const decisionTitle = decision == "block" ? "Your account has been blocked" : "You received a warning";
        const decisionMessage = decision == "block"
          ? "Following a report filed against you, your account has been blocked"
          : "Following a report filed against you, you have received a warning";

        await db.execute(
          `INSERT INTO notifications (user_id, type, title, message)
          VALUES (?, ?, ?, ?)`,
          [reported_user_id, decision, decisionTitle, decisionMessage],
        );
      }
    }

    res.json({
      message: "Report status updated successfully",
      previousStatus: currentStatus,
      status: nextStatus,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update report status",
      error: error.message,
    });
  }
}

async function deleteReport(req, res) {
  try {
    const [result] = await db.execute(
      `DELETE FROM reports
      WHERE id = ?`,
      [req.params.id],
    );

    if (result.affectedRows == 0) {
      res.status(404).json({
        message: "Report not found",
      });
      return;
    }

    res.json({
      message: "Report deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete report",
      error: error.message,
    });
  }
}

module.exports = {
  getAllReports,
  getReportsByUser,
  getReportById,
  createReport,
  updateReportStatus,
  deleteReport,
};
