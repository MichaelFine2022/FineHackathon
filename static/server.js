// server.js
const express = require('express');
const axios = require('axios');
require('dotenv').config();
const olamaApiKey = process.env.OLAMA_API_KEY;
console.log(olamaApiKey)
const app = express();
const port = 3000;

app.use(express.json()); // Parse incoming JSON requests

// Endpoint to interact with Olama's API
app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;
    
    if (!userMessage) {
        return res.status(400).send({ error: 'Message is required.' });
    }

    try {
        // Make a request to Olama's API
        const response = await axios.post('https://api.olama.ai/v1/chat', {
            prompt: userMessage,
            model: 'gpt-3.5', // Or any other model Olama supports
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OLAMA_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Return the response from Olama
        res.json({ reply: response.data.reply });
    } catch (error) {
        console.error("Error communicating with Olama API:", error);
        res.status(500).send({ error: 'Failed to fetch response from Olama.' });
    }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
