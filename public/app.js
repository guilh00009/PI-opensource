document.addEventListener('DOMContentLoaded', function() {
    const messageWrapper = document.querySelector('.message-wrapper');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.querySelector('.send-button');
    const chatInterface = document.getElementById('chat-interface');
    let messageCount = 0;
    
    // Generate a unique session ID for this tab
    const generateSessionId = () => {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    };

    // Get or create session ID for this tab
    let currentSessionId = sessionStorage.getItem('currentSessionId');
    if (!currentSessionId) {
        currentSessionId = generateSessionId();
        sessionStorage.setItem('currentSessionId', currentSessionId);
    }
    
    // Create donation button (initially hidden)
    const donationButton = document.createElement('div');
    donationButton.className = 'donation-button';
    donationButton.innerHTML = `
        <div class="donation-content">
            <span class="heart-icon">❤️</span>
            <span>Support the Creator</span>
        </div>
    `;
    donationButton.style.display = 'none';
    document.querySelector('.input-wrapper').appendChild(donationButton);

    donationButton.addEventListener('click', () => {
        window.open('https://kellergeist.gumroad.com/coffee', '_blank');
    });

    // Create knowledge animation
    const knowledgeAnimation = document.createElement('div');
    knowledgeAnimation.className = 'knowledge-animation';
    knowledgeAnimation.innerHTML = `
        <div class="knowledge-particles"></div>
        <div class="knowledge-center">
            <div class="roman-numeral-intro">I</div>
        </div>
    `;
    document.body.appendChild(knowledgeAnimation);

    // Generate random knowledge particles
    const particlesContainer = knowledgeAnimation.querySelector('.knowledge-particles');
    const words = ['AI', 'Data', 'Logic', 'Math', 'Science', 'Code', 'Learn', 'Think', 'Solve', 'Create'];
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    let touchedParticles = 0;
    const totalParticles = 40;
    let animationStarted = false;

    // Auto-start animation after a short delay
    setTimeout(() => {
        if (!animationStarted) {
            animationStarted = true;
            startMainAnimation();
        }
    }, 1000);

    for (let i = 0; i < totalParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = words[Math.floor(Math.random() * words.length)];
        
        // Calculate random position
        const left = Math.random() * window.innerWidth;
        const top = Math.random() * window.innerHeight;
        
        // Store the original position as CSS custom properties
        particle.style.setProperty('--left', left + 'px');
        particle.style.setProperty('--top', top + 'px');
        
        // Set initial position
        particle.style.left = left + 'px';
        particle.style.top = top + 'px';
        
        // Set random delay for animation
        particle.style.setProperty('--delay', `${Math.random() * 0.5}s`);
        
        // Add click/touch handler
        particle.addEventListener('click', handleParticleTouch);
        particle.addEventListener('touchstart', handleParticleTouch, { passive: false });
        
        particlesContainer.appendChild(particle);
    }

    function handleParticleTouch(e) {
        e.preventDefault();
        if (!this.classList.contains('touched') && !animationStarted) {
            this.classList.add('touched');
            touchedParticles++;
            
            // Start animation immediately on first touch
            if (!animationStarted) {
                animationStarted = true;
                startMainAnimation();
            }
        }
    }

    function startMainAnimation() {
        const romanNumeral = document.querySelector('.roman-numeral-intro');
        romanNumeral.style.opacity = '1';
        romanNumeral.style.transform = 'scale(1)';
        
        // Make all particles converge
        document.querySelectorAll('.particle:not(.touched)').forEach(particle => {
            particle.classList.add('touched');
        });

        // Start the sequence immediately
        knowledgeAnimation.classList.add('gathering');
        
        setTimeout(() => {
            knowledgeAnimation.classList.add('gathered');
            
            // Add the Hey... text element
            const heyText = document.createElement('div');
            heyText.className = 'hey-text';
            heyText.textContent = 'Hey...';
            heyText.style.opacity = '0';
            knowledgeAnimation.appendChild(heyText);
            
            setTimeout(() => {
                knowledgeAnimation.classList.add('expanding');
                // Fade in Hey... text when Roman numeral is in the middle
                setTimeout(() => {
                    heyText.style.opacity = '1';
                }, 1200);
                
                setTimeout(() => {
                    knowledgeAnimation.classList.add('exploding');
                    nameScreen.style.display = 'flex';
                    nameScreen.classList.add('fade-in');
                    
                    setTimeout(() => {
                        knowledgeAnimation.remove();
                    }, 500);
                }, 2500);
            }, 1000);
        }, 1000);
    }
    
    // Create name screen
    const nameScreen = document.createElement('div');
    nameScreen.className = 'name-screen';
    nameScreen.innerHTML = `
        <div class="name-prompt">
            <h2>Hey, I'm PI! What's your name?</h2>
            <input type="text" id="name-input" placeholder="Enter your name">
            <button id="name-submit">Let's Chat!</button>
        </div>
    `;
    document.body.appendChild(nameScreen);
    nameScreen.style.display = 'none';
    chatInterface.style.display = 'none';
    chatInterface.style.opacity = '0';

    // Handle name submission
    const nameInput = document.getElementById('name-input');
    const nameSubmit = document.getElementById('name-submit');
    
    nameSubmit.addEventListener('click', function() {
        const userName = nameInput.value.trim();
        if (userName) {
            sessionStorage.setItem('userName', userName);
            
            // Hide name screen immediately
            nameScreen.classList.add('fade-out');
            
            // Show chat interface with a smooth transition
            setTimeout(() => {
                chatInterface.style.display = 'flex';
                
                setTimeout(() => {
                    chatInterface.style.opacity = '1';
                    nameScreen.remove();
                }, 50);
            }, 500);
        }
    });

    nameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            nameSubmit.click();
        }
    });

    function typeMessage(message, element, cursor) {
        const typedText = document.createElement('span');
        typedText.className = 'typed-text';
        element.appendChild(typedText);
        
        let i = 0;
        const speed = 40;

        function updateCursorPosition() {
            const range = document.createRange();
            const selection = window.getSelection();
            
            // Create a temporary span for the last character
            const tempSpan = document.createElement('span');
            tempSpan.textContent = typedText.textContent.charAt(typedText.textContent.length - 1);
            tempSpan.style.visibility = 'hidden';
            typedText.appendChild(tempSpan);
            
            // Get the position of the last character
            range.selectNodeContents(tempSpan);
            const rect = range.getBoundingClientRect();
            
            // Remove temporary span
            typedText.removeChild(tempSpan);
            
            // Position cursor at the end of the last character
            cursor.style.left = (rect.right - element.getBoundingClientRect().left - 6) + 'px';
            cursor.style.top = (rect.top - element.getBoundingClientRect().top) + 'px';
            
            // Add a small offset to account for the rotation
            cursor.style.marginLeft = '6px';
            cursor.style.height = '24px';
        }

        function type() {
            if (i < message.length) {
                typedText.textContent = message.substring(0, i + 1);
                updateCursorPosition();
                i++;
                setTimeout(type, speed);
            }
        }

        type();
    }

    async function fadeOutOldMessages() {
        const oldMessages = messageWrapper.querySelectorAll('div');
        oldMessages.forEach(msg => msg.classList.add('fade-out'));
        
        await new Promise(resolve => setTimeout(resolve, 500));
        messageWrapper.innerHTML = '';
    }

    async function addMessage(text, isAI = false) {
        await fadeOutOldMessages();

        const messageDiv = document.createElement('div');
        messageDiv.className = isAI ? 'ai-message' : 'user-message';
        messageDiv.classList.add('fade-in');

        if (isAI) {
            const fullText = document.createElement('span');
            fullText.className = 'ai-text';
            fullText.textContent = text;
            messageDiv.appendChild(fullText);

            const cursor = document.createElement('div');
            cursor.className = 'ai-cursor';
            messageDiv.appendChild(cursor);

            messageWrapper.appendChild(messageDiv);

            setTimeout(() => {
                typeMessage(text, messageDiv, cursor);
            }, 100);
        } else {
            messageDiv.textContent = text;
            messageWrapper.appendChild(messageDiv);
        }

        messageCount++;
        
        // Show donation button after 2 messages
        if (messageCount === 2) {
            donationButton.style.display = 'flex';
            donationButton.classList.add('donation-appear');
        }
    }

    // Message handling functions
    function processContent(content) {
        return content
            .replace(/<decide>.*?<\/decide>/g, '')
            .replace(/<think\d*>.*?<\/think\d*>/g, '')
            .replace(/<think>.*?<\/think>/g, '')
            .trim();
    }

    async function handleSend() {
        const message = messageInput.value.trim();
        if (!message) return;

        // Clear input and disable button
        messageInput.value = '';
        sendButton.disabled = true;

        try {
            // Add user message to chat
            await addMessage(message, false);

            // Get username from sessionStorage
            const userName = sessionStorage.getItem('userName') || 'User';

            // Send message to backend
            console.log('Sending message:', message);
            const response = await fetch('/.netlify/functions/socketio-handler', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message,
                    userName,
                    sessionId: currentSessionId
                })
            });

            console.log('Response status:', response.status);
            const responseText = await response.text();
            console.log('Response text:', responseText);

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${responseText}`);
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse JSON:', e);
                throw new Error('Invalid JSON response from server');
            }

            console.log('Parsed response:', data);
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                // Process and add AI response to chat
                const processedMessage = processContent(data.choices[0].message.content);
                console.log('Processed message:', processedMessage);
                await addMessage(processedMessage, true);
            } else {
                console.error('Unexpected response format:', data);
                throw new Error('Invalid response format from server');
            }
        } catch (error) {
            console.error('Error details:', error);
            await addMessage(`Sorry, I encountered an error: ${error.message}`, true);
        } finally {
            sendButton.disabled = false;
            messageInput.focus();
        }
    }

    // Event listeners
    sendButton.addEventListener('click', handleSend);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // Add clear history button
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear History';
    clearButton.className = 'clear-button';
    document.querySelector('.input-wrapper').appendChild(clearButton);

    clearButton.addEventListener('click', async () => {
        try {
            const userName = sessionStorage.getItem('userName');
            if (!userName) return;

            // Send clear history request to backend
            const response = await fetch('/.netlify/functions/socketio-handler', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    action: 'clearHistory',
                    userName: userName
                })
            });

            if (!response.ok) {
                throw new Error('Failed to clear history');
            }

            // Clear local message display
            messageWrapper.innerHTML = '';
            messageCount = 0;
            donationButton.style.display = 'none';
            donationButton.classList.remove('donation-appear');
        } catch (error) {
            console.error('Error clearing history:', error);
            addMessage('Failed to clear history. Please try again.', true);
        }
    });
});
