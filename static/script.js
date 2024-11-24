let events = new PouchDB('events');

let eventDateInput =
    document.getElementById("eventDate");
let eventTitleInput =
    document.getElementById("eventTitle");
let eventDescriptionInput =
    document.getElementById("eventDescription");
let reminderList =
    document.getElementById("reminderList");
let recurringCheckbox = document.getElementById("recurring");
let recurrenceType = document.getElementById("recurrence-type");
recurringCheckbox.addEventListener("change", () => {
    if (recurringCheckbox.checked) {
        recurrenceType.style.display = "block"; // Show the recurrence dropdown
    } else {
        recurrenceType.style.display = "none"; // Hide the recurrence dropdown
    }
});


function addEvent() {
    let dateParts = eventDateInput.value.split("-");
    let date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]); 
    let title = eventTitleInput.value.trim();
    let description = eventDescriptionInput.value.trim();
    let isRecurring = document.getElementById("recurring").checked;
    let recurrenceInterval = document.getElementById("recurrenceInterval").value;


    // Validate inputs
    if (!eventDateInput.value || !title) {
        alert("Date and title are required to add an event.");
        return;
    }

    let eventId = `event_${eventDateInput.value}_${new Date().getTime()}`;

    // Event document structure
    let eventDoc = {
        _id: eventId, 
        date: date.toISOString(),
        title: title,
        description: description,
        isRecurring: isRecurring,
        recurrenceInterval: recurrenceInterval // Store the recurrence interval
    };

    if(isRecurring){
        addRecurringEvents(eventDoc);
        showCalendar(currentMonth, currentYear);
        eventDateInput.value = "";
        eventTitleInput.value = "";
        eventDescriptionInput.value = "";
        displayReminders();

    }
    else{
        events.put(eventDoc)
            .then(() => {
                console.log("Event added successfully:", eventDoc);
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
}

async function addRecurringEvents(eventDoc) {
    const { recurrenceInterval, date } = eventDoc;
    const startDate = new Date(eventDoc.date);
    const futureEvents = [];
    
    for (let i = 0; i <= 32; i++) {
        let newDate = new Date(startDate);

        switch (recurrenceInterval) {
            case "daily":
                newDate.setDate(startDate.getDate() + i);
                break;
            case "weekly":
                newDate.setDate(startDate.getDate() + i * 7);
                break;
            case "monthly":
                newDate.setMonth(startDate.getMonth() + i);
                break;
            default:
                console.error("Invalid recurrence interval:", recurrenceInterval);
                return;
        }

        if (newDate.getMonth() !== startDate.getMonth() + i) {
            continue;
        }

        const eventId = `${eventDoc._id}_${newDate.toISOString().split("T")[0]}`;
        futureEvents.push({
            ...eventDoc,
            _id: eventId,
            date: newDate.toISOString(),
        }); 
    }

    if (futureEvents.length > 0) {
        try {
            const result = await events.bulkDocs(futureEvents);
            console.log("Recurring events added:", result);
        } catch (error) {
            console.error("Error adding recurring events:", error);
        }
    } else {
        console.warn("No valid recurring events to add.");
    }
}

function deleteEvent(eventId) {
    if (confirm("Are you sure you want to delete this event?")) {
        events.get(eventId)
            .then(doc => events.remove(doc))
            .then(() => {
                console.log("Event deleted successfully.");
                displayReminders();
                showCalendar(currentMonth, currentYear);
            })
            .catch(err => console.error("Error deleting event:", err));
    }
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




// Function to display reminders
function displayReminders() {
    reminderList.innerHTML = "";
    events.allDocs({include_docs:true})
    .then(result => {
        reminderList.innerHTML = "";
        const allEvents = result.rows.map(row => row.doc);
        console.log("Events for reminders:", allEvents);
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
            let recurringEvents = allEvents.filter(event => event.isRecurring);
            let futureEvents = [];
            recurringEvents.forEach(event => {
                const recurrenceInterval = event.recurrenceInterval; // 'daily', 'weekly', etc.
                const startDate = new Date(event.date);

                // Calculate the next occurrences based on the interval
                let newDate = new Date(startDate);

                // Generate future occurrences within the current month
                for (let i = 1; i <= 31; i++) { // Assuming up to 31 occurrences to check
                    if (newDate.getMonth() === month && newDate.getFullYear() === year) {
                        let futureEvent = {
                            ...event,
                            _id: `${event._id}_${i}`,  // Create a unique ID for each occurrence
                            date: newDate.toISOString()
                        };
                        futureEvents.push(futureEvent);
                    }

                    // Update the date based on the recurrence interval
                    if (recurrenceInterval === 'daily') {
                        newDate.setDate(newDate.getDate() + 1);
                    } else if (recurrenceInterval === 'weekly') {
                        newDate.setDate(newDate.getDate() + 7);
                    } else if (recurrenceInterval === 'monthly') {
                        newDate.setMonth(newDate.getMonth() + 1);
                    }
                }
            });
            allEvents.push(...futureEvents);

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

let responses = ["Hello I am your personal Chatbot!"]; 

let sendBtn = document.getElementById(`sendButton`);

if(sendBtn){
    sendBtn.addEventListener("click", function(){
        //gets and resets the sent text
        let sentText = document.getElementById(`typedText`).value;
        responses.push(sentText);
        document.getElementById(`typedText`).value = "";
        //creates a text node using that text
        let node = document.createTextNode(sentText)
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

        var sendData = {
          "text": sentText
        }
    })
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