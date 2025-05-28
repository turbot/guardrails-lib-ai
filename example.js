const MultiModelAI = require('./index.js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Example 1: Basic OpenAI usage
async function openaiExample() {
  const ai = new MultiModelAI({
    provider: 'openai',
    modelName: 'gpt-4',
    system: 'You are a helpful AI assistant.'
  });

  try {
    const response = await ai.query('Explain quantum computing in simple terms');
    console.log('\nOpenAI Response:', response);
  } catch (error) {
    console.error('OpenAI Error:', error.message);
  }
}

// Example 2: Anthropic with streaming
async function anthropicExample() {
  const claude = new MultiModelAI({
    provider: 'anthropic',
    modelName: 'claude-3-opus-20240229',
    system: 'You are a helpful AI assistant.'
  });

  try {
    console.log('\nAnthropic Streaming Response:');
    const stream = await claude.query('Write a short poem about artificial intelligence', {
      stream: true
    });

    for await (const chunk of stream) {
      process.stdout.write(chunk);
    }
    console.log('\n');
  } catch (error) {
    console.error('Anthropic Error:', error.message);
  }
}

// Example 3: Lambda-like usage with error handling
async function lambdaExample() {
  const ai = new MultiModelAI({
    provider: 'openai',
    modelName: 'gpt-4'
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
    const response = await ai.query(prompt);

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

// Example 4: Provider fallback
async function fallbackExample() {
  const ai = new MultiModelAI({
    provider: 'openai',
    modelName: 'gpt-4',
    fallbackProviders: ['anthropic', 'mistral']
  });

  try {
    const response = await ai.query('What is the meaning of life?');
    console.log('\nFallback Response:', response);
  } catch (error) {
    console.error('Fallback Error:', error.message);
  }
}

// Example 5: Invalid configuration (error handling)
async function errorExample() {
  try {
    // This will throw BadConfigurationError
    const ai = new MultiModelAI({
      // Missing required provider and modelName
    });
  } catch (error) {
    console.log('\nConfiguration Error Example:');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    console.error('Missing Parameters:', error.missingParams);
  }
}

// Run all examples
async function runExamples() {
  console.log('Running MultiModelAI Examples...\n');

  await openaiExample();
  await anthropicExample();
  await lambdaExample();
  await fallbackExample();
  await errorExample();
}

// Run the examples
runExamples().catch(console.error);