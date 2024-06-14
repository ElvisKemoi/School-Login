const router = require("express").Router();

const Student = require("../models/studentModel");

router.post("/students/:id/class", async (req, res) => {
	if (req.isAuthenticated()) {
		const studentId = req.params.id;
		const newClass = await req.body.newClass;

		try {
			const student = await Student.findByIdAndUpdate(
				studentId,
				{ class: newClass },
				{ new: true }
			);

			if (!student) {
				return res.status(404).json({ message: "Student not found" });
			} else if (student.class === newClass) {
				res.redirect("/dashboard");
			} else {
				throw Error("Class not updated");
			}
		} catch (err) {
			res.status(500).json({ message: err.message });
		}
	} else {
		res.redirect("/login");
	}
});

module.exports = router;
