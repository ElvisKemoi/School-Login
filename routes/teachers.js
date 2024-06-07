const express = require("express");
const router = express.Router();

// Route for handling teachers list
router.get("/teachersList", (req, res) => {
	try {
		if (req.isAuthenticated()) {
			console.log(req);
			if (req.user.userType === "Admin") {
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
