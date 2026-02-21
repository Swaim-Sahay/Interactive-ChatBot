require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Forward the stream request to the Gemini API
app.post('/api/chat', async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "Server API Key not configured." });
        }


        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;

        // Add headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', errorText);
            res.write(`data: ${JSON.stringify({ error: "API Request Failed" })}\n\n`);
            return res.end();
        }

        // Pipe the stream back to the client
        const { Readable } = require('stream');
        Readable.fromWeb(response.body).pipe(res);

    } catch (error) {
        console.error('Server error:', error);
        res.write(`data: ${JSON.stringify({ error: "Internal Server Error" })}\n\n`);
        res.end();
    }
});

// Serve frontend files
app.use(express.static(__dirname));

app.listen(port, () => {
    console.log(`Server is running securely on http://localhost:${port}`);
});
