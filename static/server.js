const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database(':memory:'); // Use :memory: for in-memory database or provide a path for persistent storage

// Create events table
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            tags TEXT,
            link TEXT
        )
    `);
});

// API Endpoints

// Fetch all events
app.get('/events', (req, res) => {
    db.all('SELECT * FROM events', [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ events: rows });
    });
});

// Fetch events for a specific date
app.get('/events/:date', (req, res) => {
    const { date } = req.params;
    db.all('SELECT * FROM events WHERE date = ?', [date], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ events: rows });
    });
});

// Add a new event
app.post('/events', (req, res) => {
    const { date, title, description, tags, link } = req.body;
    db.run(
        'INSERT INTO events (date, title, description, tags, link) VALUES (?, ?, ?, ?, ?)',
        [date, title, description, tags, link],
        function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({ eventId: this.lastID });
        }
    );
});

// Update an event
app.put('/events/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, tags, link } = req.body;
    db.run(
        'UPDATE events SET title = ?, description = ?, tags = ?, link = ? WHERE id = ?',
        [title, description, tags, link, id],
        function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({ changes: this.changes });
        }
    );
});

// Delete an event
app.delete('/events/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM events WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ changes: this.changes });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
