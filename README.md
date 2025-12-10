# Guardrails Lib AI

A unified interface for multiple AI language model providers. This library provides a consistent API to interact with various AI providers while handling provider-specific configurations.

## Features

- **Unified Interface**: Single API to interact with multiple AI providers
- **Provider Support**:
  - OpenAI (GPT-5, GPT-4, GPT-3.5)
  - Anthropic (Claude)
  - AWS Bedrock (Nova, Titan, Claude on Bedrock)
  - Azure OpenAI
- **OOP Design**: Strategy and Factory patterns for extensibility
- **Error Handling**: Robust error handling with Turbot error types
- **Proxy Support**: Built-in support for HTTP/HTTPS proxies

## Installation

```bash
npm install @turbot/guardrails-lib-ai
```

## Quick Start

```javascript
const AI = require("guardrails-lib-ai");

// Initialize with provider configuration
const ai = new AI({
  provider: "openai",
  apiKey: "your-api-key",
  model: "gpt-4",
  system: "You are a helpful AI assistant.",
});

// Generate a response
const response = await ai.generate({
  prompt: "Explain quantum computing in simple terms",
  temperature: 0.2,
  maxTokens: 1000,
});

console.log(response.response);
```

## API Design

### Constructor: Connection Setup (Set Once)

- Provider and authentication (`provider`, `apiKey`)
- Model selection (`model`, `modelName`, `modelId`, `deployment`)
- AI's identity (`system` prompt)
- Infrastructure settings (`region`, `endpoint`, `proxyUrl`)

### generate(): Request Behavior (Per Request)

- User prompt (`prompt`)
- Behavior parameters (`temperature`, `maxTokens`)
- Can vary for each request without recreating the client

## Provider Examples

### OpenAI

```javascript
const ai = new AI({
  provider: "openai",
  apiKey: "sk-...",
  model: "gpt-4",
  system: "You are a helpful AI assistant.",
});

const response = await ai.generate({
  prompt: "What is the capital of France?",
  temperature: 0.2,
  maxTokens: 1000,
});
```

### Anthropic

```javascript
const ai = new AI({
  provider: "anthropic",
  apiKey: "sk-ant-...",
  model: "claude-3-opus-20240229",
  system: "You are a helpful AI assistant.",
});

const response = await ai.generate({
  prompt: "Write a short poem about AI",
  temperature: 0.7,
  maxTokens: 500,
});
```

### AWS Bedrock

```javascript
const ai = new AI({
  provider: "aws bedrock",
  apiKey: "your-bearer-token",
  modelId: "amazon.nova-lite-v1:0",
  region: "us-east-1", // Required for AWS Bedrock
  system: "You are an AWS expert.",
});

const response = await ai.generate({
  prompt: "What is AWS Bedrock?",
  temperature: 0.2,
  maxTokens: 1000,
});
```

### Azure OpenAI

```javascript
const ai = new AI({
  provider: "azure openai",
  apiKey: "your-azure-api-key",
  endpoint: "https://your-resource.openai.azure.com/", // Required
  deployment: "gpt-35-turbo", // Required
  apiVersion: "2024-04-01-preview", // Required
  system: "You are a helpful AI assistant.",
});

const response = await ai.generate({
  prompt: "What is Azure OpenAI?",
  temperature: 0.5,
  maxTokens: 1000,
});
```

## Configuration Options

### Constructor Parameters

<details>
<summary><strong>OpenAI</strong></summary>

