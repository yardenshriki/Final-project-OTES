const express = require("express");
const paymentsController = require("../controllers/paymentsController");

const router = express.Router();

router.get("/", paymentsController.getAllPayments);
router.get("/user/:userId", paymentsController.getUserPayments);
router.get("/task/:taskId", paymentsController.getTaskPayment);
router.post("/", paymentsController.createPayment);
router.patch("/:id/approve", paymentsController.approvePayment);
router.patch("/:id/reject", paymentsController.rejectPayment);
router.get("/:id/receipt", paymentsController.getPaymentReceipt);

module.exports = router;
