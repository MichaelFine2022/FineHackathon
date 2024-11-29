let events = new PouchDB('events');

let eventDateInput = document.getElementById("eventDate");
let eventTitleInput = document.getElementById("eventTitle");
let eventDescriptionInput = document.getElementById("eventDescription");
let reminderList = document.getElementById("reminderList");
let recurringCheckbox = document.getElementById("recurring");
let recurrenceType = document.getElementById("recurrence-type");
let recurrenceInterval = document.getElementById("recurrenceInterval");
recurringCheckbox.addEventListener("change", () => {
    if (recurringCheckbox.checked) {
        recurrenceType.style.display = "block"; // Show the recurrence dropdown
    } else {
        recurrenceType.style.display = "none"; // Hide the recurrence dropdown
    }
});



function displayUserMessage(message) {
    responses.push(message);
        document.getElementById(`typedText`).value = "";
        //creates a text node using that text
        let node = document.createTextNode(message)
        //creates a div with the right class
        let newDiv = document.createElement("div")
        newDiv.setAttribute("class", "outgoing-chats-msg")
        //creates a new paragraph and appends the node to it
        let newElement = document.createElement("p")         
        newElement.appendChild(node)
        //appends the p element to the div 
        newDiv.appendChild(newElement)
        //gets the div to append to
        let element = document.getElementById(`messageInbox`)
        //appends the div with the paragraph to the outgoing chat messages div 
        element.appendChild(newDiv)
    
}

function displayBotMessage(message) {
    responses.push(message);
        document.getElementById(`typedText`).value = "";
        //creates a text node using that text
        let node = document.createTextNode(message)
        //creates a div with the right class
        let newDiv = document.createElement("div")
        newDiv.setAttribute("class", "received-msg-inbox")
        //creates a new paragraph and appends the node to it
        let newElement = document.createElement("p")         
        newElement.appendChild(node)
        //appends the p element to the div 
        newDiv.appendChild(newElement)
        //gets the div to append to
        let element = document.getElementById(`messageInbox`)
        //appends the div with the paragraph to the outgoing chat messages div 
        element.appendChild(newDiv)
}
function addEvent({name, date, time, description, isRecurring, recurrenceInterval}){
    if (!name || !date || !time) {
        return "Please provide all details for the event.";
    }
    const event = { name, date, time, id: Date.now(), description:description, isRecurring:isRecurring,recurrenceInterval:recurrenceInterval};
    if(isRecurring){addRecurringEvents(event);}
    else{
        return db.put(event)
        .then(() => `Event '${name}' added on ${date} at ${time}.`)
        .catch(error => `Error adding event: ${error.message}`);
    }
}
function addEvent() {
    let dateParts = eventDateInput.value.split("-");
    let date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    let title = eventTitleInput.value.trim();
    let description = eventDescriptionInput.value.trim();
    let isRecurring = recurringCheckbox.checked;
    let recurrenceIntervalValue = recurrenceInterval.value;


    // Validate inputs
    if (!eventDateInput.value || !title) {
        alert("Date and title are required to add an event.");
        return;
    }

    let eventId = `event_${eventDateInput.value}_${new Date().getTime()}`;

    let eventDoc = {
        _id: eventId, 
        date: date.toISOString(),
        title: title,
        description: description,
        isRecurring: isRecurring,
        recurrenceInterval: recurrenceIntervalValue 
    };

    if(isRecurring){
        addRecurringEvents(eventDoc);
    }
    else{
        events.put(eventDoc)
            .then(() => {
                showCalendar(currentMonth, currentYear);
                resetInputFields();
                displayReminders();
                
            })
            .catch((error) => {
                console.error("Error adding event:", error);
                alert("Failed to add the event. Please try again.");
            });
    }
}

async function addRecurringEvents(eventDoc) {
    const { recurrenceInterval, date } = eventDoc;
    const startDate = new Date(eventDoc.date);
    const futureEvents = [];
    const maxRecurringEvents = 32; // Maximum events
    let recurrenceCount = 0;

    let recurrenceType = eventDoc.recurrenceInterval;
    let newEventDate = new Date(startDate);

    while (recurrenceCount < maxRecurringEvents) {
        const isFirstRecurring = recurrenceCount === 0; // Only the first event is shown in reminders
        let eventId = `event_${newEventDate.toISOString()}_${new Date().getTime()}`;
        let recurringEventDoc = {
            _id: eventId,
            date: newEventDate.toISOString(),
            title: eventDoc.title,
            description: eventDoc.description,
            isRecurring: true,
            isFirstRecurring, // Flag to identify the first occurrence
            recurrenceInterval: recurrenceType,
        };

        futureEvents.push(recurringEventDoc);

        // Modify the date based on the recurrence type
        if (recurrenceType === "daily") {
            newEventDate.setDate(newEventDate.getDate() + 1);
        } else if (recurrenceType === "weekly") {
            newEventDate.setDate(newEventDate.getDate() + 7);
        } else if (recurrenceType === "monthly") {
            newEventDate.setMonth(newEventDate.getMonth() + 1);
        }

        recurrenceCount++;
    }

    try {
        await events.bulkDocs(futureEvents);
        showCalendar(currentMonth, currentYear);
        resetInputFields();
        displayReminders();
    } catch (error) {
        console.error("Error adding recurring events:", error);
        alert("Failed to add recurring events. Please try again.");
    }
}

