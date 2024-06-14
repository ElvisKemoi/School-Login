const router = require("express").Router();

const Class = require("../models/classModel");
// const

// Route to get all classes
router.get("/classes", async (req, res) => {
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
router.post("/classes", async (req, res) => {
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
router.get("/classes/:id", async (req, res) => {
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
router.post("/classes/delete/:id", async (req, res) => {
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
router.patch("/classes/:id", async (req, res) => {
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
router.post("/classes/:id/increment-members", async (req, res) => {
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

module.exports = router;
