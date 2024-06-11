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
const fs = require("fs");

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
const teachersRoutes = require("./routes/teachers");

// Passport Configuration

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/SMS");

//IMPORTING ALL MONGOOSE MODELS
const Assignment = require("./models/assignmentModel");
const Class = require("./models/classModel");
const Student = require("./models/studentModel");
const Teacher = require("./models/teacherModel");

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
// const studentSchema = new mongoose.Schema({
// 	email: String,
// 	password: String,
// 	joined: String,
// 	secret: String,
// });

// passport.use("student-local", Student.createStrategy());

//TEACHER SCHEMA DETAILS
// const teacherSchema = new mongoose.Schema({
// 	email: String,
// 	password: String,
// 	joined: String,
// 	secret: String,
// });

// teacherSchema.plugin(passportLocalMongoose);

// const Teacher = new mongoose.model("Teacher", teacherSchema);
// passport.use("teacher-local", Teacher.createStrategy());

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
app.use("/", teachersRoutes);
app.use("/", eventsRoutes);
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

app.get("/dashboard", async (req, res) => {
	try {
		if (req.isAuthenticated()) {
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
app.get("/assignments", async (req, res) => {
	if (req.isAuthenticated()) {
		try {
			const allClasses = await Class.find();
			res.render("album", { classes: allClasses });
		} catch (err) {
			console.error(err);
			res.status(500).send("Internal Server Error");
		}
	} else {
		res.redirect("/login");
	}
});

//TEACHERS
/// Fetch all teachers

app.get("/teachers", async (req, res) => {
	if (req.isAuthenticated()) {
		try {
			const teachers = await Teacher.find();
			res.status(200).json(teachers);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	} else {
		req.redirect("/login");
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
			const teacherUserName = await Teacher.find(
				{ _id: req.params.id },
				{ username: true, _id: false }
			);
			// Ensure you have the username by accessing the first element of the result array
			const theUserName =
				teacherUserName.length > 0 ? teacherUserName[0].username : null;

			if (theUserName) {
				const allAssignments = await Assignment.find(
					{
						createdBy: theUserName,
					},
					{ filePath: true, _id: true }
				);
				allAssignments.forEach((assignment, index) => {
					deleteFile(assignment.filePath)
						.then(async () => {
							await Assignment.findByIdAndDelete(assignment._id);
							// console.log("File " + index + " Deleted");
						})
						.catch((error) => {
							console.error("Error deleting file " + index + ": ", error);
						});
				});

				// console.log(allAssignments);
			} else {
				console.log("No teacher found with the given ID");
			}

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
	// console.log(req.body);
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
			const asClass = data.AsClass;

			const newAssignment = new Assignment({
				title: name,
				description: description,
				filePath: filePath,
				createdBy: creator,
				createdAt: creationDate,
				subject: subject,
				AsClass: asClass,
			});

			const saveStatus = await newAssignment.save();

			res.status(201).json({
				message: "File uploaded and saved successfully",
				assignment: saveStatus,
			});
			// res.redirect("/assignments");
		}
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error uploading file", error: error.message });
	}
});

// 1. Get all assignments
app.get("/assignments/all", async (req, res) => {
	try {
		const assignments = await Assignment.find();
		res.json(assignments);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

app.post("/assignments/all", async (req, res) => {
	// console.log(req.user);
	if (req.isAuthenticated()) {
		try {
			const assignments = await Assignment.find({
				createdBy: req.user.username,
			});
			res.json(assignments);
		} catch (err) {
			res.status(500).json({ message: err.message });
		}
	} else {
		res.redirect("/login");
	}
});

// 2. Get assignment by ID
app.get("/assignments/:id", async (req, res) => {
	if (req.isAuthenticated()) {
		try {
			const assignment = await Assignment.findById(req.params.id);
			if (assignment == null) {
				return res.status(404).json({ message: "Cannot find assignment" });
			}
			res.json(assignment);
		} catch (err) {
			res.status(500).json({ message: err.message });
		}
	} else {
		res.redirect("/login");
	}
});

// 3. Delete assignment by ID
app.post("/assignments/delete/:id", async (req, res) => {
	if (req.isAuthenticated()) {
		try {
			const deleteStatus = await deleteFile(req.body.filePath);

			// Check if deleteStatus is false and throw an error
			if (!deleteStatus) {
				throw new Error("File deletion failed");
			}

			const assignment = await Assignment.findByIdAndDelete(req.params.id);
			if (!assignment) {
				return res.status(404).json({ message: "Cannot find assignment" });
			}
			// res.json({ message: "Deleted assignment" });
			res.redirect("/assignments");
		} catch (err) {
			res.status(500).json({ message: err.message });
		}
	} else {
		res.redirect("/login");
	}
});

// 4. Getting all assignments for a particular class
app.get("/assignments/get/:class", async (req, res) => {
	try {
		const className = req.params.class;
		const assignments = await Assignment.find({ AsClass: className });
		res.status(200).json(assignments);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

function deleteFile(filePath) {
	return new Promise((resolve) => {
		fs.unlink(filePath, (err) => {
			if (err) {
				console.error("Error removing file:", err);
				resolve(false);
			} else {
				console.log("File removed successfully");
				resolve(true);
			}
		});
	});
}

async function Numbers() {
	const studentsList = await Student.find({});
	const studentNumbers = studentsList.length;

	const teachersList = await Teacher.find({});
	const teachersNumbers = teachersList.length;

	const assignmentsList = await Assignment.find({});
	const assignmentsNumbers = assignmentsList.length;

	const classList = await Class.find({});
	const classNumbers = classList.length;

	return {
		studentNumbers: studentNumbers,
		teachersNumbers: teachersNumbers,
		assignmentsNumbers: assignmentsNumbers,
		classNumbers: classNumbers,
	};
}

// CLASSES
// TODO 1. Make a route to get all the classes

// Route to get all classes
app.get("/classes", async (req, res) => {
	try {
		if (req.isAuthenticated()) {
			const classes = await Class.find();
			res.json(classes);
		} else {
			res.redirect("/login");
		}
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// Route to create a new class
app.post("/classes", async (req, res) => {
	try {
		const { className, classCode, classTeacher } = req.body;

		// Create a new class
		const newClass = new Class({
			className: className,
			classCode: className,
			classTeacher: classTeacher,
		});

		// Save the class to the database
		const savedClass = await newClass.save();

		// Send a response back to the client
		// res.status(201).json(savedClass);
		res.redirect("/dashboard");
	} catch (error) {
		// Handle errors
		console.error("Error creating class:", error);
		res
			.status(500)
			.json({ message: "Error creating class", error: error.message });
	}
});
// Route to get a specific class by ID
app.get("/classes/:id", async (req, res) => {
	try {
		if (req.isAuthenticated()) {
			const classItem = await Class.findById(req.params.id);
			if (!classItem)
				return res.status(404).json({ message: "Class not found" });
			res.json(classItem);
		} else {
			res.redirect("/login");
		}
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// Route to delete a specific class by ID
app.post("/classes/delete/:id", async (req, res) => {
	try {
		if (req.isAuthenticated()) {
			const classItem = await Class.findById(req.params.id);

			if (!classItem) {
				return res.status(404).json({ message: "Class not found" });
			}

			await Class.findByIdAndDelete(req.params.id); // Using findByIdAndDelete for direct deletion

			res.redirect("/dashboard");
		} else {
			req.redirect("/login");
		}
	} catch (err) {
		console.error("Error deleting class:", err); // Log the error for debugging
		res.status(500).json({ message: "Internal Server Error" });
	}
});

// Route to update a specific detail of a class by ID
app.patch("/classes/:id", async (req, res) => {
	try {
		const classItem = await Class.findById(req.params.id);
		if (!classItem) return res.status(404).json({ message: "Class not found" });

		// Update class with the fields provided in the request body
		Object.keys(req.body).forEach((key) => {
			classItem[key] = req.body[key];
		});

		await classItem.save();
		res.json(classItem);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// Function to increment the number of members in the class by one
app.post("/classes/:id/increment-members", async (req, res) => {
	try {
		const classItem = await Class.findById(req.params.id);
		if (!classItem) return res.status(404).json({ message: "Class not found" });

		classItem.members += 1;
		await classItem.save();
		res.json(classItem);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// STUDENTS
// Route to update the class of a student
app.post("/students/:id/class", async (req, res) => {
	if (req.isAuthenticated()) {
		const studentId = req.params.id;
		const newClass = req.body.newClass;

		try {
			const student = await Student.findByIdAndUpdate(
				studentId,
				{ class: newClass },
				{ new: true }
			);

			if (!student) {
				return res.status(404).json({ message: "Student not found" });
			}

			res.json(student);
			res.redirect("/dashboard");
		} catch (err) {
			res.status(500).json({ message: err.message });
		}
	} else {
		res.redirect("/login");
	}
});
