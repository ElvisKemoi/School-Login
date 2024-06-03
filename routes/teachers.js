const express = require("express");
const router = express.Router();

// Route for handling teachers list
router.get("/teachersList", (req, res) => {
	if (req.isAuthenticated()) {
		res.render("teachersControl");
	} else {
		res.redirect("/login"); // Redirect to login if not authenticated
	}
});

module.exports = router;
