# Testing Guide

## Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Runs unit tests only (default) |
| `npm run test:unit` | Runs unit tests only (explicit) |
| `npm run test:integration` | Runs all integration tests with real API calls |
| `npm run test:integration:openai` | Runs OpenAI integration tests only |
| `npm run test:integration:anthropic` | Runs Anthropic integration tests only |
| `npm run test:integration:bedrock` | Runs AWS Bedrock integration tests only |
| `npm run test:integration:azure` | Runs Azure OpenAI integration tests only |

## Unit Tests vs Integration Tests

### Unit Tests (`__tests__/unit/`)

Unit tests use **mocked API clients** - no real API calls are made.

**Purpose:**
- Verify parameter transformation logic (e.g., `maxTokens` → `max_completion_tokens`)
- Test validation (required fields, error messages)
- Verify provider-specific behavior (e.g., GPT-5 temperature handling)
- Fast execution, no API keys needed

**What they test:**
- `AI.test.js` - Main AI class, model name normalization
- `providers/OpenAIProvider.test.js` - OpenAI parameter handling
- `providers/AnthropicProvider.test.js` - Anthropic parameter handling
- `providers/AwsBedrockProvider.test.js` - AWS Bedrock parameter handling
- `providers/AzureOpenAIProvider.test.js` - Azure OpenAI parameter handling
- `providers/ProviderFactory.test.js` - Factory pattern, provider creation
- `providers/BaseProvider.test.js` - Abstract base class

**Run with:**
```bash
npm test
# or
npm run test:unit
```

### Integration Tests (`__tests__/integration/`)

Integration tests make **real API calls** to verify parameter handling works correctly
across different model families within each provider.

**Purpose:**

- Verify parameter transformation works for different model families (e.g., GPT-4 vs GPT-5)
- Test actual API connectivity and response parsing
- Catch SDK/API changes and model-specific requirements

**Setup:**

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your API keys and models to test

**Environment Variables:**

```bash
# OpenAI (only API key needed - models are hardcoded)
# Tests: gpt-4o, gpt-4.1, gpt-5, gpt-5.1, o1, o3, o4-mini families
OPENAI_API_KEY=sk-...

# Anthropic (only API key needed - models are hardcoded)
# Tests: Claude 4.5 (sonnet/haiku/opus), Claude 4, Claude 3.7, Claude 3.5, Claude 3
ANTHROPIC_API_KEY=sk-ant-...

# AWS Bedrock (only API key needed - models are hardcoded)
# Tests: Amazon Nova, Claude on Bedrock
AWS_BEDROCK_API_KEY=<bearer-token>
AWS_BEDROCK_REGION=us-east-1  # optional, defaults to us-east-1

# Azure OpenAI (only API key and endpoint needed - deployments are hardcoded)
# Tests: gpt-4o, gpt-4o-mini, gpt-4.1-mini, gpt-5, gpt-5-mini
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-04-01-preview
```

**Run with:**

```bash
npm run test:integration
```

Tests are automatically skipped if required environment variables are not set.

**Why test multiple models?**

Different model families have different parameter requirements:

- **GPT-5** doesn't support the `temperature` parameter
- **OpenAI** uses `max_completion_tokens`, **Azure** uses `max_tokens`
- Parameter validation may differ between model versions

By testing multiple models, we ensure the library handles these differences correctly.

## Infrastructure (OpenTofu)

The `infra/` folder contains OpenTofu scripts to provision cloud resources for integration testing.

### Azure OpenAI

Provisions an Azure OpenAI resource with model deployments.

```bash
cd __tests__/infra/azure-openai
tofu init
tofu apply -var="subscription_id=$(az account show --query id -o tsv)"
```

After provisioning, view the environment variables:

```bash
tofu output -raw env_config
```

Copy the output to your `.env` file.

See [infra/README.md](infra/README.md) for more details.

## Directory Structure

```
__tests__/
├── README.md              # This file
├── setup.js               # Jest setup (cleanup after each test)
├── __mocks__/             # Mock implementations for unit tests
│   ├── openai.js
│   ├── undici.js
│   ├── @anthropic-ai/
│   │   └── sdk.js
│   └── @aws-sdk/
│       └── client-bedrock-runtime.js
├── unit/                  # Unit tests (mocked)
│   ├── AI.test.js
│   └── providers/
│       ├── BaseProvider.test.js
│       ├── OpenAIProvider.test.js
│       ├── AnthropicProvider.test.js
│       ├── AwsBedrockProvider.test.js
│       ├── AzureOpenAIProvider.test.js
│       └── ProviderFactory.test.js
├── integration/           # Integration tests (real API calls)
│   ├── testUtils.js       # Shared utilities
│   ├── openai.integration.test.js
│   ├── anthropic.integration.test.js
│   ├── bedrock.integration.test.js
│   ├── azure-openai.integration.test.js
│   ├── cross-provider.integration.test.js
│   └── providerStatsReporter.js  # Custom Jest reporter
└── infra/                 # OpenTofu scripts for cloud resources
    └── azure-openai/      # Azure OpenAI provisioning
```

## Provider Parameter Differences

The unit tests specifically verify these critical differences:

| Provider | maxTokens Field | maxTokens Required | Temperature | System Prompt |
|----------|-----------------|-------------------|-------------|---------------|
| OpenAI | `max_completion_tokens` | No (has default) | Skipped for GPT-5 | In messages array |
| Azure OpenAI | `max_tokens` | No (has default) | Skipped for GPT-5 | In messages array |
| Anthropic | `max_tokens` | **Yes (required)** | Always allowed | Separate `system` field |
| AWS Bedrock | `inferenceConfig.maxTokens` | No (has default) | Always allowed | `[{ text: "..." }]` format |

**Important:** Anthropic requires `maxTokens` to be explicitly set - it has no default value. OpenAI and other providers have sensible defaults.
