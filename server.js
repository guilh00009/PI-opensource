require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// In-memory storage
const memoryStorage = new Map();
const userNames = new Map();

function cleanAIResponse(content) {
    return content
        .replace(/<think\d*>.*?<\/think\d*>/g, '')
        .replace(/<think>.*?<\/think>/g, '')
        .replace(/<decide>.*?<\/decide>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function formatMessagesForAI(messages, newMessage, sessionId) {
    const userName = userNames.get(sessionId) || "User";
    console.log('Using username:', userName, 'for session:', sessionId); // Debug log
    
    // Start with the system message
    const formattedMessages = [
        {
            role: "system",
            content: `You are an adaptive AI assistant that can either use detailed reasoning or respond directly based on the query type.

            The name of the user is "${userName}".

            REASONING MODE:
            - Activate for: complex questions, mathematical problems, historical inquiries, scientific concepts, or any topic requiring step-by-step analysis
            - When reasoning, use <think>tags</think> to show your thought process
            - Start with <decide>tag</decide> to explain why you chose reasoning mode

            DIRECT MODE:
            - Use for: casual conversation, simple questions, greetings, opinions, or straightforward requests
            - Respond naturally without any tags
            - Start with <decide>tag</decide> to explain why you chose direct mode`
        }
    ];

    // Add conversation history
    messages.forEach(msg => {
        formattedMessages.push({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
        });
    });

    // Add the new message
    formattedMessages.push({
        role: 'user',
        content: newMessage
    });

    return formattedMessages;
}

app.use(express.static('public'));
app.use(express.json());

const OPENPIPE_API_KEY = process.env.OPENPIPE_API_KEY;

if (!OPENPIPE_API_KEY) {
    console.error('OPENPIPE_API_KEY is not set in environment variables');
    process.exit(1);
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('Supabase environment variables are not set');
    process.exit(1);
}

io.on('connection', (socket) => {
    console.log('User connected');
    let sessionId;

    socket.on('initSession', (existingSessionId) => {
        try {
            if (existingSessionId) {
                const memorySession = memoryStorage.get(existingSessionId);
                if (memorySession) {
                    sessionId = existingSessionId;
                    const cleanedMessages = memorySession.messages.map(msg => ({
                        ...msg,
                        content: msg.type === 'ai' ? cleanAIResponse(msg.content) : msg.content
                    }));
                    socket.emit('loadHistory', cleanedMessages);
                    return;
                }
            }
            
            sessionId = uuidv4();
            memoryStorage.set(sessionId, {
                sessionId,
                messages: []
            });
            
            socket.emit('sessionCreated', sessionId);
        } catch (error) {
            console.error('Session initialization error:', error);
            socket.emit('error', 'Failed to initialize session');
        }
    });

    socket.on('sendMessage', async (message) => {
        console.log('Message received:', message);
        try {
            const session = memoryStorage.get(sessionId);
            const userMessage = {
                content: message,
                type: 'user',
                timestamp: new Date()
            };

            // Get conversation history and format messages for AI
            const messageHistory = session ? session.messages : [];
            const formattedMessages = formatMessagesForAI(messageHistory, message, sessionId);

            const response = await axios.post('https://app.openpipe.ai/api/v1/chat/completions', {
                model: "openpipe:PI-opensource1",
                messages: formattedMessages,
                store: true,
                temperature: 0.5
            }, {
                headers: {
                    'Authorization': `Bearer ${OPENPIPE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            const aiResponse = response.data.choices[0].message.content;
            const cleanedResponse = cleanAIResponse(aiResponse);
            
            const aiMessage = {
                content: cleanedResponse,
                type: 'ai',
                timestamp: new Date()
            };

            if (session) {
                session.messages.push(userMessage, aiMessage);
            }

            socket.emit('message', { type: 'ai', content: cleanedResponse });
        } catch (error) {
            console.error('Error:', error);
            socket.emit('error', 'Failed to get AI response');
        }
    });

    socket.on('clearHistory', () => {
        try {
            // Store the current username before creating new session
            const currentUserName = userNames.get(sessionId);
            
            // Create new session
            const oldSessionId = sessionId;
            sessionId = uuidv4();
            memoryStorage.set(sessionId, {
                sessionId,
                messages: []
            });
            
            // Transfer username to new session if it exists
            if (currentUserName) {
                userNames.set(sessionId, currentUserName);
                userNames.delete(oldSessionId); // Clean up old session's username
            }
            
            socket.emit('sessionCreated', sessionId);
        } catch (error) {
            console.error('Clear history error:', error);
            socket.emit('error', 'Failed to clear history');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.on('setUserName', (userName) => {
        console.log('Setting username:', userName, 'for session:', sessionId); // Debug log
        if (sessionId) {
            userNames.set(sessionId, userName);
        }
    });
});

const PORT = process.env.PORT || 3001;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});