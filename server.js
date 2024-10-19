const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_WS_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';

if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set in environment variables');
  process.exit(1);
}

const wss = new WebSocket.Server({ noServer: true });

const AI_INSTRUCTIONS = `You are an AI-powered meditation guide for the "Zen as Fuck" app. Your primary goal is to provide personalized, guided calming meditations that help users find calm and inner peace in a humorous, irreverent, and no-nonsense way. [... rest of the instructions ...]`;

function handleWebSocketConnection(ws) {
  console.log('Client connected');

  const openaiWs = new WebSocket(OPENAI_WS_URL, {
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "OpenAI-Beta": "realtime=v1",
    },
  });

  openaiWs.on('open', () => {
    console.log('Connected to OpenAI server');
    openaiWs.send(JSON.stringify({
      type: "response.create",
      response: {
        modalities: ["text", "speech"],
        instructions: AI_INSTRUCTIONS
      }
    }));
  });

  openaiWs.on('message', (message) => {
    console.log('Received from OpenAI:', JSON.parse(message.toString()));
    ws.send(message);
  });

  openaiWs.on('error', (err) => {
    console.error('OpenAI WebSocket error:', err);
    ws.close(1011, 'Error connecting to AI service');
  });

  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      console.log('Received from client:', parsedMessage);
      if (openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.send(message);
      } else {
        console.error('OpenAI WebSocket is not open');
        ws.close(1011, 'AI service unavailable');
      }
    } catch (error) {
      console.error('Error parsing client message:', error);
      ws.close(1007, 'Invalid message format');
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    openaiWs.close();
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