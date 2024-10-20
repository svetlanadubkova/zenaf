import express from 'express';
import WebSocket from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set in environment variables');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

const wss = new WebSocket.Server({ noServer: true });

const AI_INSTRUCTIONS = `You are an AI-powered meditation guide for the "Zen as Fuck" app. Your primary goal is to provide personalized, guided calming meditations that help users find calm and inner peace in a humorous, irreverent, and no-nonsense way. [... rest of the instructions ...]`;

async function generateMeditation(userResponses) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-audio-preview",
      modalities: ["text", "audio"],
      audio: { voice: "alloy", format: "wav" },
      messages: [
        {
          role: "system",
          content: AI_INSTRUCTIONS
        },
        {
          role: "user",
          content: `Based on the following user responses, provide a personalized guided meditation in the Zen as Fuck style: ${JSON.stringify(userResponses)}`
        }
      ]
    });

    return response.choices[0].message;
  } catch (error) {
    console.error('Error generating meditation:', error);
    throw error;
  }
}

function handleWebSocketConnection(ws) {
  console.log('Client connected');

  ws.on('message', async (message) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      console.log('Received from client:', parsedMessage);

      const meditation = await generateMeditation(parsedMessage.userResponses);

      ws.send(JSON.stringify({
        type: 'meditation',
        content: meditation.content,
        audio: meditation.audio
      }));
    } catch (error) {
      console.error('Error handling message:', error);
      ws.close(1011, 'Error processing request');
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`Client disconnected with code ${code} and reason: ${reason}`);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
}

wss.on('connection', handleWebSocketConnection);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Global error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Perform any necessary cleanup here
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Perform any necessary cleanup here
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully.');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});