| Parameter  | Type   | Required | Description                  |
| ---------- | ------ | -------- | ---------------------------- |
| `provider` | string | Yes      | `"openai"`                   |
| `apiKey`   | string | Yes      | OpenAI API key               |
| `model`    | string | Yes      | Model name (e.g., `gpt-4`)   |
| `system`   | string | No       | System prompt (AI's persona) |
| `proxyUrl` | string | No       | HTTP proxy URL               |

</details>

<details>
<summary><strong>Anthropic</strong></summary>

| Parameter  | Type   | Required | Description                                 |
| ---------- | ------ | -------- | ------------------------------------------- |
| `provider` | string | Yes      | `"anthropic"`                               |
| `apiKey`   | string | Yes      | Anthropic API key                           |
| `model`    | string | Yes      | Model name (e.g., `claude-3-opus-20240229`) |
| `system`   | string | No       | System prompt (AI's persona)                |
| `proxyUrl` | string | No       | HTTP proxy URL                              |

</details>

<details>
<summary><strong>AWS Bedrock</strong></summary>

| Parameter  | Type   | Required | Description                              |
| ---------- | ------ | -------- | ---------------------------------------- |
| `provider` | string | Yes      | `"aws bedrock"`                          |
| `apiKey`   | string | Yes      | Bearer token for authentication          |
| `modelId`  | string | Yes      | Model ID (e.g., `amazon.nova-lite-v1:0`) |
| `region`   | string | Yes      | AWS region (e.g., `us-east-1`)           |
| `system`   | string | No       | System prompt (AI's persona)             |
| `proxyUrl` | string | No       | HTTP proxy URL                           |

</details>

<details>
<summary><strong>Azure OpenAI</strong></summary>

| Parameter    | Type   | Required | Description                                  |
| ------------ | ------ | -------- | -------------------------------------------- |
| `provider`   | string | Yes      | `"azure openai"`                             |
| `apiKey`     | string | Yes      | Azure OpenAI API key                         |
| `endpoint`   | string | Yes      | Azure OpenAI endpoint URL                    |
| `deployment` | string | Yes      | Azure deployment name (e.g., `gpt-35-turbo`) |
| `apiVersion` | string | Yes      | API version (e.g., `2024-04-01-preview`)     |
| `system`     | string | No       | System prompt (AI's persona)                 |
| `proxyUrl`   | string | No       | HTTP proxy URL                               |

</details>

### generate() Parameters

| Parameter     | Type   | Required | Description                |
| ------------- | ------ | -------- | -------------------------- |
| `prompt`      | string | Yes      | User prompt/question       |
| `temperature` | number | No       | Response randomness (0-1)  |
| `maxTokens`   | number | No       | Maximum tokens to generate |

### Response Object

```javascript
{
  success: true,
  provider: "openai",
  prompt: "...",
  response: "...",           // AI's response text
  model: "gpt-4",
  usage: {
    inputTokens: 100,
    outputTokens: 200,
    totalTokens: 300
  },
  timestamp: "2025-10-30T12:00:00.000Z",
  config: {
    temperature: 0.2,
    maxTokens: 1000
  }
}
```

## Proxy Configuration

The library supports proxy configuration in two ways:

1. **Direct Configuration**:

   ```javascript
   const ai = new AI({
     provider: "openai",
     apiKey: "sk-...",
     model: "gpt-4",
     proxyUrl: "http://your-proxy-server:port",
   });
   ```

2. **Environment Variables**:

   ```javascript
   // Set HTTPS_PROXY or HTTP_PROXY environment variable
   // The library will automatically use it
   const ai = new AI({
     provider: "openai",
     apiKey: "sk-...",
     model: "gpt-4",
   });
   ```

## Error Handling

The library uses Turbot's error handling system (`@turbot/errors`):

```javascript
async function main() {
  try {
    const ai = new AI({
      provider: "openai",
      apiKey: "sk-...",
      model: "gpt-4",
    });

    const response = await ai.generate({
      prompt: "Hello",
    });
    console.log(response.response);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
```

## Utility Methods

```javascript
// Get current provider name
const providerName = ai.getProviderName();

// Get list of supported providers (static method)
const providers = AI.getSupportedProviders();
// Returns: ['openai', 'anthropic', 'aws bedrock', 'azure openai']
```

## Node.js Version

Requires Node.js >= 18.0.0
