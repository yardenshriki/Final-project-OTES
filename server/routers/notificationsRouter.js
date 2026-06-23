const express = require("express");
const notificationsController = require("../controllers/notificationsController");

const router = express.Router();

router.get("/user/:userId", notificationsController.getUserNotifications);
router.post("/", notificationsController.createNotification);
router.patch("/:id/read", notificationsController.markNotificationAsRead);
router.delete("/:id", notificationsController.deleteNotification);

module.exports = router;
