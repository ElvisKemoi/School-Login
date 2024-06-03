const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
	title: { type: String, required: true },
	description: { type: String },
	filePath: { type: String, required: true },
	createdBy: {
		type: String,

		required: true,
	},
	createdAt: { type: Date, default: Date.now },
	subject: { type: String, required: true },
});

const Assignment = mongoose.model("Assignment", assignmentSchema);

module.exports = Assignment;
