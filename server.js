const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch'); // To make HTTP requests to Olama API
const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Root route
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Chat route (assuming you want to interact with Olama's API)
app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;

    // Call Olama API here (replace with actual API call)
    const olamaResponse = await fetch('https://api.ollama.com/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer YOUR_OLLAMA_API_KEY`
        },
        body: JSON.stringify({ message: userMessage })
    });

    const responseData = await olamaResponse.json();
    res.json({ reply: responseData.reply }); // Send back the chatbot's response
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
