const mongoose = require("mongoose");

const ClassSchema = new mongoose.Schema(
	{
		className: { type: String, required: true, unique: true },
		classCode: { type: String, required: true, unique: true },
		classTeacher: {
			type: String,
			required: false,
			unique: false,
			default: "Insert Class Teacher",
		},
		members: { type: Number, required: false, default: "00" },
	},
	{
		timestamps: true,
	}
);

// Create the model
const Class = mongoose.model("Class", ClassSchema);

module.exports = Class;
