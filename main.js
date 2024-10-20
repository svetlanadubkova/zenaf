// main.js

let currentQuestionIndex = 0;
const questions = [
    { text: "What's your name?", type: "text" },
    { text: "On a scale of 1-10, how overwhelmed are you right now?", type: "range", min: 1, max: 10 },
    { text: "Is this stress related to work, relationships, or something else?", type: "select", options: ["Work", "Relationships", "Other"] },
    { text: "What are you currently stressed about? Describe the situation in full and include names and be as specific as possible.", type: "textarea" },
    { text: "How are you feeling physically right now?", type: "text" },
    { text: "Where do you feel the most tension in your body?", type: "text" },
    { text: "How much time do you have to calm the fuck down right now?", type: "select", options: ["5 min", "10 min", "20 min"] }
];

let userResponses = {};

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startMeditationBtn');
    const questionContainer = document.getElementById('questionContainer');
    const meditationContainer = document.getElementById('meditationContainer');
    const meditationText = document.getElementById('meditationText');
    const meditationOverlay = document.getElementById('meditationOverlay');

    startButton.addEventListener('click', () => {
        meditationOverlay.style.display = 'flex';
        showQuestion();
    });

    function showQuestion() {
        if (currentQuestionIndex < questions.length) {
            const question = questions[currentQuestionIndex];
            let inputHTML = '';

            switch (question.type) {
                case 'text':
                    inputHTML = `<input type="text" id="answer">`;
                    break;
                case 'range':
                    inputHTML = `<input type="range" id="answer" min="${question.min}" max="${question.max}">`;
                    break;
                case 'select':
                    inputHTML = `<select id="answer">
                        ${question.options.map(option => `<option value="${option}">${option}</option>`).join('')}
                    </select>`;
                    break;
                case 'textarea':
                    inputHTML = `<textarea id="answer" rows="4"></textarea>`;
                    break;
            }

            questionContainer.innerHTML = `
                <h3>${question.text}</h3>
                ${inputHTML}
                <button onclick="submitAnswer()">Next</button>
            `;
        } else {
            startMeditation();
        }
    }

    window.submitAnswer = () => {
        const answer = document.getElementById('answer').value;
        userResponses[questions[currentQuestionIndex].text] = answer;
        currentQuestionIndex++;
        showQuestion();
    };

    function startMeditation() {
        questionContainer.style.display = 'none';
        meditationContainer.style.display = 'block';

        const ws = new WebSocket('ws://zenafaiguidedmeditation.onrender.com'); // Replace with your actual backend URL

        ws.onopen = () => {
            console.log('Connected to server');
            ws.send(JSON.stringify({
                type: "message.create",
                message: {
                    content: `Based on the following user responses, provide a personalized guided meditation in the Zen as Fuck style: ${JSON.stringify(userResponses)}`,
                    role: "user"
                }
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'content_block') {
                if (data.content_block.type === 'text') {
                    const newParagraph = document.createElement('p');
                    newParagraph.textContent = data.content_block.text;
                    meditationText.appendChild(newParagraph);
                    newParagraph.scrollIntoView({ behavior: 'smooth', block: 'end' });
                } else if (data.content_block.type === 'speech') {
                    const utterance = new SpeechSynthesisUtterance(data.content_block.text);
                    speechSynthesis.speak(utterance);
                }
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            meditationText.innerHTML = '<p>Error connecting to meditation service. Please try again later.</p>';
        };

        ws.onclose = () => {
            console.log('Disconnected from server');
        };
    }
});