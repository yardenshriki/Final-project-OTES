const express = require("express");
const chatController = require("../controllers/chatController");

const router = express.Router();

router.get("/task/:taskId", chatController.getTaskMessages);
router.post("/task/:taskId/messages", chatController.createMessage);
router.patch("/task/:taskId/read", chatController.markTaskMessagesAsRead);

module.exports = router;