function resetInputFields() {
    eventTitleInput.value = "";
    eventDescriptionInput.value = "";
    eventDateInput.value = "";
    recurringCheckbox.checked = false;
    recurrenceType.style.display = "none";
}

function updateCalendarUI(events) {
    // Render the calendar based on current month and year
    let calendarGrid = document.getElementById('calendar-grid');
    calendarGrid.innerHTML = ''; // Clear previous calendar grid

    // Render the events in the calendar grid
    events.forEach(event => {
        let eventDate = new Date(event.date);
        let eventCell = document.createElement('div');
        eventCell.classList.add('calendar-day');
        eventCell.innerHTML = `
            <span class="event-title">${event.title}</span>
            <span class="event-time">${eventDate.getHours()}:${eventDate.getMinutes()}</span>
        `;
        calendarGrid.appendChild(eventCell);
    });
}

async function ensureUniqueIDs(newDocs) {
    try {
        // Fetch all existing document IDs
        const existingDocs = await events.allDocs({ include_docs: false });
        const existingIDs = new Set(existingDocs.rows.map(row => row.id));

        // Filter out documents with duplicate IDs
        const uniqueDocs = newDocs.map(doc => {
            while (existingIDs.has(doc._id)) {
                // Modify the _id to ensure uniqueness
                doc._id = `${doc._id}_${new Date().getTime()}`;
            }
            existingIDs.add(doc._id); // Add to the set of known IDs
            return doc;
        });

        return uniqueDocs;
    } catch (error) {
        console.error("Error ensuring unique IDs:", error);
        throw error;
    }
}

function showCalendar(month, year) {
    // Render the calendar based on current month and year
    // Fetch events from PouchDB and render them on the calendar
    events.allDocs({ include_docs: true, descending: true }).then(result => {
        const filteredEvents = result.rows.filter(row => {
            const eventDate = new Date(row.doc.date);
            return eventDate.getMonth() === month && eventDate.getFullYear() === year;
        });

        // Update the calendar with the fetched events
        updateCalendarUI(filteredEvents);
    }).catch(error => {
        console.error("Error fetching events:", error);
    });
}

function deleteEvent({ id }) {
    if (!id) return "Please specify the event ID to delete.";
    return db.get(id)
        .then(doc => db.remove(doc))
        .then(() => "Event deleted successfully.")
        .catch(error => `Error deleting event: ${error.message}`);
}

async function deleteEvent(eventId) {
    try {
        // Retrieve the event to find its recurrence details
        const event = await events.get(eventId);

        if (event.isRecurring) {
            // Delete all events with the same recurrenceInterval and start date
            const allEvents = await events.allDocs({ include_docs: true });
            const relatedEvents = allEvents.rows
                .map((row) => row.doc)
                .filter(
                    (doc) =>
                        doc.recurrenceInterval === event.recurrenceInterval &&
                        new Date(doc.date).toISOString() >= new Date(event.date).toISOString()
                );

            await events.bulkDocs(
                relatedEvents.map((relatedEvent) => ({
                    ...relatedEvent,
                    _deleted: true,
                }))
            );
        } else {
            // Delete single event
            await events.remove(event);
        }

        displayReminders();
        showCalendar(currentMonth, currentYear);
    } catch (error) {
        console.error("Error deleting event:", error);
        alert("Failed to delete event. Please try again.");
    }
}

function modifyEvent({ id, name, date, time }) {
    if (!id) return "Please specify the event ID to modify.";
    return db.get(id)
        .then(doc => {
            doc.name = name || doc.name;
            doc.date = date || doc.date;
            doc.time = time || doc.time;
            return db.put(doc);
        })
        .then(() => "Event updated successfully.")
        .catch(error => `Error updating event: ${error.message}`);
}

function viewEvent({ date }) {
    return db.allDocs({ include_docs: true })
        .then(result => {
            const events = result.rows.map(row => row.doc);
            const filtered = events.filter(event => event.date === date);
            if (filtered.length === 0) return `No events found for ${date}.`;
            return filtered.map(event => `${event.name} at ${event.time}`).join("\n");
        })
        .catch(error => `Error retrieving events: ${error.message}`);
}


