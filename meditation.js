const startButton = document.querySelector('.btn');
const meditationOverlay = document.getElementById('meditationOverlay');
const questionContainer = document.getElementById('questionContainer');
const meditationContainer = document.getElementById('meditationContainer');
const meditationText = document.getElementById('meditationText');
const endMeditationButton = document.getElementById('endMeditation');

const questions = [
    { id: 'name', text: "What's your name?", type: 'text' },
    { id: 'stress', text: "On a scale of 1-10, how overwhelmed are you right now?", type: 'number', min: 1, max: 10 },
    { id: 'stressType', text: "Is this stress related to work, relationships, or something else?", type: 'select', options: ['Work', 'Relationships', 'Other'] },
    { id: 'situation', text: "What are you currently stressed about? Describe the situation in full and include names and be as specific as possible.", type: 'textarea' },
    { id: 'physical', text: "How are you feeling physically right now?", type: 'text' },
    { id: 'tension', text: "Where do you feel the most tension in your body?", type: 'text' },
    { id: 'time', text: "How much time do you have to calm the fuck down right now?", type: 'select', options: ['5 min', '10 min', '20 min'] },
    { id: 'oneWord', text: "If you could describe your current situation in one word, what would it be?", type: 'text' },
    { id: 'experience', text: "Have you ever meditated before?", type: 'select', options: ['Never', 'A few times', 'Regularly'] }
];

let currentQuestionIndex = 0;
let userResponses = {};

startButton.addEventListener('click', startMeditation);
endMeditationButton.addEventListener('click', endMeditation);

function startMeditation() {
    meditationOverlay.style.display = 'flex';
    showNextQuestion();
}

function showNextQuestion() {
    if (currentQuestionIndex < questions.length) {
        const question = questions[currentQuestionIndex];
        let inputHTML = '';

        switch (question.type) {
            case 'text':
            case 'number':
                inputHTML = `<input type="${question.type}" id="${question.id}" ${question.min ? `min="${question.min}"` : ''} ${question.max ? `max="${question.max}"` : ''}>`;
                break;
            case 'select':
                inputHTML = `<select id="${question.id}">
                    ${question.options.map(option => `<option value="${option}">${option}</option>`).join('')}
                </select>`;
                break;
            case 'textarea':
                inputHTML = `<textarea id="${question.id}"></textarea>`;
                break;
        }

        questionContainer.innerHTML = `
            <h3>${question.text}</h3>
            ${inputHTML}
            <button onclick="submitAnswer()" class="btn">Next</button>
        `;
    } else {
        startGuidedMeditation();
    }
}

function submitAnswer() {
    const question = questions[currentQuestionIndex];
    const answer = document.getElementById(question.id).value;
    userResponses[question.id] = answer;
    currentQuestionIndex++;
    showNextQuestion();
}

async function startGuidedMeditation() {
    questionContainer.style.display = 'none';
    meditationContainer.style.display = 'block';
    
    try {
        const response = await fetch('/generate-meditation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userResponses)
        });

        if (!response.ok) {
            throw new Error('Failed to generate meditation');
        }

        const data = await response.json();
        playMeditation(data.meditation);
    } catch (error) {
        console.error('Error generating meditation:', error);
        meditationText.textContent = "Shit, something went wrong. Try again later, or just breathe on your own for a while.";
    }
}

function playMeditation(script) {
    const sentences = script.split('.');
    let currentSentence = 0;

    function displayNextSentence() {
        if (currentSentence < sentences.length) {
            meditationText.textContent = sentences[currentSentence].trim() + '.';
            currentSentence++;
            setTimeout(displayNextSentence, 5000); // Adjust timing as needed
        }
    }

    displayNextSentence();
    startVisualizer();
}

function endMeditation() {
    meditationOverlay.style.display = 'none';
    meditationText.textContent = '';
    questionContainer.style.display = 'block';
    meditationContainer.style.display = 'none';
    currentQuestionIndex = 0;
    userResponses = {};
    stopVisualizer();
}

// Add the visualizer functions here (startVisualizer and stopVisualizer)
// You can use the same code as in the previous implementation
