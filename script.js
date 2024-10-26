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
});

nextMonth.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
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
eventForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const date = eventForm.dataset.date;
    const title = document.getElementById("eventTitle").value;
    const description = document.getElementById("eventDescription").value;
    const tags = document.getElementById("eventTags").value;
    const link = document.getElementById("eventLink").value;

    // Store event details
    events[date] = { title, description, tags, link };

    // Display event title on the selected date
    const dateElement = document.querySelector(`.date[data-date="${date}"]`);
    if (dateElement) {
        dateElement.innerHTML = `<span class="event">${title}</span>`;
    }

    modal.style.display = "none";
    eventForm.reset();
});

// Initial render
renderCalendar();
