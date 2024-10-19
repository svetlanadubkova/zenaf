let socket;

function connectWebSocket() {
    socket = new WebSocket('wss://your-render-domain.onrender.com');

    socket.onopen = function(event) {
        console.log('Connected to server');
    };

    socket.onmessage = function(event) {
        const message = JSON.parse(event.data);
        if (message.type === 'text') {
            displayMeditationText(message.content);
        } else if (message.type === 'speech') {
            playSpeech(message.content);
        }
    };

    socket.onclose = function(event) {
        console.log('Disconnected from server');
    };
}

function startGuidedMeditation() {
    questionContainer.style.display = 'none';
    meditationContainer.style.display = 'block';
    
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        connectWebSocket();
    }

    socket.send(JSON.stringify({
        type: "message",
        message: {
            role: "user",
            content: "I'm ready to start my zen as fuck meditation. Ask me some questions to get started."
        }
    }));
}

function sendUserResponse(response) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: "message",
            message: {
                role: "user",
                content: response
            }
        }));
    }
}

function displayMeditationText(text) {
    meditationText.textContent = text;
}

function playSpeech(audioContent) {
    // Implement speech playback here
    // This could involve using the Web Speech API or an audio library
    console.log("Playing audio:", audioContent);
}

// Call this function when the page loads
connectWebSocket();