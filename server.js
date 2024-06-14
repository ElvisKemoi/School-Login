require("dotenv").config();
require("ejs");
const express = require("express");
const bodyParser = require("body-parser");
// const exp = require("constants");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
// const passportLocalMongoose = require("passport-local-mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { Numbers, countMembers } = require("./functions/functions");

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
	session({
		secret: "Our little secret.",
		resave: false,
		saveUninitialized: false,
	})
);

// IMPORTING ROUTES
const eventsRoutes = require("./routes/events");
const teachersRoutes = require("./routes/teachers");
const assignmentRoutes = require("./routes/assignmentRoute");
const classRoutes = require("./routes/classRoutes");
const studentRoutes = require("./routes/studentRoutes");

mongoose.connect("mongodb://localhost:27017/SMS");

// Passport Configuration
const passportConfig = require("./passportConfig");
passportConfig(app);

//IMPORTING ALL  MODELS
const Assignment = require("./models/assignmentModel");
const Class = require("./models/classModel");
const Student = require("./models/studentModel");
const Teacher = require("./models/teacherModel");
const Admin = require("./models/adminModel");
app.use("/", teachersRoutes);
app.use("/", eventsRoutes);
app.use("/", assignmentRoutes);
app.use("/", classRoutes);
app.use("/", studentRoutes);

app.get("/", (req, res) => {
	res.render("home");
});

app.get("/login", (req, res) => {
	res.render("login-dark");
});

app.get("/register", (req, res) => {
	res.render("register");
});

app.get("/dashboard", async (req, res) => {
	try {
		if (req.isAuthenticated()) {
			countMembers();

			let dashType = req.session.passport.user.type;
			let numbers = await Numbers();
			let classes = await Class.find();
			let allTeachers = await Teacher.find();
			let studentFoundClass;
			let classAssignmentsGiven;
			if (dashType === "Student") {
				let studentClass = await Student.findById(req.session.passport.user.id);
				studentFoundClass = studentClass.class;
				classAssignmentsGiven = await Assignment.find({
					AsClass: studentFoundClass,
				});
			} else {
				studentFoundClass = null;
			}

			let data = {
				userName: req.user.username,
				userId: req.user._id,
				userType: dashType,
				numbers: numbers,
				classes: classes,
				allTeachers: allTeachers,
				studentClass: studentFoundClass,
				classAssignments: [],
			};
			if (classAssignmentsGiven) {
				classAssignmentsGiven.forEach((assignment) => {
					data.classAssignments.push(assignment);
				});
			}

			// console.log(classAssignmentsGiven);
			switch (dashType) {
				case "Admin":
					res.render("dashboardAdmin", data);
					break;
				case "Student":
					res.render("dashboardStudent", data);
					break;
				case "Teacher":
					res.render("dashboardTeacher", data);
					break;
				default:
					res.status(403).send("You do not have access to this page");
			}
		} else {
			res.redirect("/login");
		}
	} catch (error) {
		console.error("Error accessing the dashboard:", error);
		res.status(500).send("Internal Server Error");
	}
});

app.get("/logout", (req, res) => {
	// console.log(req.session);
	// req.logOut();
	req.session.destroy((err) => {
		if (err) {
			console.log("Error destroying session:", err);
		}
		res.redirect("/");
	});
});

// Register Route
app.post("/register", (req, res) => {
	// console.log(req.body);
	const userType = req.body.userType; // Assuming userType is passed in the request body
	let UserModel;
	if (userType === "Admin") {
		UserModel = Admin;
	} else if (userType === "Teacher") {
		UserModel = Teacher;
	} else if (userType === "Student") {
		UserModel = Student;
	} else {
		return res.status(400).send("Invalid user type");
	}
	const lowerUsername = req.body.username;

	UserModel.register(
		{ username: lowerUsername },
		req.body.password,
		(err, user) => {
			if (err) {
				res.status(500).send(err.message);
			} else {
				passport.authenticate(`${userType.toLowerCase()}-local`)(
					req,
					res,
					() => {
						res.redirect("/dashboard");
					}
				);
			}
		}
	);
	countMembers();
});

// Login Route
app.post("/login", async (req, res) => {
	const userType = req.body.userType; // Assuming userType is passed in the request body
	let UserModel;
	if (userType === "Admin") {
		UserModel = Admin;
	} else if (userType === "Teacher") {
		UserModel = Teacher;
	} else if (userType === "Student") {
		UserModel = Student;
	} else {
		return res.status(400).send("Invalid user type");
	}
	const userNameLower = req.body.username;

	const user = new UserModel({
		username: userNameLower,
		password: req.body.password,
	});

	req.login(user, (err) => {
		if (err) {
			console.log(err);
		} else {
			passport.authenticate(`${userType.toLowerCase()}-local`)(req, res, () => {
				res.redirect("/dashboard");
			});
		}
	});
});

// Ensure error handling middleware is set up
app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).send("Something went wrong!");
});
app.listen(3000, () => {
	console.log("Server is live on port 3000");
});
