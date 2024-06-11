const express = require("express");
const router = express.Router();

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

module.exports = router;
