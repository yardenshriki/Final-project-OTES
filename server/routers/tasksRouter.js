const express = require("express");
const tasksController = require("../controllers/tasksController");

const router = express.Router();

router.get("/", tasksController.getAllTasks);
router.get("/:id", tasksController.getTaskById);
router.post("/", tasksController.createTask);
router.put("/:id", tasksController.updateTask);
router.delete("/:id", tasksController.deleteTask);

module.exports = router;
