const axios = require('axios');

// In-memory storage - now keyed by username instead of sessionId
const conversations = new Map();
const systemPrompts = new Map();

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json',
        'Access-Control-Max-Age': '86400'
      }
    };
  }

  if (!event.body) {
    return { 
      statusCode: 400, 
      body: JSON.stringify({ error: 'Missing request body' })
    };
  }

  try {
    console.log('Received event body:', event.body);
    const body = JSON.parse(event.body);
    console.log('Parsed body:', body);
    
    // Handle clear history request
    if (body.action === 'clearHistory' && body.userName) {
      console.log('Clearing history for user:', body.userName);
      conversations.delete(body.userName);
      systemPrompts.delete(body.userName);
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'History cleared successfully' })
      };
    }
    
    if (!body.message || !body.userName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing message or userName in request body' })
      };
    }

    const userName = body.userName;
    console.log('Processing request for user:', userName);

    // Initialize or get conversation history for this user
    if (!conversations.has(userName)) {
      console.log('Creating new conversation history for user:', userName);
      conversations.set(userName, []);
    }
    const conversationHistory = conversations.get(userName);

    // Update system prompt for this user
    const systemPrompt = {
      role: "system",
      content: `You are PI, an AI assistant. The user you are talking to is named "${userName}". Make sure to address them by their name naturally in conversation. For example, you can say "Hello ${userName}!" or "That's an interesting question, ${userName}." Remember their name and use it appropriately throughout the conversation.`
    };
    systemPrompts.set(userName, systemPrompt);

    // Add user message to history
    conversationHistory.push({
      role: 'user',
      content: body.message,
      timestamp: new Date().toISOString()
    });

    // Keep only last 10 messages for context
    const contextMessages = conversationHistory.slice(-10);

    const OPENPIPE_API_KEY = "opk_76507f7f5547a9af8ce8d2dc2957d795ffc7d4e596";
    
    console.log('Using API key:', OPENPIPE_API_KEY ? 'Present' : 'Missing');
    console.log('Sending request to OpenPipe with message:', body.message);
    console.log('Conversation history for user:', userName, contextMessages);
    console.log('System prompt for user:', userName, systemPrompt);

    const response = await axios.post('https://app.openpipe.ai/api/v1/chat/completions', {
      model: "openpipe:PI-opensource1",
      messages: [
        systemPrompt,
        ...contextMessages,
        {
          role: "user",
          content: body.message,
          name: userName
        }
      ],
      temperature: 0.5
    }, {
      headers: {
        'Authorization': `Bearer ${OPENPIPE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('OpenPipe response status:', response.status);
    console.log('OpenPipe response data:', JSON.stringify(response.data));

    // Add AI response to conversation history
    if (response.data.choices && response.data.choices[0]) {
      conversationHistory.push({
        role: 'assistant',
        content: response.data.choices[0].message.content,
        timestamp: new Date().toISOString()
      });
    }

    // Return response with conversation history
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...response.data,
        history: conversationHistory,
        userName: userName
      })
    };
  } catch (error) {
    console.error('Error details:', error.response ? error.response.data : error.message);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({ 
        error: 'Failed to get AI response',
        details: error.message,
        response: error.response ? error.response.data : null
      })
    };
  }
}; 