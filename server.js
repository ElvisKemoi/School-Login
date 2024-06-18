require("dotenv").config();
require("ejs");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const port = process.env.PORT || 3000;
const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// CREATING SESSION
app.use(
	session({
		secret: "Our little secret.",
		resave: false,
		saveUninitialized: false,
		cookie: {
			maxAge: 30 * 60 * 1000,
		},
	})
);

// DATABASE CONNECTION
mongoose.connect("mongodb://localhost:27017/SMS");

// IMPORTING ROUTES
const eventsRoutes = require("./routes/events");
const teachersRoutes = require("./routes/teachers");
const assignmentRoutes = require("./routes/assignmentRoute");
const classRoutes = require("./routes/classRoutes");
const studentRoutes = require("./routes/studentRoutes");
const commonRoutes = require("./routes/commonRoutes");
app.use("/", teachersRoutes);
app.use("/", eventsRoutes);
app.use("/", assignmentRoutes);
app.use("/", classRoutes);
app.use("/", studentRoutes);
app.use("/", commonRoutes);

// Ensure error handling middleware is set up
app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).send("Something went wrong!");
});
app.listen(port, () => {
	console.log(`Server is live on port ${port}`);
});
