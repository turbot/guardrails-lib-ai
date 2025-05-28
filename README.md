# MultiModelAI

A unified interface for multiple AI language model providers built on Vercel AI SDK. This wrapper provides a consistent API to interact with various AI providers while handling provider-specific configurations and fallback mechanisms.

## Features

- **Unified Interface**: Single API to interact with multiple AI providers
- **Provider Support**:
  - OpenAI (GPT-4, GPT-3.5)
  - Anthropic (Claude)
  - Deepseek
  - Mistral
  - Groq
  - Together AI
  - Cohere
  - Fireworks
  - DeepInfra
  - Cerebras
  - Perplexity
- **Streaming Support**: Built-in support for streaming responses
- **Error Handling**: Robust error handling with Turbot error types
- **Logging**: Structured logging with Turbot logging utilities
- **Type Safety**: Full TypeScript support
- **Environment Variables**: Secure configuration through environment variables

## Installation

```bash
npm install multimodel-ai
```

## Environment Variables

Create a `.env` file in your project root with the necessary API keys:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# Deepseek
DEEPSEEK_API_KEY=your_deepseek_api_key

# Mistral
MISTRAL_API_KEY=your_mistral_api_key

# Groq
GROQ_API_KEY=your_groq_api_key

# Together AI
TOGETHER_API_KEY=your_together_api_key

# Cohere
COHERE_API_KEY=your_cohere_api_key

# Fireworks
FIREWORKS_API_KEY=your_fireworks_api_key

# DeepInfra
DEEPINFRA_API_KEY=your_deepinfra_api_key

# Cerebras
CEREBRAS_API_KEY=your_cerebras_api_key

# Perplexity
PERPLEXITY_API_KEY=your_perplexity_api_key
```

## Usage

```javascript
const MultiModelAI = require('multimodel-ai');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize with OpenAI
const ai = new MultiModelAI({
  provider: 'openai',
  modelName: 'gpt-4',
  system: 'You are a helpful AI assistant.'
});

// Query the model
try {
  const response = await ai.query('Explain quantum computing in simple terms');
  console.log(response);
} catch (error) {
  // Errors are instances of Turbot error types
  if (error.name === 'ProviderError') {
    console.error('Provider error:', error.message);
  } else if (error.name === 'BadConfigurationError') {
    console.error('Configuration error:', error.message);
    console.error('Missing parameters:', error.missingParams);
  } else {
    console.error('Unexpected error:', error.message);
  }
}

// Initialize with Anthropic
const claude = new MultiModelAI({
  provider: 'anthropic',
  modelName: 'claude-3-opus-20240229',
  system: 'You are a helpful AI assistant.'
});

