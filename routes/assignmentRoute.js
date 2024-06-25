const express = require("express");
const router = express.Router();
const Assignment = require("../models/assignmentModel");
const Class = require("../models/classModel");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const {
	combineDateTime,
	formatDate,
	deadlineReached,
} = require("../functions/functions");
const passportConfig = require("../passportConfig");
passportConfig(router);

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

router.get("/assignments", async (req, res) => {
	if (req.isAuthenticated()) {
		try {
			const [allClasses, assignments] = await Promise.all([
				Class.find(),
				Assignment.find(),
			]);

			res.render("assignmentsPanel", {
				classes: allClasses,
				assignments: assignments,
				formatDate: formatDate,
				deadlineReached: deadlineReached,
			});
		} catch (err) {
			console.error(err);
			res.status(500).send("Internal Server Error");
		}
	} else {
		res.redirect("/login");
	}
});

// Handle file upload and save metadata to MongoDB
router.post("/upload", upload.single("file"), async (req, res) => {
	try {
		if (req.isAuthenticated()) {
			const data = JSON.parse(req.body.more);
			const filePath = req.file.path;
			const creator = req.user.username;
			const goodTitle = req.file.originalname.split(".");
			const name = goodTitle[0];
			const description = data.description;
			const subject = data.subject;
			const asClass = data.AsClass;
			const deadlineDate = data.deadlineDate;
			const deadlineTime = data.deadlineTime;
			const deadline = combineDateTime(deadlineDate, deadlineTime);

			const newAssignment = new Assignment({
				title: name,
				description: description,
				filePath: filePath,
				createdBy: creator,
				subject: subject,
				AsClass: asClass,
				deadline: deadline,
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
router.get("/assignments/all", async (req, res) => {
	try {
		const assignments = await Assignment.find();
		res.json(assignments);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

router.post("/assignments/all", async (req, res) => {
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
router.get("/assignments/:id", async (req, res) => {
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

async function deleteFile(filePath) {
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

// 3. Delete assignment by ID
router.post("/assignments/delete/:id", async (req, res) => {
	if (req.isAuthenticated()) {
		const referer = req.headers.referer || req.get("referer");
		const refererArray = referer.split("/");
		const originRoute = refererArray[refererArray.length - 1];

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

			res.redirect(`/${originRoute}`);
		} catch (err) {
			res.status(500).json({ message: err.message });
		}
	} else {
		res.redirect("/login");
	}
});

// 4. Getting all assignments for a particular class
router.get("/assignments/get/:class", async (req, res) => {
	try {
		const className = req.params.class;
		const assignments = await Assignment.find({ AsClass: className });
		res.status(200).json(assignments);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// 5. Downloading assignments
router.get("/assignments/download/:id", async (req, res) => {
	try {
		const assignment = await Assignment.findById(req.params.id);
		if (!assignment) {
			return res.status(404).json({ error: "Assignment not found" });
		}

		const filePath = path.resolve(assignment.filePath);
		res.download(filePath, (err) => {
			if (err) {
				console.error("Error downloading file", err);
				return res.status(500).json({ error: "Error downloading file" });
			}
		});
	} catch (err) {
		console.error("Error fetching assignment", err);
		res.status(500).json({ error: "Server error" });
	}
});

module.exports = router;
