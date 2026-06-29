const db = require("../db/db_connection");

function cleanTaskFromBody(body) {
  return {
    title: body.title || body.taskTitle,
    description: body.description,
    location: body.location,
    difficulty: body.difficulty || body.difficultyLevel,
    payment: body.payment,
    additionalDetails: body.additionalDetails || body.additional_details,
    category: body.category || body.categories,
    state: body.state || "open",
    workStatus: body.workStatus || body.work_status || "Available",
    requesterId: body.requesterId || body.requester_id,
    performerId: body.performerId || body.performer_id || null,
    deadline: body.deadline || null,
    imageData: body.imageData || body.image_data || null,
  };
}

async function getAllTasks(req, res) {
  try {
    const [tasks] = await db.execute(
      `SELECT
        tasks.*,
        requester.full_name AS requester_name,
        performer.full_name AS performer_name
      FROM tasks
      JOIN users requester ON tasks.requester_id = requester.id
      LEFT JOIN users performer ON tasks.performer_id = performer.id`,
    );

    res.json(tasks);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get tasks",
      error: error.message,
    });
  }
}

async function getTaskById(req, res) {
  try {
    const [tasks] = await db.execute(
      `SELECT
        tasks.*,
        requester.full_name AS requester_name,
        performer.full_name AS performer_name
      FROM tasks
      JOIN users requester ON tasks.requester_id = requester.id
      LEFT JOIN users performer ON tasks.performer_id = performer.id
      WHERE tasks.id = ?`,
      [req.params.id],
    );

    if (tasks.length == 0) {
      res.status(404).json({
        message: "Task not found",
      });
      return;
    }

    res.json(tasks[0]);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get task",
      error: error.message,
    });
  }
}

async function createTask(req, res) {
  const task = cleanTaskFromBody(req.body);

  if (!task.title || !task.description || !task.requesterId) {
    res.status(400).json({
      message: "Missing required task fields",
    });
    return;
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO tasks
      (title, description, location, difficulty, payment, additional_details, category, state, work_status, requester_id, performer_id, deadline, image_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.title,
        task.description,
        task.location,
        task.difficulty,
        task.payment,
        task.additionalDetails,
        task.category,
        task.state,
        task.workStatus,
        task.requesterId,
        task.performerId,
        task.deadline,
        task.imageData,
      ],
    );
    res.status(201).json({
      message: "Task created successfully",
      taskId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create task",
      error: error.message,
    });
  }
}

async function updateTask(req, res) {
  const task = cleanTaskFromBody(req.body);

  if (!task.title || !task.description || !task.requesterId) {
    res.status(400).json({
      message: "Missing required task fields",
    });
    return;
  }

  try {
    const [result] = await db.execute(
      `UPDATE tasks
      SET title = ?, description = ?, location = ?, difficulty = ?, payment = ?,
        additional_details = ?, category = ?, state = ?, work_status = ?,
        requester_id = ?, performer_id = ?, deadline = ?
      WHERE id = ?`,
      [
        task.title,
        task.description,
        task.location,
        task.difficulty,
        task.payment,
        task.additionalDetails,
        task.category,
        task.state,
        task.workStatus,
        task.requesterId,
        task.performerId,
        task.deadline,
        req.params.id,
      ],
    );

    if (result.affectedRows == 0) {
      res.status(404).json({
        message: "Task not found",
      });
      return;
    }

    res.json({
      message: "Task updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update task",
      error: error.message,
    });
  }
}

async function deleteTask(req, res) {
  try {
    const [result] = await db.execute(`DELETE FROM tasks WHERE id = ?`, [
      req.params.id,
    ]);

    if (result.affectedRows == 0) {
      res.status(404).json({
        message: "Task not found",
      });
      return;
    }

    res.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete task",
      error: error.message,
    });
  }
}

async function getAvailableTasks(req, res) {
  try {
    const [tasks] = await db.execute(
      `SELECT
        tasks.*,
        requester.full_name AS requester_name,
        performer.full_name AS performer_name
      FROM tasks
      JOIN users requester ON tasks.requester_id = requester.id
      LEFT JOIN users performer ON tasks.performer_id = performer.id
      WHERE tasks.state = ? AND tasks.performer_id IS NULL`,
      ["open"],
    );

    res.json(tasks);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get available tasks",
      error: error.message,
    });
  }
}

async function getRequesterTasks(req, res) {
  try {
    const [tasks] = await db.execute(
      `SELECT
        tasks.*,
        requester.full_name AS requester_name,
        performer.full_name AS performer_name
      FROM tasks
      JOIN users requester ON tasks.requester_id = requester.id
      LEFT JOIN users performer ON tasks.performer_id = performer.id
      WHERE tasks.requester_id = ?`,
      [req.params.requesterId],
    );

    res.json(tasks);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get requester tasks",
      error: error.message,
    });
  }
}

