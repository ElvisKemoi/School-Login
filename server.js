require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const exp = require("constants");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const multer = require("multer");
const path = require("path");

const teachersRoutes = require("./routes/teachers");

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

const eventsRoutes = require("./routes/events");
app.use("/", eventsRoutes);
app.use("/", teachersRoutes);
// Passport Configuration

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/SMS");

const Assignment = require("./models/assignmentModel");

// ADMIN SCHEMA DETAILS
const adminSchema = new mongoose.Schema({
	email: String,
	password: String,
	joined: String,
	secret: String,
});

adminSchema.plugin(passportLocalMongoose);

const Admin = new mongoose.model("Admin", adminSchema);
passport.use("admin-local", Admin.createStrategy());

// STUDENT SCHEMA DETAILS
const studentSchema = new mongoose.Schema({
	email: String,
	password: String,
	joined: String,
	secret: String,
});

studentSchema.plugin(passportLocalMongoose);

const Student = new mongoose.model("Student", studentSchema);
passport.use("student-local", Student.createStrategy());

//TEACHER SCHEMA DETAILS
const teacherSchema = new mongoose.Schema({
	email: String,
	password: String,
	joined: String,
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
	res.render("cover");
});

app.get("/login", (req, res) => {
	res.render("login-dark");
});

app.get("/register", (req, res) => {
	res.render("register1");
});

app.get("/dashboard", (req, res) => {
	// console.log(req.user);
	// console.log(req.session.passport.user.type);

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
			res.render("dashboardTeacher", {
				userName: req.user.username,
				userId: req.user._id,
				userType: dashType,
			});
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

	UserModel.register(
		{ username: req.body.username, joined: getCurrentDate() },
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

// Assignments

app.get("/assignments", (req, res) => {
	if (req.isAuthenticated()) {
		res.render("album");
	} else {
		res.redirect("/login");
	}
});

//TEACHERS
/// Fetch all teachers
app.get("/teachers", async (req, res) => {
	try {
		const teachers = await Teacher.find();
		res.status(200).json(teachers);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

//Add a new teacher to the list

app.post("/teachers/add", async (req, res) => {
	if (req.isAuthenticated()) {
		Teacher.register(
			{ username: req.body.username, joined: getCurrentDate() },
			req.body.password,
			(err, user) => {
				if (err) {
					res.status(500).json({ error: err });
					console.log(err);
					// res.redirect("/register");
				} else {
					res.redirect("/teachersList");
					// passport.authenticate(`${userType.toLowerCase()}-local`)(
					// 	req,
					// 	res,
					// 	() => {
					// 		res.redirect("/dashboard");
					// 	}
					// );
				}
			}
		);
	}
});

// Fetch a particular teacher based on the ID
app.get("/teachers/:id", async (req, res) => {
	try {
		const teacher = await Teacher.findById(req.params.id);
		if (!teacher) {
			return res.status(404).json({ error: "Teacher not found" });
		}
		res.status(200).json(teacher);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Delete a particular teacher
app.post("/teachers/delete/:id", async (req, res) => {
	try {
		if (req.isAuthenticated()) {
			const teacher = await Teacher.findByIdAndDelete(req.params.id);
			if (!teacher) {
				return res.status(404).json({ error: "Teacher not found" });
			}
			res.redirect("/teachersList");
		} else {
			res.status(401).send("Unauthorized Action");
		}
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Update a particular detail in the teacher DB
app.post("/teachers/update/:id", async (req, res) => {
	console.log(req.body);
	try {
		const updates = req.body;
		const teacher = await Teacher.findByIdAndUpdate(req.params.id, updates, {
			new: true,
		});
		if (!teacher) {
			return res.status(404).json({ error: "Teacher not found" });
		}
		res.status(200).json(teacher);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});
// Update the password of a particular teacher based on the ID
app.post("/teachers/:id/password", async (req, res) => {
	try {
		const { password } = req.body;
		const teacher = await Teacher.findById(req.params.id);
		if (!teacher) {
			return res.status(404).json({ error: "Teacher not found" });
		}
		teacher.setPassword(password, async (err) => {
			if (err) {
				return res.status(500).json({ error: err.message });
			}
			await teacher.save();
			res.status(200).redirect("/login");
			// res.status(200).json({ message: "Password updated successfully" });
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});
function getCurrentDate() {
	const months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	const today = new Date();
	const day = String(today.getDate()).padStart(2, "0");
	const month = months[today.getMonth()];
	const year = today.getFullYear();
	return `${day}, ${month}, ${year}`;
}

// Assignments
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "Assignments/Given");
	},
	filename: (req, file, cb) => {
		// Use the original name of the file
		cb(null, file.originalname);
	},
});

const upload = multer({
	storage: storage,
	fileFilter: (req, file, cb) => {
		const validTypes = [
			"text/plain",
			"application/pdf",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		];
		if (validTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error("Invalid file type"), false);
		}
	},
});

// Handle file upload and save metadata to MongoDB
app.post("/upload", upload.single("file"), async (req, res) => {
	try {
		if (req.isAuthenticated()) {
			const data = JSON.parse(req.body.more);

			const filePath = req.file.path;

			const creator = req.user.username;
			const creationDate = getCurrentDate();
			const goodTitle = req.file.originalname.split(".");
			const name = goodTitle[0];
			const description = data.description;
			const subject = data.subject;

			const newAssignment = new Assignment({
				title: name,
				description: description,
				filePath: filePath,
				createdBy: creator,
				createdAt: creationDate,
				subject: subject,
			});

			const saveStatus = await newAssignment.save();

			res.status(201).json({
				message: "File uploaded and saved successfully",
				assignment: saveStatus,
			});
		}
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error uploading file", error: error.message });
	}
});
