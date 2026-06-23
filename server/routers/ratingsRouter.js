const express = require("express");
const ratingsController = require("../controllers/ratingsController");

const router = express.Router();

router.get("/user/:userId", ratingsController.getUserRatings);
router.post("/", ratingsController.createRating);

module.exports = router;
