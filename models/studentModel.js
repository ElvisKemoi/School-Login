const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const passport = require("passport");

const studentSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		lowercase: true,
	},
	password: {
		type: String,
	},
	joined: {
		type: Date,
		default: Date.now,
	},
	secret: {
		type: String,
	},
	class: {
		type: String,
		default: "",
	},
});

// studentSchema.plugin(passportLocalMongoose);

studentSchema.plugin(passportLocalMongoose);
const Student = mongoose.model("Student", studentSchema);
passport.use("student-local", Student.createStrategy());

module.exports = Student;
