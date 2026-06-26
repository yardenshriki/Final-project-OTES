const db = require("../db/db_connection");

function cleanUserFromBody(body) {
  return {
    fullName: body.fullName || body.full_name,
    username: body.username,
    email: body.email,
    password: body.password,
    birthDate: body.birthDate || body.birth_date || null,
    phoneNumber: body.phoneNumber || body.phone_number || null,
    gender: body.gender || null,
    profilePicture: body.profilePicture || body.profile_picture || null,
    role: body.role || getRoleFromUsername(body.username),
  };
}

function getRoleFromUsername(username) {
  if (username && username.toUpperCase().indexOf("ADMIN") == 0) {
    return "Admin";
  }

  return "Requester";
}

function removePassword(user) {
  delete user.password;
  return user;
}

async function getAllUsers(req, res) {
  try {
    const [users] = await db.execute(
      `SELECT id, full_name, username, email, birth_date, phone_number,
        gender, profile_picture, created_at, role
      FROM users`,
    );

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get users",
      error: error.message,
    });
  }
}

async function getUserById(req, res) {
  try {
    const [users] = await db.execute(
      `SELECT id, full_name, username, email, birth_date, phone_number,
        gender, profile_picture, created_at, role
      FROM users
      WHERE id = ?`,
      [req.params.id],
    );

    if (users.length == 0) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    res.json(users[0]);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get user",
      error: error.message,
    });
  }
}

async function createUser(req, res) {
  const user = cleanUserFromBody(req.body);

  if (!user.fullName || !user.username || !user.email || !user.password) {
    res.status(400).json({
      message: "Missing required user fields",
    });
    return;
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO users
      (full_name, username, email, password, birth_date, phone_number, gender, profile_picture, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.fullName,
        user.username,
        user.email,
        user.password,
        user.birthDate,
        user.phoneNumber,
        user.gender,
        user.profilePicture,
        user.role,
      ],
    );

    res.status(201).json({
      message: "User created successfully",
      userId: result.insertId,
      role: user.role,
    });
  } catch (error) {
    if (error.code == "ER_DUP_ENTRY") {
      res.status(409).json({
        message: "Username or email already exists",
      });
      return;
    }

    res.status(500).json({
      message: "Failed to create user",
      error: error.message,
    });
  }
}

async function loginUser(req, res) {
  const usernameOrEmail = req.body.username || req.body.email;
  const password = req.body.password;

  if (!usernameOrEmail || !password) {
    res.status(400).json({
      message: "Missing username/email or password",
    });
    return;
  }

  try {
    const [users] = await db.execute(
      `SELECT *
      FROM users
      WHERE (username = ? OR email = ?) AND password = ?`,
      [usernameOrEmail, usernameOrEmail, password],
    );

    if (users.length == 0) {
      res.status(401).json({
        message: "Invalid login details",
      });
      return;
    }

    const user = removePassword(users[0]);

    res.json({
      message: "Login successful",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to login",
      error: error.message,
    });
  }
}

async function updateUser(req, res) {
  const user = cleanUserFromBody(req.body);

  if (!user.fullName || !user.username || !user.email) {
    res.status(400).json({
      message: "Missing required user fields",
    });
    return;
  }

  try {
    const values = [
      user.fullName,
      user.username,
      user.email,
      user.birthDate,
      user.phoneNumber,
      user.gender,
      user.profilePicture,
      user.role,
    ];

    let query = `UPDATE users
      SET full_name = ?, username = ?, email = ?, birth_date = ?, phone_number = ?,
        gender = ?, profile_picture = ?, role = ?`;

    if (user.password) {
      query += ", password = ?";
      values.push(user.password);
    }

    query += " WHERE id = ?";
    values.push(req.params.id);

    const [result] = await db.execute(query, values);

    if (result.affectedRows == 0) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    res.json({
      message: "User updated successfully",
    });
  } catch (error) {
    if (error.code == "ER_DUP_ENTRY") {
      res.status(409).json({
        message: "Username or email already exists",
      });
      return;
    }

    res.status(500).json({
      message: "Failed to update user",
      error: error.message,
    });
  }
}

async function deleteUser(req, res) {
  try {
    const [result] = await db.execute(`DELETE FROM users WHERE id = ?`, [
      req.params.id,
    ]);

    if (result.affectedRows == 0) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete user",
      error: error.message,
    });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  loginUser,
  updateUser,
  deleteUser,
};
