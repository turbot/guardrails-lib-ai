# Guardrails LLM

A unified interface for multiple AI language model providers built on Vercel AI SDK. This wrapper provides a consistent API to interact with various AI providers while handling provider-specific configurations and fallback mechanisms.

## Features

- **Unified Interface**: Single API to interact with multiple AI providers
- **Provider Support**:
  - OpenAI (GPT-4, GPT-3.5)
  - Anthropic (Claude)
- **Error Handling**: Robust error handling with Turbot error types
- **Logging**: Structured logging with Turbot logging utilities
- **Type Safety**: Full TypeScript support
- **Environment Variables**: Secure configuration through environment variables
- **Proxy Support**: Built-in support for HTTP/HTTPS proxies

## Installation

```bash
npm install guardrails-llm
```

## Environment Variables

Create a `.env` file in your project root with the necessary API keys and proxy configuration:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# Proxy Configuration (Optional)
HTTPS_PROXY=http://your-proxy-server:port
HTTP_PROXY=http://your-proxy-server:port
```

## Usage

```javascript
const LLM = require('guardrails-llm');
const dotenv = require('dotenv');

// Load environment variables (optional if using direct API keys)
dotenv.config();

// Initialize with OpenAI using direct API key and proxy
const llm = new LLM({
  provider: 'openai',
  modelName: 'gpt-4',
  apiKey: 'your-openai-api-key',  // Direct API key
  system: 'You are a helpful AI assistant.',
  proxyUrl: 'http://your-proxy-server:port'  // Optional proxy configuration
});

// Query the model
try {
  const response = await llm.generate('Explain quantum computing in simple terms');
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

// Initialize with Anthropic using environment variables
const claude = new LLM({
  provider: 'claude',
  modelName: 'claude-3-opus-20240229',
  // apiKey will be read from ANTHROPIC_API_KEY environment variable
  // proxyUrl will be read from HTTPS_PROXY environment variable
  system: 'You are a helpful AI assistant.'
});

// Query with streaming
try {
  const response = await claude.generate('Write a short poem about AI');
  console.log(response);
} catch (error) {
  console.error('Error:', error);
}
```

## Proxy Configuration

The library supports proxy configuration in three ways:

1. **Environment Variables**:
   ```env
   HTTPS_PROXY=http://your-proxy-server:port
   HTTP_PROXY=http://your-proxy-server:port
   ```

2. **Direct Configuration**:
   ```javascript
   const llm = new LLM({
     provider: 'openai',
     modelName: 'gpt-4',
     proxyUrl: 'http://your-proxy-server:port'
   });
   ```

3. **No Proxy**:
   ```javascript
   const llm = new LLM({
     provider: 'openai',
     modelName: 'gpt-4'
     // No proxy configuration
   });
   ```

The proxy configuration is supported for both OpenAI and Anthropic providers. When using a proxy:
- All API requests will be routed through the specified proxy server
- The proxy configuration is applied consistently across all providers
- Both HTTP and HTTPS proxies are supported
- Proxy authentication is supported (if required by your proxy server)

## Error Handling

The wrapper uses Turbot's error handling system (`@turbot/errors`) to provide structured error types:

### Error Types

- `BadConfigurationError`: Thrown when required configuration is missing
  ```javascript
  try {
    const llm = new LLM({}); // Missing required config
  } catch (error) {
    if (error.name === 'BadConfigurationError') {
      console.error('Missing parameters:', error.missingParams);
    }
  }
  ```

- `ProviderError`: Thrown for provider-specific issues
  ```javascript
  try {
    await llm.generate('prompt');
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
    await llm.generate('prompt');
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
  log.info('LLM initialized', {
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

The `LLM` constructor accepts the following configuration options:

```javascript
{
  provider: string;      // The AI provider to use ('openai' or 'claude')
  modelName: string;     // The specific model to use (e.g., 'gpt-4', 'claude-3-opus-20240229')
  apiKey?: string;       // Optional API key. If not provided, will look for environment variable
  system?: string;       // Optional system prompt
  proxyUrl?: string;     // Optional proxy URL
}
```

### API Key Configuration

You can provide API keys in two ways:

1. **Direct Configuration**:
   ```javascript
   const llm = new LLM({
     provider: 'openai',
     modelName: 'gpt-4',
     apiKey: 'your-api-key-here'  // Direct API key
   });
   ```

2. **Environment Variables**:
   ```javascript
   // .env file
   OPENAI_API_KEY=your-openai-api-key
   ANTHROPIC_API_KEY=your-anthropic-api-key

   // In your code
   const llm = new LLM({
     provider: 'openai',
     modelName: 'gpt-4'
     // apiKey will be read from OPENAI_API_KEY environment variable
   });
   ```

The environment variable names follow this pattern:
- OpenAI: `OPENAI_API_KEY`
- Anthropic: `ANTHROPIC_API_KEY`

Note: If both `apiKey` and the corresponding environment variable are provided, the `apiKey` takes precedence.

## Supported Providers and Models

### OpenAI
- Models: gpt-4, gpt-4-turbo-preview, gpt-3.5-turbo
- Version: 1.3.22

### Anthropic
- Models: claude-3-opus-20240229, claude-3-sonnet-20240229, claude-3-haiku-20240307
- Version: 1.2.12

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Dependencies

- ai: 4.3.16
- @ai-sdk/openai: 1.3.22
- @ai-sdk/anthropic: 1.2.12
- @turbot/errors: 5.3.0
- @turbot/log: 5.5.0
- dotenv: 16.4.5

## Development Dependencies

- eslint: ^8.57.0
- jest: ^29.7.0

## Node.js Version

Requires Node.js >= 18.0.0