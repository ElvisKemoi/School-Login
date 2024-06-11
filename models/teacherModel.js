const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const passport = require("passport");

const teacherSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true,
		trim: true,
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
});

teacherSchema.plugin(passportLocalMongoose);
const Teacher = new mongoose.model("Teacher", teacherSchema);
passport.use("teacher-local", Teacher.createStrategy());
module.exports = Teacher;