document.getElementById("deleteAllButton").addEventListener("click",function() {
    if (confirm("Are you sure you want to delete all events? This action cannot be undone.")) {
        events.allDocs({ include_docs: true })
            .then(result => {
                const deleteDocs = result.rows.map(row => {
                    return { 
                        _id: row.doc._id, 
                        _rev: row.doc._rev, 
                        _deleted: true 
                    };
                });

                return events.bulkDocs(deleteDocs);
            })
            .then(() => {
                console.log("All events deleted successfully.");
                alert("All events have been deleted.");
                // Refresh reminders and calendar view
                displayReminders();
                showCalendar(currentMonth, currentYear);
            })
            .catch(err => {
                console.error("Error deleting all events:", err);
                alert("Failed to delete all events. Please try again.");
            });
    }
})

async function displayReminders() {
    try {
        const allEvents = await events.allDocs({ include_docs: true });
        const reminderList = document.getElementById("reminderList");
        reminderList.innerHTML = ""; // Clear existing reminders

        // Filter to only include first recurring or non-recurring events
        const reminders = allEvents.rows
            .map((row) => row.doc)
            .filter((doc) => !doc.isRecurring || doc.isFirstRecurring);

        reminders.forEach((event) => {
            const listItem = document.createElement("li");
            listItem.dataset.eventId = event._id;

            listItem.innerHTML = `
                <strong>${event.title}</strong> - ${event.description} on ${new Date(
                event.date
            ).toLocaleDateString()}
                <button class="delete-event" onclick="deleteEvent('${event._id}')">
                    Delete
                </button>
            `;

            reminderList.appendChild(listItem);
        });
    } catch (error) {
        console.error("Error displaying reminders:", error);
    }
}

function generate_year_range(start, end) {
    let years = "";
    for (let year = start; year <= end; year++) {
        years += "<option value='" +
            year + "'>" + year + "</option>";
    }
    return years;
}

let today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();
let selectYear = document.getElementById("year");
let selectMonth = document.getElementById("month");
showCalendar(currentMonth, currentYear);
displayReminders();

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
            let futureEvents = [];
            let uniqueDates = new Set();

            allEvents.filter(event => event.isRecurring).forEach(event => {
                const recurrenceInterval = event.recurrenceInterval; // 'daily', 'weekly', 'monthly'
                const startDate = new Date(event.date);
                let newDate = new Date(startDate);

                while (newDate.getMonth() === month && newDate.getFullYear() === year) {
                    const formattedDate = newDate.toISOString().split("T")[0];

                    if (!uniqueDates.has(formattedDate)) { // Avoid duplicates
                        uniqueDates.add(formattedDate);
                        futureEvents.push({
                            ...event,
                            _id: `${event._id}_${formattedDate}`, // Unique ID based on date
                            date: newDate.toISOString(),
                        });
                    }

                    // Update the date based on the recurrence interval
                    switch (recurrenceInterval) {
                        case 'daily':
                            newDate.setDate(newDate.getDate() + 1);
                            break;
                        case 'weekly':
                            newDate.setDate(newDate.getDate() + 7);
                            break;
                        case 'monthly':
                            newDate.setMonth(newDate.getMonth() + 1);
                            break;
                        default:
                            console.warn("Unsupported recurrence interval:", recurrenceInterval);
                            return; // Exit loop for unsupported intervals
                    }
                }
            });

            const combinedEvents = [...allEvents];
            futureEvents.forEach(futureEvent => {
                if (!combinedEvents.some(event => event._id === futureEvent._id)) {
                    combinedEvents.push(futureEvent);
                }
            });

            const eventsForMonth = allEvents.filter(event => {
                const eventDate = new Date(event.date);
                return (
                    eventDate.getFullYear() === year &&
                    eventDate.getMonth() === month
                );
            });

            renderCalendar(month, year, eventsForMonth);

        })
        .catch((error) => {
            console.error("Error fetching events from PouchDB:", error);
            displayError("Failed to load events. Please try again.");
        });
            
        function renderCalendar(month, year, eventsForMonth) {
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
    
                        // Check for events on this date
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
        }

        function displayError(message) {
            const errorContainer = document.getElementById("error-message");
            if (errorContainer) {
                errorContainer.textContent = message;
                errorContainer.style.display = "block";
            }
        }   
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

let responses = ["Hello I am your personal Chatbot!"]; 

let sendBtn = document.getElementById(`sendButton`);

if(sendBtn){
    sendBtn.addEventListener("click", function(){
        let sentText = document.getElementById(`typedText`).value;
        sendMessage(sentText); 
    });
}

