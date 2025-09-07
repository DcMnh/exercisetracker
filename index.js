const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

// Basic config
let userDatabase = [];
let idCounter = 1;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Create new user
app.post("/api/users", (req, res) => {
  let user = req.body.username;
  console.log("Username is: " + user);
  const id = idCounter++;

  // Adding user to the array with exercises field
  const newUser = {
    _id: id,
    username: user,
    exercises: [], // Add exercises array to store user's exercises
  };

  userDatabase.push(newUser);

  // Response (only return username and _id)
  res.json({
    username: user,
    _id: id,
  });
});

// Get all users
app.get("/api/users", (req, res) => {
  // Return only username and _id for each user
  const usersResponse = userDatabase.map((user) => ({
    username: user.username,
    _id: user._id.toString(),
  }));
  res.json(usersResponse);
});

// Add exercise to user
app.post(
  "/api/users/:_id/exercises",
  (req, res, next) => {
    let date = req.body.date;
    if (!date) {
      date = new Date().toDateString(); // Use current date as dateString format
    } else {
      date = new Date(date).toDateString(); // Convert provided date to dateString format
    }
    req.processedDate = date;
    next();
  },
  (req, res) => {
    const userId = parseInt(req.params._id);
    const user = userDatabase.find((user) => user._id === userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const description = req.body.description;
    const duration = parseInt(req.body.duration);
    const date = req.processedDate;

    // Create exercise object
    const exercise = {
      description: description,
      duration: duration,
      date: date,
    };

    // Add exercise to user's exercises array
    user.exercises.push(exercise);

    // Return user object with exercise fields added
    res.json({
      _id: user._id,
      username: user.username,
      description: description,
      duration: duration,
      date: date,
    });
  },
);

// Get user's exercise log
app.get("/api/users/:_id/logs", (req, res) => {
  const userId = parseInt(req.params._id);
  const user = userDatabase.find((user) => user._id === userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  let exercises = [...user.exercises]; // Create a copy of exercises

  // Handle query parameters for filtering
  const { from, to, limit } = req.query;

  // Filter by date range if from/to parameters are provided
  if (from || to) {
    exercises = exercises.filter((exercise) => {
      const exerciseDate = new Date(exercise.date);

      if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        return exerciseDate >= fromDate && exerciseDate <= toDate;
      } else if (from) {
        const fromDate = new Date(from);
        return exerciseDate >= fromDate;
      } else if (to) {
        const toDate = new Date(to);
        return exerciseDate <= toDate;
      }

      return true;
    });
  }

  // Apply limit if provided
  if (limit) {
    const limitNum = parseInt(limit);
    exercises = exercises.slice(0, limitNum);
  }

  // Return user object with log array and count
  res.json({
    _id: user._id,
    username: user.username,
    count: exercises.length,
    log: exercises,
  });
});

const listener = app.listen(process.env.PORT || 5000, "0.0.0.0", () => {
  console.log("Your app is listening on port " + listener.address().port);
});
