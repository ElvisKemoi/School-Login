require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const exp = require("constants");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
	session({
		secret: "Our little secret.",
		resave: false,
		saveUninitialized: false,
	})
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/SMS");

// ADMIN SCHEMA DETAILS
const adminSchema = new mongoose.Schema({
	email: String,
	password: String,
	secret: String,
});

adminSchema.plugin(passportLocalMongoose);

const Admin = new mongoose.model("Admin", adminSchema);
passport.use("admin-local", Admin.createStrategy());

// STUDENT SCHEMA DETAILS
const studentSchema = new mongoose.Schema({
	email: String,
	password: String,
	secret: String,
});

studentSchema.plugin(passportLocalMongoose);

const Student = new mongoose.model("Student", studentSchema);
passport.use("student-local", Student.createStrategy());

//TEACHER SCHEMA DETAILS
const teacherSchema = new mongoose.Schema({
	email: String,
	password: String,
	secret: String,
});

teacherSchema.plugin(passportLocalMongoose);

const Teacher = new mongoose.model("Teacher", teacherSchema);
passport.use("teacher-local", Teacher.createStrategy());

// SERIALIZE AND DESERIALIZE
passport.serializeUser((user, done) => {
	let userType = "Student";
	if (user instanceof Admin) {
		userType = "Admin";
	} else if (user instanceof Teacher) {
		userType = "Teacher";
	}
	done(null, {
		id: user.id,
		type: userType,
	});
});

passport.deserializeUser(async (obj, done) => {
	try {
		let user;
		if (obj.type === "Admin") {
			user = await Admin.findById(obj.id);
		} else if (obj.type === "Teacher") {
			user = await Teacher.findById(obj.id);
		} else {
			user = await Student.findById(obj.id);
		}
		done(null, user);
	} catch (err) {
		done(err, null);
	}
});
app.get("/", (req, res) => {
	// res.render("home");
	res.render("album");
});

app.get("/login", (req, res) => {
	res.render("login-dark");
});

app.get("/register", (req, res) => {
	res.render("register1");
});

app.get("/dashboard", (req, res) => {
	console.log(req.user);
	console.log(req.session.passport.user.type);

	if (req.isAuthenticated()) {
		let dashType = req.session.passport.user.type;
		if (dashType === "Admin") {
			console.log("Admin Accessed");
			res.render("dashboardAdmin");
		} else if (dashType === "Student") {
			console.log("Students Accessed");
			res.render("dashboardStudent");
		} else if (dashType === "Teacher") {
			console.log("Teachers Accessed");
			res.render("dashboardTeacher");
		} else {
			res.send("You are not the admin");
		}
		// console.log("Secrets accessed");
		// // const allUsersWithSecrets = await User.find({ secret: { $ne: null } });
		// res.render("dashboardAdmin");
	} else {
		res.redirect("/login");
	}
});

app.get("/logout", (req, res) => {
	console.log(req.session);
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
	console.log(req.body);
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

	UserModel.register(
		{ username: req.body.username },
		req.body.password,
		(err, user) => {
			if (err) {
				console.log(err);
				res.redirect("/register");
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

	const user = new UserModel({
		username: req.body.username,
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