// Query with streaming
try {
  const stream = await claude.query('Write a short poem about AI', { stream: true });
  for await (const chunk of stream) {
    process.stdout.write(chunk);
  }
} catch (error) {
  console.error('Error:', error);
}
```

## Error Handling

The wrapper uses Turbot's error handling system (`@turbot/errors`) to provide structured error types:

### Error Types

- `BadConfigurationError`: Thrown when required configuration is missing
  ```javascript
  try {
    const ai = new MultiModelAI({}); // Missing required config
  } catch (error) {
    if (error.name === 'BadConfigurationError') {
      console.error('Missing parameters:', error.missingParams);
    }
  }
  ```

- `ProviderError`: Thrown for provider-specific issues
  ```javascript
  try {
    await ai.query('prompt');
  } catch (error) {
    if (error.name === 'ProviderError') {
      console.error('Provider error:', error.message);
      console.error('Provider:', error.provider);
    }
  }
  ```

- `ModelError`: Thrown for model-specific issues
  ```javascript
  try {
    await ai.query('prompt');
  } catch (error) {
    if (error.name === 'ModelError') {
      console.error('Model error:', error.message);
      console.error('Model:', error.modelName);
    }
  }
  ```

## Logging

The wrapper uses Turbot's logging system (`@turbot/log`) for structured logging:

### Log Levels

- `log.info()`: For general information
  ```javascript
  // Logged automatically on initialization
  log.info('MultiModelAI initialized', {
    provider: 'openai',
    modelName: 'gpt-4'
  });
  ```

- `log.error()`: For error conditions
  ```javascript
  // Logged automatically on errors
  log.error('AI query failed', {
    error: error.message,
    errorType: error.name,
    provider: 'openai',
    modelName: 'gpt-4'
  });
  ```

### Log Context

Each log entry includes:
- Timestamp
- Log level
- Contextual information
- Error details (when applicable)
- Stack traces (for errors)

## Configuration Options

The `MultiModelAI` constructor accepts the following configuration options:

```javascript
{
  provider: string;      // The AI provider to use (e.g., 'openai', 'anthropic')
  modelName: string;     // The specific model to use (e.g., 'gpt-4', 'claude-3-opus-20240229')
  system?: string;       // Optional system prompt
  apiKey?: string;       // Optional API key (prefer using environment variables)
}
```

The `query` method accepts these options:

```javascript
{
  systemPrompt?: string; // Override the system prompt for this query
  stream?: boolean;      // Enable streaming response
  temperature?: number;  // Control response randomness (0-1)
  maxTokens?: number;    // Maximum tokens in the response
  // Provider-specific options are also supported
}
```

## Supported Providers and Models

### OpenAI
- Models: gpt-4, gpt-4-turbo-preview, gpt-3.5-turbo
- Version: 1.3.22

### Anthropic
- Models: claude-3-opus-20240229, claude-3-sonnet-20240229, claude-3-haiku-20240307
- Version: 1.2.12

### Deepseek
- Models: deepseek-chat, deepseek-coder
- Version: 0.2.14

### Mistral
- Models: mistral-tiny, mistral-small, mistral-medium
- Version: 1.2.8

### Groq
- Models: llama2-70b-4096, mixtral-8x7b-32768
- Version: 1.2.9

### Together AI
- Models: Various open-source models
- Version: 0.2.14

### Cohere
- Models: command, command-light
- Version: 1.2.10

### Fireworks
- Models: Various open-source models
- Version: 0.2.14

### DeepInfra
- Models: Various open-source models
- Version: 0.2.15

### Cerebras
- Models: cerebras-gpt
- Version: 0.2.14

### Perplexity
- Models: pplx-7b-online, pplx-70b-online
- Version: 1.1.9

## Fallback Mechanism

The wrapper supports automatic fallback to alternative providers:

```javascript
const ai = new MultiModelAI({
  provider: 'openai',
  modelName: 'gpt-4',
  fallbackProviders: ['anthropic', 'mistral']
});

// If OpenAI fails, it will try Anthropic, then Mistral
const response = await ai.query('Your prompt here');
```

## AWS Lambda Integration

MultiModelAI can be used in AWS Lambda functions. Here's how to set it up:

### Basic Lambda Function Example

```javascript
// index.js
import MultiModelAI from 'multimodel-ai';

// Initialize outside the handler for better performance
const ai = new MultiModelAI({
  provider: 'openai',
  modelName: 'gpt-4',
  system: 'You are a helpful AI assistant.'
});

