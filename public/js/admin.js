const eventsList = document.getElementById("eventList");

eventsList.innerHTML = "";

async function getEvents() {
	try {
		const response = await fetch("/events", {
			method: "GET",
		});

		if (!response.ok) {
			throw new Error("Network response was not ok " + response.statusText);
		}

		const allEvents = await response.json();
		allEvents.forEach((element) => {
			let li = document.createElement("li");
			const formattedDate = formatDate(element.eventDate);

			li.innerHTML = `
            <div><div class="uk-card uk-card-default uk-card-small" style="box-shadow: none" ><div class="uk-card-media-top">
												</div><div class="uk-card-header"><div class="uk-grid-small uk-flex-middle"
														data-uk-grid
													>
														<div class="uk-width-auto">
															<img
																class="uk-border-circle"
																alt=""
																width="40"
																height="40"
																src="https://unsplash.it/60/60/?random"
															/>
														</div>
														<div class="uk-width-expand">
															<h6 class="uk-margin-remove-bottom uk-text-bold">
																${element.author}
															</h6>
															<p
																class="uk-text-meta uk-margin-remove-top uk-text-small"
															>
																<time 
																	>${element.published}</time
																>
															</p>
														</div>
														<div
															class="uk-width-expand uk-text-right panel-icons"
														>
                                                        <form id="deleteForm" action="/events/delete/${element._id}" method="post">
                                                        <button
                                                            type="button"
                                                            class="uk-icon-link"
                                                            title="Delete Event"
                                                            data-uk-tooltip
                                                            data-uk-icon="icon: trash"
                                                            onclick="confirmDelete()"
                                                        ></button>
                                                    </form>
														</div>
													</div>
												</div>
												<div class="uk-card-body">
													<h4 class="uk-margin-small-bottom uk-text-bold">
														${element.title}
													</h4>
													<span class="uk-text-small"
														>${element.description}</span
													>
													<p class="fw-bold uk-text-warning">Event Date: ${formattedDate}</p>
												</div></div></div>`;
			eventsList.appendChild(li);
		});

		// Process the events data as needed
	} catch (error) {
		console.error("There has been a problem with your fetch operation:", error);
	}
}
getEvents();

function confirmDelete() {
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
			document.getElementById("deleteForm").submit();
		}
	});
}
function formatDate(dateString) {
	// Create a new Date object from the input date string
	const date = new Date(dateString);

	// Extract the day, month, and year from the Date object
	const day = date.getUTCDate();
	const month = date.toLocaleString("default", { month: "long" });
	const year = date.getUTCFullYear();

	// Return the formatted date string
	return `${day}, ${month}, ${year}`;
}

// Classes

const homeClassCards = document.getElementById("homeClassCards");
homeClassCards.classList.add("invisible");
homeClassCards.innerHTML = "";

async function getClasses() {
	try {
		const response = await fetch("/classes", {
			method: "GET",
		});

		if (!response.ok) {
			throw new Error("Network response was not ok " + response.statusText);
		}

		const allClasses = await response.json();

		allClasses.forEach((clas) => {
			const classCard = document.createElement("div");
			const localTimeString = new Date(clas.createdAt).toLocaleDateString();
			classCard.innerHTML = `
			<div class="uk-card uk-card-small uk-card-default">
			<div class="uk-card-header">
				<div class="uk-grid uk-grid-small uk-text-small" data-uk-grid>
					<div class="uk-width-expand">
						<span class="cat-txt"> ${clas.className}</span>
					</div>
					<div class="uk-width-auto uk-text-right uk-text-muted"  
					
					title="Date Created"
								data-uk-tooltip>
						<span data-uk-icon="icon:clock; ratio: 0.8"></span> ${localTimeString}
					</div>
				</div>
			</div>
			<div class="uk-card-body">
				<h6 class="uk-margin-small-bottom uk-margin-remove-adjacent uk-text-bold">${clas.classTeacher}</h6>
			</div>
			<div class="uk-card-footer">
				<div class="uk-grid uk-grid-small uk-grid-divider uk-flex uk-flex-middle" data-uk-grid>
					<div class="uk-width-expand uk-text-small text-nowrap overflow-hidden" 
					data-uk-tooltip
					title="Class Members"
					>
						${clas.members} Members  
					</div>
<!-- <div class="uk-width-auto uk-text-right">
						<a href="#" data-uk-tooltip="title: Twitter" class="uk-icon-link" data-uk-icon="icon:twitter; ratio: 0.8"></a>
						<a href="#" data-uk-tooltip="title: Instagram" class="uk-icon-link" data-uk-icon="icon:instagram; ratio: 0.8"></a>
						<a href="#" data-uk-tooltip="title: Behance" class="uk-icon-link" data-uk-icon="icon:behance; ratio: 0.8"></a>
						<a href="#" data-uk-tooltip="title: Pinterest" class="uk-icon-link" data-uk-icon="icon:pinterest; ratio: 0.8"></a>
					</div> -->
					<div class="uk-width-auto uk-text-right">
					<form id="${clas._id}" action="/classes/delete/${clas._id}" method="post">
					<button
						type="button"
						class="uk-icon-link"
						title="Remove Class"
						data-uk-tooltip
						data-uk-icon="icon: trash"
						onclick="confirmClassDelete('${clas._id}')"
					></button>
				</form>
					</div>
				</div>
			</div>
		</div>
			`;
			homeClassCards.appendChild(classCard);
		});
		homeClassCards.classList.remove("invisible");

		// Process the events data as needed
	} catch (error) {
		console.error("There has been a problem with your fetch operation:", error);
	}
}
getClasses();

function confirmClassDelete(id) {
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
