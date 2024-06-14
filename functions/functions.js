const Student = require("../models/studentModel");
const Teacher = require("../models/teacherModel");
const Class = require("../models/classModel");
const Assignment = require("../models/assignmentModel");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

function deleteFile(filePath) {
	return new Promise((resolve) => {
		fs.unlink(filePath, (err) => {
			if (err) {
				console.error("Error removing file:", err);
				resolve(false);
			} else {
				console.log("File removed successfully");
				resolve(true);
			}
		});
	});
}

async function Numbers() {
	const studentsList = await Student.find({});
	const studentNumbers = studentsList.length;

	const teachersList = await Teacher.find({});
	const teachersNumbers = teachersList.length;

	const assignmentsList = await Assignment.find({});
	const assignmentsNumbers = assignmentsList.length;

	const classList = await Class.find({});
	const classNumbers = classList.length;

	return {
		studentNumbers: studentNumbers,
		teachersNumbers: teachersNumbers,
		assignmentsNumbers: assignmentsNumbers,
		classNumbers: classNumbers,
	};
}
// FUNCTION TO UPDATE THE MEMBER COUNT
// TODO 1. GET ALL CLASSES THAT ARE AVAILABLE IN THE DB
async function getClasses() {
	const availableClasses = await Class.find(
		{},
		{ _id: false, className: true }
	);
	const classArr = [];
	availableClasses.forEach((item) => {
		classArr.push(item.className);
	});
	return classArr;
}

// TODO 2. FOR EACH CLASS, COUNT THE STUDENTS WHO HAVE THE CLASS
async function countMembers() {
	const allClasses = await getClasses(); // Await the getClasses function

	const numbers = await Promise.all(
		allClasses.map(async (className) => {
			const count = await counter(className);
			return { className, count };
		})
	);

	// TODO 3. UPDATE THE CLASS MEMBERS.
	await updateClassMembers(numbers);
}

async function counter(className) {
	let number = await Student.countDocuments({ class: className });
	return number;
}

// Function to update class members
async function updateClassMembers(classCounts) {
	for (const { className, count } of classCounts) {
		await Class.updateOne(
			{ className: className },
			{ $set: { members: count } }
		);
	}
}

module.exports = { deleteFile, Numbers, countMembers };