export const handler = async (event) => {
  try {
    const { prompt } = JSON.parse(event.body);

    const response = await ai.query(prompt);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ response }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: error.message,
        type: error.name
      }),
    };
  }
};
```

### Lambda Configuration

1. **Environment Variables**: Set your API keys in Lambda environment variables:
   ```bash
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   # ... other provider keys as needed
   ```

2. **Lambda Layer**: For better performance, create a Lambda Layer with the dependencies:
   ```bash
   # Create a layer directory
   mkdir -p nodejs
   cd nodejs

   # Install dependencies
   npm init -y
   npm install multimodel-ai

   # Zip the layer
   zip -r ../multimodel-ai-layer.zip .
   ```

3. **Lambda Function Configuration**:
   - Runtime: Node.js 18.x or later
   - Memory: At least 256MB (512MB recommended)
   - Timeout: At least 30 seconds
   - Architecture: arm64 (recommended for cost savings)

### Best Practices for Lambda

1. **Cold Start Optimization**:
   ```javascript
   // Initialize outside the handler
   let aiInstance = null;

   function getAI() {
     if (!aiInstance) {
       aiInstance = new MultiModelAI({
         provider: 'openai',
         modelName: 'gpt-4',
       });
     }
     return aiInstance;
   }

   export const handler = async (event) => {
     const ai = getAI();
     // ... rest of the handler
   };
   ```

2. **Streaming Support**:
   ```javascript
   export const handler = async (event) => {
     const ai = getAI();

     // For API Gateway with Lambda proxy integration
     const response = {
       statusCode: 200,
       headers: {
         'Content-Type': 'text/event-stream',
         'Connection': 'keep-alive',
         'Cache-Control': 'no-cache',
       },
       body: '',
     };

     try {
       const stream = await ai.query(event.prompt, { stream: true });
       const chunks = [];

       for await (const chunk of stream) {
         chunks.push(chunk);
         // For API Gateway, you'll need to buffer the response
         response.body += `data: ${JSON.stringify({ chunk })}\n\n`;
       }

       return response;
     } catch (error) {
       // ... error handling
     }
   };
   ```

3. **Error Handling and Retries**:
   ```javascript
   export const handler = async (event) => {
     const ai = getAI();
     const maxRetries = 3;
     let retryCount = 0;

     while (retryCount < maxRetries) {
       try {
         const response = await ai.query(event.prompt);
         return {
           statusCode: 200,
           body: JSON.stringify({ response }),
         };
       } catch (error) {
         retryCount++;
         if (error.name === 'ProviderError' && retryCount < maxRetries) {
           // Wait before retrying (exponential backoff)
           await new Promise(resolve =>
             setTimeout(resolve, Math.pow(2, retryCount) * 1000)
           );
           continue;
         }
         throw error;
       }
     }
   };
   ```

4. **Cost Optimization**:
   ```javascript
   // Use provider-specific models based on request type
   export const handler = async (event) => {
     const { prompt, useCase } = JSON.parse(event.body);
     const ai = getAI();

     // Choose model based on use case
     const modelConfig = {
       'simple': { provider: 'openai', model: 'gpt-3.5-turbo' },
       'complex': { provider: 'anthropic', model: 'claude-3-opus-20240229' },
       'default': { provider: 'openai', model: 'gpt-4' }
     };

     const config = modelConfig[useCase] || modelConfig.default;
     const response = await ai.query(prompt, config);

     return {
       statusCode: 200,
       body: JSON.stringify({ response }),
     };
   };
   ```

### API Gateway Integration

For REST API:
```yaml
# serverless.yml example
functions:
  aiHandler:
    handler: index.handler
    events:
      - http:
          path: /ai
          method: post
          cors: true
    environment:
      OPENAI_API_KEY: ${env:OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${env:ANTHROPIC_API_KEY}
    layers:
      - !Ref MultiModelAILayer
```

For WebSocket API (streaming):
```yaml
functions:
  aiStreamHandler:
    handler: index.streamHandler
    events:
      - websocket:
          route: $connect
      - websocket:
          route: $disconnect
      - websocket:
          route: aiStream
    environment:
      OPENAI_API_KEY: ${env:OPENAI_API_KEY}
    layers:
      - !Ref MultiModelAILayer
```

### Monitoring and Logging

```javascript
export const handler = async (event) => {
  const startTime = Date.now();
  const ai = getAI();

  try {
    const response = await ai.query(event.prompt);
    const duration = Date.now() - startTime;

    // Log metrics
    console.log(JSON.stringify({
      type: 'AI_QUERY',
      provider: ai.config.provider,
      model: ai.config.modelName,
      duration,
      success: true,
      timestamp: new Date().toISOString()
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ response }),
    };
  } catch (error) {
    // Log errors
    console.error(JSON.stringify({
      type: 'AI_ERROR',
      provider: ai.config.provider,
      model: ai.config.modelName,
      error: error.message,
      errorType: error.name,
      timestamp: new Date().toISOString()
    }));

    throw error;
  }
};
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Dependencies

- ai: 4.3.16
- @ai-sdk/openai: 1.3.22
- @ai-sdk/anthropic: 1.2.12
- @ai-sdk/deepseek: 0.2.14
- @ai-sdk/mistral: 1.2.8
- @ai-sdk/groq: 1.2.9
- @ai-sdk/togetherai: 0.2.14
- @ai-sdk/cohere: 1.2.10
- @ai-sdk/fireworks: 0.2.14
- @ai-sdk/deepinfra: 0.2.15
- @ai-sdk/cerebras: 0.2.14
- @ai-sdk/perplexity: 1.1.9
- @turbot/errors: 5.3.0
- @turbot/log: 5.5.0
- dotenv: 16.4.5

## Development Dependencies

- eslint: ^8.57.0
- jest: ^29.7.0

## Node.js Version

Requires Node.js >= 18.0.0