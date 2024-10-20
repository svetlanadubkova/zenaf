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
    const loadingElement = document.querySelector('.loading');
    const userNameSpan = document.getElementById('userName');

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
                <button id="submitAnswer">Next</button>
            `;

            const answerInput = document.getElementById('answer');
            const submitButton = document.getElementById('submitAnswer');

            answerInput.focus();

            answerInput.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    submitAnswer();
                }
            });

            submitButton.addEventListener('click', submitAnswer);
        } else {
            startMeditation();
        }
    }

    function submitAnswer() {
        const answer = document.getElementById('answer').value;
        userResponses[questions[currentQuestionIndex].text] = answer;
        currentQuestionIndex++;
        showQuestion();

        if (currentQuestionIndex === 1) {
            userNameSpan.textContent = answer;
        }
    }

    function startMeditation() {
        questionContainer.style.display = 'none';
        loadingElement.style.display = 'block';

        // Use WSS instead of WS
        const ws = new WebSocket('wss://zenafaiguidedmeditation.onrender.com');

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
            loadingElement.style.display = 'none';
            meditationContainer.style.display = 'block';

            const data = JSON.parse(event.data);
            if (data.type === 'meditation') {
                if (data.content) {
                    typeOutText(data.content);
                }
                if (data.audio) {
                    // Handle audio playback
                    const audio = new Audio(`data:audio/wav;base64,${data.audio.data}`);
                    audio.play();
                }
            } else if (data.type === 'error') {
                meditationText.innerHTML += `<p>Error: ${data.message}</p>`;
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            loadingElement.style.display = 'none';
            meditationText.innerHTML = '<p>Error connecting to meditation service. Please try again later.</p>';
        };

        ws.onclose = () => {
            console.log('Disconnected from server');
        };
    }

    function typeOutText(text) {
        const words = text.split(' ');
        let i = 0;
        const intervalId = setInterval(() => {
            if (i < words.length) {
                meditationText.innerHTML += words[i] + ' ';
                i++;
            } else {
                clearInterval(intervalId);
            }
        }, 200); // Adjust the speed as needed
    }
});