function uploadFile() {
	const fileInput = document.getElementById("fileInput");

	const file = fileInput.files[0];

	// Check if a file is selected
	if (!file) {
		Swal.fire({
			icon: "error",
			title: "Oops...",
			text: "Please select a file.",
		});
		return;
	}

	// List of valid MIME types
	const validTypes = [
		"text/plain",
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	];

	// Check if the selected file type is valid
	if (!validTypes.includes(file.type)) {
		Swal.fire({
			icon: "error",
			title: "Oops...",
			text: "Invalid file type. Only TXT, PDF, and Word documents are allowed.",
			footer: '<a href="#">Why do I have this issue?</a>',
		});
		return;
	}

	// Create a FormData object and append the file
	const formData = new FormData();
	const subject = document.getElementById("subject");
	const description = document.getElementById("instructions");
	const more = {
		subject: subject.value,
		description: description.value,
	};

	formData.append("file", file);
	formData.append("more", JSON.stringify(more));

	// Send the file to the server using fetch
	fetch("/upload", {
		method: "POST",
		body: formData,
	})
		.then((response) => {
			if (response.status === 201) {
				return response.json();
			} else {
				return Swal.fire({
					icon: "error",
					title: "Oops...",
					text: "File upload failed.",
				});
			}
		})
		.then((data) => {
			Swal.fire({
				title: "Sweet!",
				html: ` uploaded successfully!`,
				icon: "success",
			});
		})
		.then(resetForm())
		.catch((error) => {
			console.error("Error:", error);
			Swal.fire({
				icon: "error",
				title: "Oops...",
				text: "File upload failed.",
			});
		});
}

function resetForm() {
	document.getElementById("uploadForm").reset();
}
