const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		description: { type: String },
		filePath: { type: String, required: true, unique: true },
		createdBy: {
			type: String,

			required: true,
		},

		subject: { type: String, required: true },
		AsClass: { type: String, required: true },
		deadline: { type: Date, required: false },
	},
	{
		timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
	}
);

const Assignment = mongoose.model("Assignment", assignmentSchema);

module.exports = Assignment;
