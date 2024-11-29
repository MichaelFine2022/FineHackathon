const express = require('express');
const cors = require('cors');
const { Ollama } = require('ollama');

const app = express();
const port = process.env.PORT || 3000;

const ollama = new Ollama({
    url: 'http://localhost:11434' // Ollama service URL
});

let history = [
    {role: "system", content: process.env.specialPrompt },
]

app.use(cors());
app.use(express.json());

// POST route to handle chat requests
app.post('/chat', async (req, res) => {
    const { model, content } = req.body;

    if (!model || !content) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }
     
    try {
        history.push({role:'user',content:content})
        const response = await ollama.chat({ model, messages:history });
        history.push({role:'system',content: response.message.content});
        res.json({ response: response.message.content,intent:response.intent });
    } catch (error) {
        console.error('Error during chat:', error);
        res.status(500).json({ error: 'Chat request failed' });
    }
});

// POST route to handle text generation
app.post('/generate', async (req, res) => {
    const { model, prompt } = req.body;

    if (!model || !prompt) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const response = await ollama.generate({ model, prompt });
        res.json(response);
    } catch (error) {
        console.error("Error generating text:", error);
        res.status(500).json({ error: 'Text generation failed' });
    }
});

// POST route to handle embedding requests
app.post('/embeddings', async (req, res) => {
    const { model, input } = req.body;

    if (!model || !input) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const response = await ollama.embed({ model, input });
        res.json(response);
    } catch (error) {
        console.error("Error generating embeddings:", error);
        res.status(500).json({ error: 'Embedding generation failed' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
