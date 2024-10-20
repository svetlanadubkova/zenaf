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
    const transcriptionText = document.getElementById('transcriptionText');
    const meditationOverlay = document.getElementById('meditationOverlay');
    const loadingElement = document.querySelector('.loading');
    const loadingMessage = document.getElementById('loadingMessage');
    const userNameSpan = document.getElementById('userName');
    const closeMeditationBtn = document.getElementById('closeMeditationBtn');
    const endMeditationBtn = document.getElementById('endMeditationBtn');

    const loadingMessages = [
        "Preparing your zen...",
        "give it a sec. chill is coming.",
        "breathe. loading your peace.",
        "almost zen time..."
    ];

    let currentLoadingMessageIndex = 0;
    let loadingInterval;

    startButton.addEventListener('click', () => {
        meditationOverlay.style.display = 'flex';
        showQuestion();
    });

    closeMeditationBtn.addEventListener('click', () => {
        meditationOverlay.style.display = 'none';
        resetMeditation();
    });

    endMeditationBtn.addEventListener('click', () => {
        meditationOverlay.style.display = 'none';
        resetMeditation();
    });

    function resetMeditation() {
        currentQuestionIndex = 0;
        userResponses = {};
        questionContainer.style.display = 'block';
        meditationContainer.style.display = 'none';
        meditationText.innerHTML = '';
        transcriptionText.innerHTML = '';
        loadingElement.style.display = 'none';
        clearInterval(loadingInterval);
    }

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

        loadingInterval = setInterval(() => {
            loadingMessage.textContent = loadingMessages[currentLoadingMessageIndex];
            currentLoadingMessageIndex = (currentLoadingMessageIndex + 1) % loadingMessages.length;
        }, 3000);

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
            clearInterval(loadingInterval);

            const data = JSON.parse(event.data);
            if (data.type === 'meditation') {
                if (data.content) {
                    typeOutText(data.content);
                }
                if (data.audio) {
                    playAudioAndVisualize(data.audio);
                }
            } else if (data.type === 'error') {
                meditationText.innerHTML += `<p>Error: ${data.message}</p>`;
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            loadingElement.style.display = 'none';
            meditationText.innerHTML = '<p>Error connecting to meditation service. Please try again later.</p>';
            clearInterval(loadingInterval);
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
        }, 200);
    }

    function playAudioAndVisualize(audioData) {
        const audio = new Audio(`data:audio/wav;base64,${audioData}`);
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(audio);
        
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        const canvas = document.getElementById('meditationCanvas');
        const ctx = canvas.getContext('2d');
        
        function visualize() {
            const WIDTH = canvas.width;
            const HEIGHT = canvas.height;

            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            ctx.clearRect(0, 0, WIDTH, HEIGHT);

            function draw() {
                requestAnimationFrame(draw);

                analyser.getByteFrequencyData(dataArray);

                ctx.fillStyle = 'rgb(0, 0, 0)';
                ctx.fillRect(0, 0, WIDTH, HEIGHT);

                const barWidth = (WIDTH / bufferLength) * 2.5;
                let barHeight;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    barHeight = dataArray[i] / 2;

                    ctx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
                    ctx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight);

                    x += barWidth + 1;
                }
            }

            draw();
        }

        visualize();
        audio.play();

        // Speech recognition for transcription
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    transcriptionText.innerHTML += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            transcriptionText.innerHTML = transcriptionText.innerHTML.trim() + ' ' + interimTranscript;
        };

        recognition.start();

        audio.onended = () => {
            recognition.stop();
        };
    }
});