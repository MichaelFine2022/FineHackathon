let events = new PouchDB('events');

let eventDateInput =
    document.getElementById("eventDate");
let eventTitleInput =
    document.getElementById("eventTitle");
let eventDescriptionInput =
    document.getElementById("eventDescription");
let reminderList =
    document.getElementById("reminderList");



function addEvent() {
    // Get inputs
    let date = eventDateInput.value;
    let title = eventTitleInput.value.trim();
    let description = eventDescriptionInput.value.trim();

    // Validate inputs
    if (!date || !title) {
        alert("Date and title are required to add an event.");
        return;
    }

    // Create a unique document ID using date and title
    let eventId = `event_${date}_${new Date().getTime()}`;

    // Event document structure
    let eventDoc = {
        _id: eventId, 
        date: date,
        title: title,
        description: description
    };

    // Add the document to PouchDB
    events.put(eventDoc)
        .then(() => {
            console.log("Event added successfully:", eventDoc);
            // Refresh calendar view and reset inputs
            showCalendar(currentMonth, currentYear);
            eventDateInput.value = "";
            eventTitleInput.value = "";
            eventDescriptionInput.value = "";
            displayReminders();
        })
        .catch((error) => {
            console.error("Error adding event:", error);
            alert("Failed to add the event. Please try again.");
        });
}

// Function to delete an event by ID
function deleteEvent(eventId) {
    events.get(eventId)
        .then((doc) => {
            return events.remove(doc); // Correctly pass the full document
        })
        .then(() => {
            console.log("Event deleted successfully.");
            // Update the UI
            displayReminders();
            showCalendar(currentMonth, currentYear);
        })
        .catch((err) => {
            console.error("Error deleting event:", err);
        });
}



// Function to display reminders
function displayReminders() {
    reminderList.innerHTML = "";
    events.allDocs({include_docs:true})
    .then(result => {
        reminderList.innerHTML = "";
        const allEvents = result.rows.map(row => row.doc);
        const currentMonthEvents = allEvents.filter(event => {
            const eventDate = new Date(event.date);
            return (
                eventDate.getMonth() === currentMonth &&
                eventDate.getFullYear() === currentYear
            );
        });

        currentMonthEvents.forEach(event => {
            let listItem = document.createElement("li");
            listItem.innerHTML = `<strong>${event.title}</strong> - ${event.description} on ${new Date(event.date).toLocaleDateString()}`;

            let deleteButton = document.createElement("button");
            deleteButton.className = "delete-event";
            deleteButton.textContent = "Delete";
            deleteButton.onclick = function () {
                deleteEvent(event._id);
            };

            listItem.appendChild(deleteButton);
            reminderList.appendChild(listItem);
        });
    })
    .catch(err => console.error("Error displaying reminders:", err));
}

// Function to generate a range of 
// years for the year select input
function generate_year_range(start, end) {
    let years = "";
    for (let year = start; year <= end; year++) {
        years += "<option value='" +
            year + "'>" + year + "</option>";
    }
    return years;
}

// Initialize date-related letiables
let today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();
let selectYear = document.getElementById("year");
let selectMonth = document.getElementById("month");

let createYear = generate_year_range(1970, 2050);

document.getElementById("year").innerHTML = createYear;

let calendar = document.getElementById("calendar");

let months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];
let days = [
    "Sun", "Mon", "Tue", "Wed",
    "Thu", "Fri", "Sat"];

$dataHead = "<tr>";
for (dhead in days) {
    $dataHead += "<th data-days='" +
        days[dhead] + "'>" +
        days[dhead] + "</th>";
}
$dataHead += "</tr>";

document.getElementById("thead-month").innerHTML = $dataHead;

monthAndYear =
    document.getElementById("monthAndYear");
showCalendar(currentMonth, currentYear);

// Function to navigate to the next month
function next() {
    currentYear = currentMonth === 11 ?
        currentYear + 1 : currentYear;
    currentMonth = (currentMonth + 1) % 12;
    showCalendar(currentMonth, currentYear);
}

// Function to navigate to the previous month
function previous() {
    currentYear = currentMonth === 0 ?
        currentYear - 1 : currentYear;
    currentMonth = currentMonth === 0 ?
        11 : currentMonth - 1;
    showCalendar(currentMonth, currentYear);
}

// Function to jump to a specific month and year
function jump() {
    currentYear = parseInt(selectYear.value);
    currentMonth = parseInt(selectMonth.value);
    showCalendar(currentMonth, currentYear);
}

