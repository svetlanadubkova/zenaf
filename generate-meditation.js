const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/generate-meditation', async (req, res) => {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a no-nonsense, profanity-using AI meditation guide. Your goal is to help the user relax and find inner peace through humor and relatability. Use the user's responses to personalize the meditation."
        },
        {
          role: "user",
          content: `Generate a personalized guided meditation based on these user responses: ${JSON.stringify(req.body)}`
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    res.status(200).json({ meditation: response.data.choices[0].message.content });
  } catch (error) {
    console.error('Error generating meditation:', error);
    res.status(500).json({ error: 'Failed to generate meditation' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
