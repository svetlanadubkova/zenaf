async function startGuidedMeditation() {
    questionContainer.style.display = 'none';
    meditationContainer.style.display = 'block';
    
    try {
        const response = await fetch('https://zenafaiguidedmeditation.onrender.com/generate-meditation', {
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
