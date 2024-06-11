const mongoose = require("mongoose");

const ClassSchema = new mongoose.Schema({
	className: { type: String, required: true, unique: true },
	classCode: { type: String, required: true, unique: true },
	classTeacher: { type: String, required: true, unique: true },
	members: { type: Number, required: false, default: "00" },
	created: {
		type: Date,
		default: Date.now,
	},
});

// Create the model
const Class = mongoose.model("Class", ClassSchema);

module.exports = Class;
