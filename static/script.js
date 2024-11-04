// Create a new database
const db = new PouchDB('eventsDB');

// DOM elements
const monthYear = document.getElementById('monthYear');
const dates = document.getElementById('dates');
const prevMonth = document.getElementById('prevMonth');
const nextMonth = document.getElementById('nextMonth');
const modal = document.getElementById("eventModal");
const closeModal = document.getElementsByClassName("close")[0];
const eventForm = document.getElementById("eventForm");

// Initialize the current date
let currentDate = new Date();

// Navigation with keyboard arrows
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
        changeMonth(1);
    } else if (e.key === 'ArrowLeft') {
        changeMonth(-1);
    }
});

// Change month and re-render calendar
function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
    fetchEvents();
}

// Render the calendar
function renderCalendar() {
    currentDate.setDate(1);
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    // Set month and year header
    monthYear.textContent = currentDate.toLocaleString('default', { month: 'long' }) + ' ' + year;

    // Calculate the first and last days of the month
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    // Clear previous dates and add empty placeholders
    dates.innerHTML = '<div class="date empty"></div>'.repeat(firstDay);

    // Highlight today's date and generate calendar days
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    for (let day = 1; day <= lastDate; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === today ? ' today' : '';
        dates.innerHTML += `<div class="date${isToday}" data-date="${dateStr}">${day}</div>`;
    }
}

// Month navigation buttons
prevMonth.addEventListener('click', () => changeMonth(-1));
nextMonth.addEventListener('click', () => changeMonth(1));

// Open modal when a date is clicked
dates.addEventListener("click", (event) => {
    const clickedDate = event.target.closest('.date');
    if (clickedDate && !clickedDate.classList.contains("empty")) {
        openModal(clickedDate.getAttribute("data-date"), null); // Pass date and null for new event
    }
});

// Open modal and populate event data
async function openModal(date, eventId) {
    modal.style.display = "block";
    eventForm.dataset.date = date; // Store the date in the form for later use
    eventForm.dataset.eventId = eventId; // Store the event ID

    if (eventId) {
        const eventData = await fetchEvent(date, eventId);
        if (eventData) {
            document.getElementById("eventTitle").value = eventData?.title || '';
            document.getElementById("eventDescription").value = eventData?.description || '';
            document.getElementById("eventTags").value = eventData?.tags || '';
            document.getElementById("eventLink").value = eventData?.link || '';
        } else {
            console.error(`No event found for date: ${date} and eventId: ${eventId}`);
        }
    } else {
        // Reset form for new event
        eventForm.reset();
    }
}

// Close the modal
closeModal.onclick = () => {
    modal.style.display = "none";
};

// Save event data when form is submitted
eventForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent default form submission
    const date = eventForm.dataset.date; // Get the date from the form
    const eventId = eventForm.dataset.eventId || Date.now(); // Use eventId or generate new one
    const eventData = {
        _id: `${date}_${eventId}`, // Use date and eventId as the document ID
        title: document.getElementById("eventTitle").value,
        description: document.getElementById("eventDescription").value,
        tags: document.getElementById("eventTags").value,
        link: document.getElementById("eventLink").value,
    };

    try {
        await db.put(eventData); // Always update or create event
        console.log("Event saved successfully!");
        updateEventDisplay(date, eventData.title, eventId); // Use the correct function here
        modal.style.display = "none"; // Close the modal
        eventForm.reset(); // Reset the form
    } catch (err) {
        console.error("Error saving event:", err);
    }
});

// Fetch events from the database
async function fetchEvents() {
    try {
        const result = await db.allDocs({ include_docs: true });
        const events = result.rows.map(row => row.doc);

        // Clear previous event elements
        document.querySelectorAll('.event').forEach(eventEl => eventEl.remove());

        // Render events on the calendar
        events.forEach(event => updateEventDisplay(event._id.split('_')[0], event.title, event._id)); // Pass the full ID
    } catch (error) {
        console.error("Error fetching events:", error);
    }
}

// Fetch a specific event by date and ID
async function fetchEvent(date, eventId) {
    try {
        return await db.get(`${date}_${eventId}`); // Use the composite ID
    } catch (error) {
        console.error("Error fetching event:", error);
        return null; // Return null if there's an error
    }
}

// Update the display of events on the calendar
function updateEventDisplay(date, title, eventId) {
    const dateElement = document.querySelector(`.date[data-date="${date}"]`);
    if (dateElement) {
        const eventSpan = createEventElement(title, date, eventId); // Pass the event ID
        dateElement.appendChild(eventSpan); // Append event to the calendar
    }
}

// Create an event display element with a delete button
function createEventElement(title, date, eventId) {
    const eventSpan = document.createElement('div');
    eventSpan.classList.add('event');
    eventSpan.textContent = title;

    // Create delete button (red "X")
    const deleteButton = document.createElement('span');
    deleteButton.classList.add('delete-event');
    deleteButton.textContent = 'X'; 
    deleteButton.title = 'Delete Event';

    // Add event listener for deletion
    deleteButton.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent the date click event
        await deleteEvent(date, eventId, eventSpan); // Pass event ID
    });

    // Add event listener for editing
    eventSpan.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent the date click event
        openModal(date, eventId); // Open modal for editing
    });

    eventSpan.appendChild(deleteButton); // Append the delete button to the event
    return eventSpan;
}

// Delete an event from PouchDB and the UI
async function deleteEvent(date, eventId, eventSpan) {
    try {
        const eventDoc = await db.get(`${date}_${eventId}`); // Fetch the event document
        await db.remove(eventDoc); // Remove the event from PouchDB
        console.log(`Event with ID ${eventId} deleted successfully!`);
        eventSpan.remove(); // Remove the event from the calendar UI
    } catch (err) {
        console.error(`Error deleting event with ID ${eventId}:`, err);
    }
}

// Initial render
renderCalendar();
fetchEvents();
