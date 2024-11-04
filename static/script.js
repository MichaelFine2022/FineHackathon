import PouchDB from 'pouchdb';
//create a new database
const db = new PouchDB('eventsDB');


const monthYear = document.getElementById('monthYear');
const dates = document.getElementById('dates');
const prevMonth = document.getElementById('prevMonth');
const nextMonth = document.getElementById('nextMonth');

// Initialize the current date
let currentDate = new Date();

// Render the calendar
function renderCalendar() {
    currentDate.setDate(1);
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    // Set month and year header
    monthYear.textContent = currentDate.toLocaleString('default', { month: 'long' }) + ' ' + year;

    // Get the first and last days of the month
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    // Clear previous dates
    dates.innerHTML = '';

    // Add blank divs for the days before the start of the month
    for (let i = 0; i < firstDay; i++) {
        dates.innerHTML += '<div class="date empty"></div>';
    }

    // Generate days with data-date attributes
    for (let day = 1; day <= lastDate; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dates.innerHTML += `<div class="date" data-date="${dateStr}">${day}</div>`;
    }
}

// Month navigation buttons
prevMonth.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    fetchEvents();
});

nextMonth.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    fetchEvents();
});

// Event modal elements
const modal = document.getElementById("eventModal");
const closeModal = document.getElementsByClassName("close")[0];
const eventForm = document.getElementById("eventForm");

// Data structure for storing events
let events = {};

// Open modal when a date is clicked
dates.addEventListener("click", function(event) {
    if (event.target.classList.contains("date") && !event.target.classList.contains("empty")) {
        modal.style.display = "block";
        const date = event.target.getAttribute("data-date");
        eventForm.dataset.date = date;
        const eventData = events[date];
        
        document.getElementById("eventTitle").value = eventData?.title || '';
        document.getElementById("eventDescription").value = eventData?.description || '';
        document.getElementById("eventTags").value = eventData?.tags || '';
        document.getElementById("eventLink").value = eventData?.link || '';
    }
});

// Close the modal
closeModal.onclick = function() {
    modal.style.display = "none";
};

// Save event data when form is submitted
// Submit form to save event
eventForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const date = eventForm.dataset.date; // Get the date from the form
    const title = document.getElementById("eventTitle").value; // Get title from input
    const description = document.getElementById("eventDescription").value;
    const tags = document.getElementById("eventTags").value;
    const link = document.getElementById("eventLink").value;

    // Save event details in `events` object
    events[date] = { title, description, tags, link };

    // Display event title on calendar date (as a sample display)
    const dateElement = document.querySelector(`.date[data-date="${date}"]`);
    
    // If the event already exists, replace the title; otherwise, append it
    const eventSpan = dateElement.querySelector('.event');
    if (eventSpan) {
        eventSpan.textContent = title; // Update existing event
    } else {
        const newEventSpan = document.createElement('div');
        newEventSpan.classList.add('event');
        newEventSpan.textContent = title; // Create new event
        dateElement.appendChild(newEventSpan);
    }

    modal.style.display = "none"; // Close modal
    eventForm.reset(); // Reset form
});

async function fetchEvents() {
    try {
        const response = await fetch('/events');
        if (!response.ok) {
            console.error("Error fetching events:", response.statusText);
            return;
        }
        
        const events = await response.json();
        console.log("Fetched events:", events); // Add this line

        // Render events to the calendar
        document.querySelectorAll('.event').forEach(eventEl => eventEl.remove());
        events.forEach(event => {
            const dateElement = document.querySelector(`.date[data-date="${event.date}"]`);
            if (dateElement) {
                const eventSpan = document.createElement('div');
                eventSpan.classList.add('event');
                eventSpan.textContent = event.title;
                dateElement.appendChild(eventSpan);
            }
        });
    } catch (error) {
        console.error("Error in fetchEvents:", error);
    }
}


// Initial render
renderCalendar();
fetchEvents();