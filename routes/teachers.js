const express = require("express");

const router = express.Router();
const Teacher = require("../models/teacherModel");

// Route for handling teachers list
router.get("/teachersList", (req, res) => {
	try {
		if (req.isAuthenticated()) {
			if (req.session.passport.user.type === "Admin") {
				res.render("teachersControl");
			} else {
				res.redirect("/login");
			}
		} else {
			res.redirect("/login"); // Redirect to login if not authenticated
		}
	} catch (error) {
		res.redirect("/login");
	}
});

//Add a new teacher to the list

router.post("/teachers/add", async (req, res) => {
	if (req.isAuthenticated()) {
		Teacher.register(
			{ username: req.body.username },
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

// Changing the password of a particular teacher
router.post("/teachers/:id/password", async (req, res) => {
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

//Getting the list of all teachers
router.get("/teachers", async (req, res) => {
	if (req.isAuthenticated()) {
		try {
			const teachers = await Teacher.find({});
			res.status(200).json(teachers);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	} else {
		req.redirect("/login");
	}
});

router.get("/teachers/:id", async (req, res) => {
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
router.post("/teachers/delete/:id", async (req, res) => {
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
router.post("/teachers/update/:id", async (req, res) => {
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

module.exports = router;
