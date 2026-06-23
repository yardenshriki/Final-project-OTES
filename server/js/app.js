require("dotenv").config();

const express = require("express");
const cors = require("cors");
const usersRouter = require("../routers/usersRouter");
const tasksRouter = require("../routers/tasksRouter");
const reportsRouter = require("../routers/reportsRouter");
const ratingsRouter = require("../routers/ratingsRouter");
const paymentsRouter = require("../routers/paymentsRouter");
const notificationsRouter = require("../routers/notificationsRouter");
const chatRouter = require("../routers/chatRouter");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/users", usersRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/report", reportsRouter);
app.use("/api/rating", ratingsRouter);
app.use("/api/payment", paymentsRouter);
app.use("/api/notification", notificationsRouter);
app.use("/api/chat", chatRouter);
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.set("Content-Type", "application/json");
  next();
});

app.get("/", (req, res) => {
  res.json({ message: "OTES server is running" });
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
