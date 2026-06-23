const express = require("express");
const reportsController = require("../controllers/reportsController");

const router = express.Router();

router.get("/", reportsController.getAllReports);
router.get("/user/:userId", reportsController.getReportsByUser);
router.get("/:id", reportsController.getReportById);
router.post("/", reportsController.createReport);
router.patch("/:id/status", reportsController.updateReportStatus);
router.delete("/:id", reportsController.deleteReport);

module.exports = router;
