const mongoose = require("mongoose");

const ClassSchema = new mongoose.Schema({
	className: { type: String, required: true },
	classCode: { type: String, required: true, unique: true },
	classTeacher: { type: String, required: true, unique: true },
});

// Create the model
const Class = mongoose.model("Class", ClassSchema);

module.exports = Class;