// Function to display the calendar
function showCalendar(month, year) {
    // Fetch all events for the specified month and year from PouchDB
    events.allDocs({ include_docs: true })
        .then((result) => {
            const allEvents = result.rows.map(row => row.doc);

            // Filter events for the current month and year
            const eventsForMonth = allEvents.filter(event => {
                const eventDate = new Date(event.date);
                return (
                    eventDate.getFullYear() === year &&
                    eventDate.getMonth() === month
                );
            });

            
            let firstDay = new Date(year, month, 1).getDay();
            let tbl = document.getElementById("calendar-body");
            
            tbl.innerHTML = ""; // Clear previous content
            monthAndYear.innerHTML = months[month] + " " + year;
            selectYear.value = year;
            selectMonth.value = month;

            let date = 1;
            for (let i = 0; i < 6; i++) {
                let row = document.createElement("tr");

                for (let j = 0; j < 7; j++) {
                    if (i === 0 && j < firstDay) {
                        // Blank cells for days before the first of the month
                        let cell = document.createElement("td");
                        cell.appendChild(document.createTextNode(""));
                        row.appendChild(cell);
                    } else if (date > daysInMonth(month, year)) {
                        // Stop after the last day of the month
                        break;
                    } else {
                        let cell = document.createElement("td");
                        cell.setAttribute("data-date", date);
                        cell.setAttribute("data-month", month + 1); // Make 1-based
                        cell.setAttribute("data-year", year);
                        cell.setAttribute("data-month_name", months[month]);
                        cell.className = "date-picker";
                        cell.innerHTML = `<span>${date}</span>`;

                        // Highlight today's date
                        if (
                            date === today.getDate() &&
                            year === today.getFullYear() &&
                            month === today.getMonth()
                        ) {
                            cell.classList.add("selected");
                        }

                        // Check if there are events on this date
                        const eventsForDate = eventsForMonth.filter(event => {
                            const eventDate = new Date(event.date);
                            return eventDate.getDate() === date;
                        });

                        if (eventsForDate.length > 0) {
                            cell.classList.add("event-marker");

                            // Add tooltips for each event
                            const tooltip = document.createElement("div");
                            tooltip.className = "event-tooltip";
                            eventsForDate.forEach(event => {
                                let eventDetails = document.createElement("div");
                                eventDetails.innerHTML = `<strong>${event.title}</strong>: ${event.description}`;
                                tooltip.appendChild(eventDetails);
                            });
                            cell.appendChild(tooltip);
                        }

                        row.appendChild(cell);
                        date++;
                    }
                }

                tbl.appendChild(row);
            }

            displayReminders();
        })
        .catch((error) => {
            console.error("Error fetching events from PouchDB:", error);
        });
}


// Function to create an event tooltip
function createEventTooltip(date, month, year) {
    let tooltip = document.createElement("div");
    tooltip.className = "event-tooltip";
    let eventsOnDate = getEventsOnDate(date, month, year);
    for (let i = 0; i < eventsOnDate.length; i++) {
        let event = eventsOnDate[i];
        let eventDate = new Date(event.date);
        let eventText = `<strong>${event.title}</strong> - 
            ${event.description} on 
            ${eventDate.toLocaleDateString()}`;
        let eventElement = document.createElement("p");
        let close = document.createElement("p");
        close.id = "close-button";
        eventElement.innerHTML = eventText;
        tooltip.appendChild(eventElement);
        tooltip.appendChild(close);
    }
    return tooltip;
}

// Function to get events on a specific date
function getEventsOnDate(date, month, year) {
    return events.filter(function (event) {
        let eventDate = new Date(event.date);
        return (
            eventDate.getDate() === date &&
            eventDate.getMonth() === month &&
            eventDate.getFullYear() === year
        );
    });
}

// Function to check if there are events on a specific date
function hasEventOnDate(date, month, year) {
    return getEventsOnDate(date, month, year).length > 0;
}

// Function to get the number of days in a month
function daysInMonth(iMonth, iYear) {
    return 32 - new Date(iYear, iMonth, 32).getDate();
}

// Call the showCalendar function initially to display the calendar
showCalendar(currentMonth, currentYear);

document.getElementById("send-button").addEventListener("click", () => {
    const input = document.getElementById("typing-window");
    const message = input.value.trim();

    if (message) {
        displayMessage(message, "user");
        input.value = ""; // Clear input
        generateAssistantReply(message); // Example: Simulate assistant response
    }
});

// Function to display a message in the chat
function displayMessage(text, sender) {
    const screen = document.getElementById("screen");
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message", sender);
    messageElement.textContent = text;

    screen.appendChild(messageElement);
    screen.scrollTop = screen.scrollHeight; // Scroll to the latest message
}

// Simulate Assistant Reply
function generateAssistantReply(userMessage) {
    setTimeout(() => {
        const reply = `You said: "${userMessage}"`; // Example reply
        displayMessage(reply, "assistant");
    }, 1000);
}
