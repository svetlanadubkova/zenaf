const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', function connection(ws) {
  console.log('Client connected');

  const openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
    headers: {
      "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
      "OpenAI-Beta": "realtime=v1",
    },
  });

  openaiWs.on('open', function open() {
    console.log('Connected to OpenAI server');
    openaiWs.send(JSON.stringify({
      type: "response.create",
      response: {
        modalities: ["text", "speech"],
        instructions: "You are a no-nonsense, profanity-using AI meditation guide. Your goal is to help the user relax and find inner peace through humor and relatability. Use a direct, blunt, and humorous tone with occasional profanity. Start by asking the user about their current stressors and tailor the meditation to their responses.",
      }
    }));
  });

  openaiWs.on('message', function incoming(message) {
    console.log('Received from OpenAI:', JSON.parse(message.toString()));
    ws.send(message);
  });

  ws.on('message', function incoming(message) {
    console.log('Received from client:', JSON.parse(message.toString()));
    openaiWs.send(message);
  });

  ws.on('close', function close() {
    console.log('Client disconnected');
    openaiWs.close();
  });
});

const server = app.listen(process.env.PORT || 10000, () => {
  console.log(`Server running on port ${server.address().port}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});