const express = require("express");
const router = express.Router();
const Event = require("../models/events");

// Route to get all events
router.get("/events", async (req, res) => {
	try {
		const events = await Event.find();
		const sortedEvents = events.sort(
			(a, b) => new Date(a.eventDate) - new Date(b.eventDate)
		);

		res.status(200).json(sortedEvents);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// Route to get a specific event by ID
router.get("/events/:id", async (req, res) => {
	try {
		const event = await Event.findById(req.params.id);
		if (event) {
			res.status(200).json(event);
		} else {
			res.status(404).json({ message: "Event not found" });
		}
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// Route to insert one event
router.post("/events", async (req, res) => {
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

	const event = new Event({
		author: req.user.username,
		published: getCurrentDate(),
		title: req.body.title,
		description: req.body.description,
		eventDate: req.body.eventDate,
	});

	try {
		const newEvent = await event.save();
		res.redirect("/dashboard");
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
});

// Route to delete one event by ID
router.post("/events/delete/:id", async (req, res) => {
	try {
		const event = await Event.findByIdAndDelete(req.params.id);
		if (event) {
			res.redirect("/dashboard");
		} else {
			res.status(404).json({ message: "Event not found" });
		}
	} catch (err) {
		if (err.kind === "ObjectId") {
			res.status(400).json({ message: "Invalid Event ID" });
		} else {
			res.status(500).json({ message: err.message });
		}
	}
});

// Route to update the content of a particular event
router.patch("/events/:id", async (req, res) => {
	try {
		const event = await Event.findById(req.params.id);
		if (event) {
			if (req.body.title != null) {
				event.title = req.body.title;
			}
			if (req.body.published != null) {
				event.published = req.body.published;
			}
			if (req.body.description != null) {
				event.description = req.body.description;
			}
			if (req.body.eventDate != null) {
				event.eventDate = req.body.eventDate;
			}
			const updatedEvent = await event.save();
			res.status(200).json(updatedEvent);
		} else {
			res.status(404).json({ message: "Event not found" });
		}
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
});

module.exports = router;