async function getPerformerTasks(req, res) {
  try {
    const [tasks] = await db.execute(
      `SELECT
        tasks.*,
        requester.full_name AS requester_name,
        performer.full_name AS performer_name
      FROM tasks
      JOIN users requester ON tasks.requester_id = requester.id
      LEFT JOIN users performer ON tasks.performer_id = performer.id
      WHERE tasks.performer_id = ?`,
      [req.params.performerId],
    );

    res.json(tasks);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get performer tasks",
      error: error.message,
    });
  }
}

async function takeTask(req, res) {
  const { performerId, performer_id } = req.body;
  const selectedPerformerId = performerId || performer_id;

  if (!selectedPerformerId) {
    res.status(400).json({
      message: "Missing performer id",
    });
    return;
  }

  try {
    const [result] = await db.execute(
      `UPDATE tasks
      SET performer_id = ?, state = ?, work_status = ?
      WHERE id = ? AND state = ? AND performer_id IS NULL`,
      [
        selectedPerformerId,
        "in-progress",
        "Task accepted",
        req.params.id,
        "open",
      ],
    );

    if (result.affectedRows == 0) {
      res.status(400).json({
        message: "Task is not available",
      });
      return;
    }

    res.json({
      message: "Task taken successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to take task",
      error: error.message,
    });
  }
}

async function updateTaskStatus(req, res) {
  const workStatus = req.body.workStatus || req.body.work_status;

  if (!workStatus) {
    res.status(400).json({
      message: "Missing work status",
    });
    return;
  }

  try {
    const [result] = await db.execute(
      `UPDATE tasks
      SET work_status = ?
      WHERE id = ?`,
      [workStatus, req.params.id],
    );

    if (result.affectedRows == 0) {
      res.status(404).json({
        message: "Task not found",
      });
      return;
    }

    res.json({
      message: "Task status updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update task status",
      error: error.message,
    });
  }
}

async function completeTask(req, res) {
  try {
    const [result] = await db.execute(
      `UPDATE tasks
      SET work_status = ?
      WHERE id = ?`,
      ["Task completed", req.params.id],
    );

    if (result.affectedRows == 0) {
      res.status(404).json({
        message: "Task not found",
      });
      return;
    }

    res.json({
      message: "Task marked as completed by performer",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to complete task",
      error: error.message,
    });
  }
}

async function approveTaskCompletion(req, res) {
  try {
    const [result] = await db.execute(
      `UPDATE tasks
      SET state = ?, work_status = ?
      WHERE id = ?`,
      ["completed", "Task completed", req.params.id],
    );

    if (result.affectedRows == 0) {
      res.status(404).json({
        message: "Task not found",
      });
      return;
    }

    res.json({
      message: "Task completion approved",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to approve task completion",
      error: error.message,
    });
  }
}

async function rejectTaskCompletion(req, res) {
  try {
    const [result] = await db.execute(
      `UPDATE tasks
      SET state = ?, work_status = ?
      WHERE id = ? AND state = ?`,
      ["in-progress", "Finalizing the task", req.params.id, "completed"],
    );

    if (result.affectedRows == 0) {
      res.status(404).json({
        message: "Task not found",
      });
      return;
    }

    res.json({
      message: "Task completion rejected",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to reject task completion",
      error: error.message,
    });
  }
}

async function filterTasks(req, res) {
  const { category, difficulty, location, minPayment, maxPayment } = req.query;
  const conditions = [];
  const values = [];

  if (category) {
    conditions.push("tasks.category = ?");
    values.push(category);
  }

  if (difficulty) {
    conditions.push("tasks.difficulty = ?");
    values.push(difficulty);
  }

  if (location) {
    conditions.push("tasks.location = ?");
    values.push(location);
  }

  if (minPayment) {
    conditions.push("tasks.payment >= ?");
    values.push(minPayment);
  }

  if (maxPayment) {
    conditions.push("tasks.payment <= ?");
    values.push(maxPayment);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const [tasks] = await db.execute(
      `SELECT
        tasks.*,
        requester.full_name AS requester_name,
        performer.full_name AS performer_name
      FROM tasks
      JOIN users requester ON tasks.requester_id = requester.id
      LEFT JOIN users performer ON tasks.performer_id = performer.id
      ${whereClause}`,
      values,
    );

    res.json(tasks);
  } catch (error) {
    res.status(500).json({
      message: "Failed to filter tasks",
      error: error.message,
    });
  }
}

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getAvailableTasks,
  getRequesterTasks,
  getPerformerTasks,
  takeTask,
  updateTaskStatus,
  completeTask,
  approveTaskCompletion,
  rejectTaskCompletion,
  filterTasks,
};
