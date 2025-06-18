const AI = require('./index.js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Example 1: Basic OpenAI usage with proxy
async function openaiExample() {
  const ai = new AI({
    provider: 'openai',
    modelName: 'gpt-4',
    system: 'You are a helpful AI assistant.',
    apiKey: process.env.OPENAI_API_KEY,
    proxyUrl: process.env.HTTPS_PROXY // Optional proxy configuration
  });

  try {
    const response = await ai.generate('Explain quantum computing in simple terms');
    console.log('\nOpenAI Response:', response);
  } catch (error) {
    console.error('OpenAI Error:', error.message);
  }
}

// Example 2: Anthropic with proxy
async function anthropicExample() {
  const claude = new AI({
    provider: 'anthropic',
    modelName: 'claude-3-opus-20240229',
    system: 'You are a helpful AI assistant.',
    proxyUrl: 'http://your-proxy-server:port' // Direct proxy configuration
  });

  try {
    const response = await claude.generate('Write a short poem about artificial intelligence');
    console.log('\nAnthropic Response:', response);
  } catch (error) {
    console.error('Anthropic Error:', error.message);
  }
}

// Example 3: Lambda-like usage with proxy from environment
async function lambdaExample() {
  const ai = new AI({
    provider: 'openai',
    modelName: 'gpt-4',
    // Proxy will be read from HTTPS_PROXY or HTTP_PROXY environment variable
  });

  // Simulate Lambda event
  const event = {
    body: JSON.stringify({
      prompt: 'What are the three laws of robotics?',
      useCase: 'simple'
    })
  };

  try {
    const { prompt } = JSON.parse(event.body);
    const response = await ai.generate(prompt);

    // Simulate Lambda response
    console.log('\nLambda-like Response:', {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ response })
    });
  } catch (error) {
    // Simulate Lambda error response
    console.error('\nLambda-like Error Response:', {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error.message,
        type: error.name
      })
    });
  }
}

// Example 4: Proxy configuration example
async function proxyExample() {
  // Example with different proxy configurations
  const configs = [
    {
      name: 'Environment Variable Proxy',
      config: {
        provider: 'openai',
        modelName: 'gpt-4',
        // Proxy will be read from HTTPS_PROXY environment variable
      }
    },
    {
      name: 'Direct Proxy URL',
      config: {
        provider: 'claude',
        modelName: 'claude-3-opus-20240229',
        proxyUrl: 'http://proxy.example.com:8080'
      }
    },
    {
      name: 'No Proxy',
      config: {
        provider: 'openai',
        modelName: 'gpt-4'
        // No proxy configuration
      }
    }
  ];

  for (const { name, config } of configs) {
    try {
      console.log(`\nTesting ${name}:`);
      const ai = new AI(config);
      const response = await ai.generate('Hello, how are you?');
      console.log('Response:', response);
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
}

// Run all examples
async function runExamples() {
  console.log('Running AI Examples...\n');

  await openaiExample();
  await anthropicExample();
  await lambdaExample();
  await proxyExample();
}

// Run the examples
runExamples().catch(console.error);