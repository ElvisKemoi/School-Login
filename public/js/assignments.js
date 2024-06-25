async function uploadFile() {
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
		});
		return;
	}

	// Create a FormData object and append the file
	const formData = new FormData();
	const subject = document.getElementById("subject");
	const description = document.getElementById("instructions");
	const asClass = document.getElementById("AsClass");
	const deadlineDate = document.getElementById("deadlineDate");
	const deadlineTime = document.getElementById("deadlineTime");
	const more = {
		subject: subject.value,
		description: description.value,
		AsClass: asClass.value,
		deadlineDate: deadlineDate.value,
		deadlineTime: deadlineTime.value,
	};

	formData.append("file", file);
	formData.append("more", JSON.stringify(more));

	// Send the file to the server using fetch
	await fetch("/upload", {
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
		.then(async (data) => {
			await Swal.fire({
				title: "Sweet!",
				html: ` uploaded successfully!`,
				icon: "success",
			});
			await setTimeout(location.reload(), 4000);
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

const assignmentList = document.getElementById("assignmentList");
assignmentList.classList.add("invisible");

assignmentList.innerHTML = "";

async function getAssignments() {
	try {
		const response = await fetch("/assignments/all", {
			method: "POST",
		});
		if (!response.ok) {
			throw new Error("Network response was not ok " + response.statusText);
		}

		const allAssignments = await response.json();

		allAssignments.forEach((assignment) => {
			let assignmentId = assignment._id;
			let card = document.createElement("div");
			const formattedDate = formatDate(assignment.createdAt);
			const deadline = formatDate(assignment.deadline);

			card.classList.add("nature-card");

			card.innerHTML = `
			<div class="uk-card uk-card-small uk-card-default">
			  <div class="uk-card-header">
				<div class="uk-grid uk-grid-small uk-text-small" data-uk-grid>
				  <div class="uk-width-expand">
					<span class="cat-txt">${assignment.subject}</span>
				  </div>
				  <div class="uk-width-auto uk-text-right uk-text-muted">
					 ${assignment.AsClass}
				  </div>
				</div>
			  </div>
			  <!-- <div class="uk-card-media">
				<div class="uk-inline-clip uk-transition-toggle" tabindex="0">
				  <img
					class="lazy"
					data-src="https://picsum.photos/400/300/?random=5"
					data-width="400"
					data-height="300"
					data-uk-img
					alt=""
					src="img/transp.gif"
				  />
				  <div class="uk-transition-slide-bottom uk-position-bottom uk-overlay uk-overlay-primary">
					<span data-uk-icon="icon:heart; ratio: 0.8"></span> 12,345
					<span data-uk-icon="icon:comment; ratio: 0.8"></span> 12,345
				  </div>
				</div>
			  </div> -->
			  <div class="uk-card-body">
				<h6 class="uk-margin-small-bottom uk-margin-remove-adjacent uk-text-bold">
				  ${assignment.title}
				</h6>
				<p class="uk-text-small uk-text-muted">
				  ${assignment.description}
				</p>
			  </div>
			  <div class="uk-card-footer">
				<div class="uk-grid uk-grid-small uk-grid-divider uk-flex uk-flex-middle" data-uk-grid>
				  <div class="uk-width-expand" data-uk-tooltip="title: Uploaded">
					${formattedDate}
				  </div>
				  <div class="uk-width-auto uk-text-right">
					<!--<a href="#" data-uk-tooltip="title: Twitter" class="uk-icon-link" data-uk-icon="icon:twitter; ratio: 0.8"></a>
					<a href="#" data-uk-tooltip="title: Instagram" class="uk-icon-link" data-uk-icon="icon:instagram; ratio: 0.8"></a>
					<a href="#" data-uk-tooltip="title: Behance" class="uk-icon-link" data-uk-icon="icon:behance; ratio: 0.8"></a>
					<a href="#" data-uk-tooltip="title: Pinterest" class="uk-icon-link" data-uk-icon="icon:pinterest; ratio: 0.8"></a>-->
					<div data-uk-tooltip="title: Deadline" >
					<span data-uk-icon="icon:clock; ratio: 0.8"></span> ${deadline} </div>

				  </div>
				  <div class="uk-width-auto uk-text-right">
				  <form id="${assignmentId}" action="/assignments/delete/${assignmentId}" method="post">
				  <input type="hidden" name="filePath" value="${assignment.filePath}">

				  <button
					  type="button"
					  class="uk-icon-link"
					  title="Delete Assignment"
					  data-uk-tooltip
					  data-uk-icon="icon: trash"
					  onclick="confirmDelete('${assignmentId}')"
				  ></button>
			  </form>

				  </div>
				</div>
			  </div>
			</div>`;

			assignmentList.appendChild(card);
		});
		assignmentList.classList.remove("invisible");

		// Process the events data as needed
	} catch (error) {
		console.error("There has been a problem with your fetch operation:", error);
	}
}

getAssignments();

function confirmDelete(id) {
	Swal.fire({
		title: "Are you sure?",
		text: "You won't be able to revert this!",
		icon: "warning",
		confirmButtonText: "Yes, delete it!",
		showCancelButton: true,
		confirmButtonColor: "#3085d6",
		cancelButtonColor: "#d33",
	}).then((result) => {
		if (result.isConfirmed) {
			document.getElementById(id).submit();
		}
	});
}

function formatDate(dateString) {
	// Create a new Date object from the input date string
	const date = new Date(dateString);

	// Extract day, month, and year from the date object
	const day = date.getUTCDate();
	const month = date.getUTCMonth() + 1; // Months are zero-based, so add 1
	const year = date.getUTCFullYear();

	// Format day and month to be two digits
	const formattedDay = day < 10 ? "0" + day : day;
	const formattedMonth = month < 10 ? "0" + month : month;

	// Format year to be in yy format
	const formattedYear = year.toString().slice(-2);

	// Return the formatted date string in dd/mm/yy format
	return `${formattedDay}/${formattedMonth}/${formattedYear}`;
}
