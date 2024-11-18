const db = new PouchDB('eventsDB');
const monthYear = document.getElementById('monthYear');
const dates = document.getElementById('dates');
const prevMonth = document.getElementById('prevMonth');
const nextMonth = document.getElementById('nextMonth');
const addEventModal = document.getElementById("addEventModal");
const updateEventModal = document.getElementById("updateEventModal");
const closeModalButtons = document.querySelectorAll(".close");
const eventForm = document.getElementById("addEventForm");
const toggleButton = document.getElementById('toggle-button');

let currentDate = new Date();

// Apply theme based on localStorage when page loads
const body = document.body;
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') changeMonth(1);
    else if (e.key === 'ArrowLeft') changeMonth(-1);
});

function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
    fetchEvents();
}

function renderCalendar() {
    currentDate.setDate(1);
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    monthYear.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    dates.innerHTML = '<div class="date empty"></div>'.repeat(firstDay);

    const today = new Date().toISOString().split('T')[0];
    for (let day = 1; day <= lastDate; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === today ? ' today' : '';
        dates.innerHTML += `<div class="date${isToday}" data-date="${dateStr}">${day}</div>`;
    }
}

prevMonth.addEventListener('click', () => changeMonth(-1));
nextMonth.addEventListener('click', () => changeMonth(1));

dates.addEventListener("click", (event) => {
    const clickedDate = event.target.closest('.date');
    if (clickedDate && !clickedDate.classList.contains("empty")) {
        openModal(clickedDate.getAttribute("data-date"));
    }
});

function openModal(date) {
    addEventModal.style.display = "block";
    eventForm.dataset.date = date;
    eventForm.reset();
}

function closeModal() {
    addEventModal.style.display = "none";
    updateEventModal.style.display = "none";
}

closeModalButtons.forEach(button => {
    button.addEventListener("click", closeModal);
});

window.addEventListener("click", (event) => {
    if (event.target === addEventModal || event.target === updateEventModal) {
        closeModal();
    }
});

eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const date = eventForm.dataset.date;
    const eventId = Date.now().toString();

    const eventData = {
        _id: `${date}_${eventId}`,
        title: document.getElementById("eventTitle").value,
        description: document.getElementById("eventDescription").value,
        tags: document.getElementById("eventTags").value,
        link: document.getElementById("eventLink").value,
    };

    try {
        await db.put(eventData);
        updateEventDisplay(date, eventData.title, eventId);
        closeModal();
    } catch (err) {
        console.error("Error saving event:", err);
    }
});

async function fetchEvents() {
    try {
        const result = await db.allDocs({ include_docs: true });
        document.querySelectorAll('.event').forEach(eventEl => eventEl.remove());

        const noEventsMessage = document.querySelector('.no-events-message');
        if (result.rows.length === 0) {
            if (!noEventsMessage) {
                const noEventsMessage = document.createElement('div');
                noEventsMessage.classList.add('no-events-message');
                noEventsMessage.textContent = "No events found.";
                dates.appendChild(noEventsMessage);
            }
        } else {
            if (noEventsMessage) noEventsMessage.remove();
            result.rows.map(row => row.doc).forEach(event => {
                if (event._id) {
                    updateEventDisplay(event._id.split('_')[0], event.title, event._id);
                }
            });
        }
    } catch (error) {
        console.error("Error fetching events:", error);
    }
}

function updateEventDisplay(date, title, eventId) {
    const dateElement = document.querySelector(`.date[data-date="${date}"]`);
    if (dateElement) {
        const eventSpan = createEventElement(title, date, eventId);
        dateElement.appendChild(eventSpan);
    }
}

function createEventElement(title, date, eventId) {
    const eventSpan = document.createElement('div');
    eventSpan.classList.add('event');
    eventSpan.textContent = title;

    const deleteButton = document.createElement('span');
    deleteButton.classList.add('delete-event');
    deleteButton.textContent = 'X';
    deleteButton.title = 'Delete Event';

    deleteButton.addEventListener('click', async (e) => {
        e.stopPropagation();
        await deleteEvent(`${date}_${eventId}`, eventSpan);
    });

    eventSpan.appendChild(deleteButton);
    return eventSpan;
}

async function deleteEvent(eventId, eventSpan) {
    try {
        const doc = await db.get(eventId);
        await db.remove(doc);
        eventSpan.remove();
    } catch (err) {
        console.error("Error deleting event:", err);
    }
}

// Initialize the calendar and fetch events
renderCalendar();
fetchEvents();

// Apply dark mode toggle
toggleButton.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});
