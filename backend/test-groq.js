require('dotenv').config();
const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

console.log('🔍 Testing Groq API Connection...');
console.log('API Key configured:', !!GROQ_API_KEY);
console.log('API Key (first 20 chars):', GROQ_API_KEY ? GROQ_API_KEY.substring(0, 20) : 'NONE');
console.log('API URL:', GROQ_API_URL);
console.log('');

async function testGroqAPI() {
  try {
    console.log('📤 Sending test request to Groq API...');
    
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'user',
            content: 'Generate a simple JSON response for wheat crop care with watering and fertilizer schedule.',
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('✅ SUCCESS! Groq API is working');
    console.log('Response status:', response.status);
    console.log('Response content:', response.data.choices[0].message.content.substring(0, 200));
    
  } catch (error) {
    console.error('❌ ERROR calling Groq API');
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('');
      console.error('📊 Response Details:');
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('');
      console.error('Response Data (first 500 chars):');
      const data = error.response.data;
      if (typeof data === 'string') {
        console.error(data.substring(0, 500));
      } else {
        console.error(JSON.stringify(data, null, 2).substring(0, 500));
      }
    } else if (error.request) {
      console.error('No response received - request was made but no response');
      console.error('Request details:', error.request);
    } else {
      console.error('Error during request setup:', error.message);
    }
  }
}

testGroqAPI();