function sendMessageToUser(textToSend){
    //gets the div to append divs to  
    let directory = document.getElementById("messageInbox")
    //creates the textNode with the text needed
    let node = document.createTextNode(textToSend)
    //creates a new div with the right website
    let newDiv = document.createElement("div")
    newDiv.setAttribute("class", "received-msg-inbox")
    //create a new p tag and append the text to it
    let newElement = document.createElement("p")
    newElement.appendChild(node)
    newDiv.appendChild(newElement)
    directory.appendChild(newDiv)
}

let points = [],
    velocity2 = 5, // velocity squared
    canvas = document.getElementById("animation"),
    context = canvas.getContext("2d"),
    baseRadius = 5, // base radius for spheres
    radiusVariation = 2, // max variation in radius
    boundaryX = 550,
    boundaryY = 200,
    numberOfPoints = Math.floor(Math.random() * 30) + 10;

init();

function init() {
  // create points
  for (var i = 0; i < numberOfPoints; i++) {
    createPoint();
  }
  // create connections
  for (var i = 0, l = points.length; i < l; i++) {
    var point = points[i];
    if (i == 0) {
      points[i].buddy = points[points.length - 1];
    } else {
      points[i].buddy = points[i - 1];
    }
  }

  // animate
  animate();
}

function createPoint() {
  var point = {},
      vx2,
      vy2;
  point.x = Math.random() * boundaryX;
  point.y = Math.random() * boundaryY;
  point.radius = baseRadius + Math.random() * radiusVariation; 
  point.vx = (Math.floor(Math.random()) * 2 - 1) * Math.random();
  vx2 = Math.pow(point.vx, 2);
  vy2 = velocity2 - vx2;
  point.vy = Math.sqrt(vy2) * (Math.random() * 2 - 1);
  points.push(point);
}

function resetVelocity(point, axis, dir) {
  var vx, vy;
  if (axis == "x") {
    point.vx = dir * Math.random();
    vx2 = Math.pow(point.vx, 2);
    vy2 = velocity2 - vx2;
    point.vy = Math.sqrt(vy2) * (Math.random() * 2 - 1);
  } else {
    point.vy = dir * Math.random();
    vy2 = Math.pow(point.vy, 2);
    vx2 = velocity2 - vy2;
    point.vx = Math.sqrt(vx2) * (Math.random() * 2 - 1);
  }
}

function drawCircle(x, y, radius) {
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI, false);
  context.fillStyle = "#97badc";
  context.fill();
}

function drawLine(x1, y1, x2, y2) {
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.strokeStyle = "#8ab2d8";
  context.stroke();
}

function draw() {
  for (var i = 0, l = points.length; i < l; i++) {
    var point = points[i];
    point.x += point.vx;
    point.y += point.vy;
    point.radius = baseRadius + Math.random() * radiusVariation; // Update radius with variation
    drawCircle(point.x, point.y, point.radius);
    drawLine(point.x, point.y, point.buddy.x, point.buddy.y);
    if (point.x < 0 + point.radius) {
      resetVelocity(point, "x", 1);
    } else if (point.x > boundaryX - point.radius) {
      resetVelocity(point, "x", -1);
    } else if (point.y < 0 + point.radius) {
      resetVelocity(point, "y", 1);
    } else if (point.y > boundaryY - point.radius) {
      resetVelocity(point, "y", -1);
    }
  }
}

function animate() {
  context.clearRect(0, 0, boundaryX, boundaryY);
  draw();
  requestAnimationFrame(animate);
}
const helpButton = document.getElementById("chatbot-button");
helpButton.addEventListener("click", (e)=>{
    const chatbot = document.getElementById("chatbotInterface");
    if(helpButton.firstElementChild.textContent === ">"){chatbot.style.display = "block";helpButton.firstElementChild.textContent= "<";}
    else{chatbot.style.display = "none";helpButton.firstElementChild.textContent = ">";}
});

function sendMessage(userInput) {
    if (!userInput.trim()) {
        displayBotMessage("Please enter a valid message.");
        return;
    }

    
    displayUserMessage(userInput);  
    document.getElementById("typedText").value = '';

    const requestPayload = {
        model: "smollm2:135m", 
        content: userInput,
    };

    // Send request to chatbot server
    fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }

        displayBotMessage(data.response);

        // Handle intents if provided
        if (data.intent) {
            const {name, parameters} = data.intent;
            intentHandler(intent, parameters);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        displayBotMessage(`Sorry, there was an error: ${error.message}`);
    });
}

function intentHandler(intent, parameters) {
    switch (intent) {
        case "add_event":
            return addEvent(parameters);
        case "delete_event":
            return deleteEvent(parameters);
        case "modify_event":
            return modifyEvent(parameters);
        case "view_event":
            return viewEvent(parameters);
        case "add_recurring_event":
            return addRecurringEvents()
        default:
            return "I'm not sure how to handle that request.";
    }
}
