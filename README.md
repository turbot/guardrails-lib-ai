# Guardrails Lib AI

A unified interface for multiple AI language model providers. This wrapper provides a consistent API to interact with various AI providers while handling provider-specific configurations and fallback mechanisms.

## Features

- **Unified Interface**: Single API to interact with multiple AI providers
- **Provider Support**:
  - OpenAI (GPT-4, GPT-3.5)
  - Anthropic (Claude)
- **Error Handling**: Robust error handling with Turbot error types
- **Logging**: Structured logging with Turbot logging utilities
- **Type Safety**: Full TypeScript support
- **Proxy Support**: Built-in support for HTTP/HTTPS proxies

## Installation

```bash
npm install @turbot/guardrails-lib-ai
```

## Usage

```javascript
const AI = require('guardrails-lib-ai');

// Initialize with OpenAI using direct API key and proxy
const ai = new AI({
  provider: 'openai',
  modelName: 'gpt-4',
  apiKey: 'your-openai-api-key',  // Direct API key
  system: 'You are a helpful AI assistant.',
  proxyUrl: 'http://your-proxy-server:port'  // Optional proxy configuration
});

// Query the model
try {
  const response = await ai.generate('Explain quantum computing in simple terms');
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
const claude = new AI({
  provider: 'anthropic',
  modelName: 'claude-3-opus-20240229',
  apiKey: 'your-anthropic-api-key',  // Direct API key
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

The library supports proxy configuration in two ways:

1. **Direct Configuration**:
   ```javascript
   const ai = new AI({
     provider: 'openai',
     modelName: 'gpt-4',
     proxyUrl: 'http://your-proxy-server:port'
   });
   ```

2. **No Proxy**:
   ```javascript
   const ai = new AI({
     provider: 'openai',
     modelName: 'gpt-4'
     // No proxy configuration
   });
   ```

The proxy configuration is supported for both OpenAI and Anthropic providers. When using a proxy:
- All API requests will be routed through the specified proxy server
- The proxy configuration is applied consistently across all providers
- Both HTTP and HTTPS proxies are supported

## Error Handling

The wrapper uses Turbot's error handling system (`@turbot/errors`) to provide structured error types:

### Error Types

- `BadConfigurationError`: Thrown when required configuration is missing
  ```javascript
  try {
    const ai = new AI({}); // Missing required config
  } catch (error) {
    if (error.name === 'BadConfigurationError') {
      console.error('Missing parameters:', error.missingParams);
    }
  }
  ```

- `ProviderError`: Thrown for provider-specific issues
  ```javascript
  try {
    await ai.generate('prompt');
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
    await ai.generate('prompt');
  } catch (error) {
    if (error.name === 'ModelError') {
      console.error('Model error:', error.message);
      console.error('Model:', error.modelName);
    }
  }
  ```

## Configuration Options

The `AI` constructor accepts the following configuration options:

```javascript
{
  provider: string;      // The AI provider to use ('openai' or 'anthropic')
  modelName: string;     // The specific model to use (e.g., 'gpt-4', 'claude-3-opus-20240229')
  apiKey: string;        // API key (required)
  system?: string;       // Optional system prompt
  proxyUrl?: string;     // Optional proxy URL
  max_tokens?: number;   // Optional max tokens
  temperature?: number;  // Optional temperature
}
```

### API Key Configuration

You must provide API keys directly in the configuration:

```javascript
const ai = new AI({
  provider: 'openai',
  modelName: 'gpt-4',
  apiKey: 'your-api-key-here'  // Direct API key (required)
});
```

## Supported Providers and Models

  - OpenAI
  - Anthropic

## Node.js Version

Requires Node.js >= 18.0.0