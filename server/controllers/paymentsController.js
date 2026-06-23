const db = require("../db/db_connection");

function createReceiptNumber(paymentId) {
  return `OTES-${paymentId}-${Date.now()}`;
}

async function getAllPayments(req, res) {
  try {
    const [payments] = await db.execute(
      `SELECT
        payments.*,
        tasks.title AS task_title,
        requester.full_name AS requester_name,
        performer.full_name AS performer_name
      FROM payments
      JOIN tasks ON payments.task_id = tasks.id
      JOIN users requester ON payments.requester_id = requester.id
      JOIN users performer ON payments.performer_id = performer.id
      ORDER BY payments.created_at DESC`,
    );

    res.json(payments);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get payments",
      error: error.message,
    });
  }
}

async function getUserPayments(req, res) {
  try {
    const [payments] = await db.execute(
      `SELECT
        payments.*,
        tasks.title AS task_title,
        requester.full_name AS requester_name,
        performer.full_name AS performer_name
      FROM payments
      JOIN tasks ON payments.task_id = tasks.id
      JOIN users requester ON payments.requester_id = requester.id
      JOIN users performer ON payments.performer_id = performer.id
      WHERE payments.requester_id = ? OR payments.performer_id = ?
      ORDER BY payments.created_at DESC`,
      [req.params.userId, req.params.userId],
    );

    res.json(payments);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get user payments",
      error: error.message,
    });
  }
}

async function getTaskPayment(req, res) {
  try {
    const [payments] = await db.execute(
      `SELECT
        payments.*,
        tasks.title AS task_title,
        requester.full_name AS requester_name,
        performer.full_name AS performer_name
      FROM payments
      JOIN tasks ON payments.task_id = tasks.id
      JOIN users requester ON payments.requester_id = requester.id
      JOIN users performer ON payments.performer_id = performer.id
      WHERE payments.task_id = ?`,
      [req.params.taskId],
    );

    res.json(payments);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get task payment",
      error: error.message,
    });
  }
}

async function createPayment(req, res) {
  const taskId = req.body.taskId || req.body.task_id;
  const requesterId = req.body.requesterId || req.body.requester_id;
  const performerId = req.body.performerId || req.body.performer_id;
  const { amount, status } = req.body;

  if (!taskId || !requesterId || !performerId || !amount) {
    res.status(400).json({
      message: "Missing required payment fields",
    });
    return;
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO payments
      (task_id, requester_id, performer_id, amount, status)
      VALUES (?, ?, ?, ?, ?)`,
      [taskId, requesterId, performerId, amount, status || "pending"],
    );

    res.status(201).json({
      message: "Payment created successfully",
      paymentId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create payment",
      error: error.message,
    });
  }
}

async function approvePayment(req, res) {
  const receiptNumber = createReceiptNumber(req.params.id);

  try {
    const [result] = await db.execute(
      `UPDATE payments
      SET status = ?, receipt_number = ?, paid_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      ["paid", receiptNumber, req.params.id],
    );

    if (result.affectedRows == 0) {
      res.status(404).json({
        message: "Payment not found",
      });
      return;
    }

    res.json({
      message: "Payment approved successfully",
      receiptNumber,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to approve payment",
      error: error.message,
    });
  }
}

async function rejectPayment(req, res) {
  try {
    const [result] = await db.execute(
      `UPDATE payments
      SET status = ?
      WHERE id = ?`,
      ["rejected", req.params.id],
    );

    if (result.affectedRows == 0) {
      res.status(404).json({
        message: "Payment not found",
      });
      return;
    }

    res.json({
      message: "Payment rejected successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to reject payment",
      error: error.message,
    });
  }
}

async function getPaymentReceipt(req, res) {
  try {
    const [payments] = await db.execute(
      `SELECT
        payments.id,
        payments.amount,
        payments.status,
        payments.receipt_number,
        payments.paid_at,
        payments.created_at,
        tasks.title AS task_title,
        requester.full_name AS requester_name,
        performer.full_name AS performer_name
      FROM payments
      JOIN tasks ON payments.task_id = tasks.id
      JOIN users requester ON payments.requester_id = requester.id
      JOIN users performer ON payments.performer_id = performer.id
      WHERE payments.id = ?`,
      [req.params.id],
    );

    if (payments.length == 0) {
      res.status(404).json({
        message: "Payment not found",
      });
      return;
    }

    res.json(payments[0]);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get payment receipt",
      error: error.message,
    });
  }
}

module.exports = {
  getAllPayments,
  getUserPayments,
  getTaskPayment,
  createPayment,
  approvePayment,
  rejectPayment,
  getPaymentReceipt,
};
