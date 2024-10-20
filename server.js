import express from 'express';
import { WebSocketServer } from 'ws';
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

const wss = new WebSocketServer({ noServer: true });

const AI_INSTRUCTIONS = `
[Your existing AI_INSTRUCTIONS here]
`;

async function generateMeditation(userResponses) {
  try {
    console.log('Generating meditation for:', userResponses);
    const response = await openai.chat.completions.create({
      model: "gpt-4",
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

    console.log('OpenAI response:', response);

    return response.choices[0].message.content;
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

      let userResponses;
      if (parsedMessage.type === 'message.create') {
        // Extract user responses from the message content
        const contentString = parsedMessage.message.content;
        const match = contentString.match(/\{.*\}/);
        if (match) {
          userResponses = JSON.parse(match[0]);
        } else {
          throw new Error('Unable to parse user responses from message');
        }
      } else if (parsedMessage.type === 'start_meditation') {
        userResponses = parsedMessage.userResponses;
      } else {
        throw new Error('Unknown message type');
      }

      const meditationText = await generateMeditation(userResponses);

      ws.send(JSON.stringify({
        type: 'meditation_text',
        content: meditationText
      }));

      // Note: Audio generation is removed for now as it's not supported in this setup
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Error processing request: ' + error.message
      }));
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
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});