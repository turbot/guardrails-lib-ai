# Guardrails AI Library v2 - API Reference

## 📋 Design Philosophy

### **Constructor: Client Setup (Set Once)**
- Connection details (provider, apiKey, endpoint, etc.)
- AI's identity (system prompt)
- Infrastructure settings (region, proxy)

### **generate(): Request Behavior (Per Request)**
- User prompt (what to ask)
- Behavior parameters (temperature, maxTokens)
- Can vary for each request without recreating client

---

## 🔧 Constructor Parameters

### **Common Parameters (All Providers)**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `provider` | string | ✅ Yes | Provider name: `openai`, `anthropic`, `aws bedrock`, `azure openai` |
| `apiKey` | string | ✅ Yes | API key for authentication |
| `model` / `modelName` / `modelId` | string | ✅ Yes | Model name or ID (use any alias) |
| `system` | string | ❌ No | System prompt - defines AI's persona/role |
| `proxyUrl` | string | ❌ No | HTTP proxy URL |

### **OpenAI-Specific Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `provider` | string | ✅ Yes | Must be `"openai"` |
| `apiKey` | string | ✅ Yes | OpenAI API key |
| `model` | string | ✅ Yes | Model name (e.g., `gpt-4`, `gpt-4-turbo`) |

**Example:**
```javascript
const ai = new AI({
  provider: "openai",
  apiKey: "sk-...",
  model: "gpt-4",
  system: "You are a cloud security expert"
});
```

### **Anthropic-Specific Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `provider` | string | ✅ Yes | Must be `"anthropic"` |
| `apiKey` | string | ✅ Yes | Anthropic API key |
| `model` | string | ✅ Yes | Model name (e.g., `claude-sonnet-4-20250514`) |

**Example:**
```javascript
const ai = new AI({
  provider: "anthropic",
  apiKey: "sk-ant-...",
  model: "claude-sonnet-4-20250514"
});
```

### **AWS Bedrock-Specific Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `provider` | string | ✅ Yes | Must be `"aws bedrock"` |
| `apiKey` | string | ✅ Yes | AWS Bedrock API key (bearer token) |
| `modelId` | string | ✅ Yes | Model ID or ARN |
| `region` | string | ✅ Yes | AWS region (e.g., `us-east-1`) |

**Example:**
```javascript
const ai = new AI({
  provider: "aws bedrock",
  apiKey: "ABSK...",
  modelId: "arn:aws:bedrock:us-east-1:013122550996:inference-profile/us.amazon.nova-lite-v1:0",
  region: "us-east-1"
});
```

### **Azure OpenAI-Specific Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `provider` | string | ✅ Yes | Must be `"azure openai"` |
| `apiKey` | string | ✅ Yes | Azure OpenAI API key |
| `endpoint` | string | ✅ Yes | Azure OpenAI endpoint URL |
| `deployment` | string | ✅ Yes | Deployment name |
| `apiVersion` | string | ✅ Yes | API version (e.g., `2024-12-01-preview`) |

**Example:**
```javascript
const ai = new AI({
  provider: "azure openai",
  apiKey: "abc123...",
  endpoint: "https://sd-turbot-openai.openai.azure.com/",
  deployment: "o4-mini",
  apiVersion: "2024-12-01-preview"
});
```

---

## 🎯 generate() Method Parameters

### **Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | ✅ Yes | User prompt/question |
| `temperature` | number | ❌ No | Response randomness (0-1). Lower = focused, Higher = creative |
| `maxTokens` | number | ❌ No | Maximum tokens to generate in response |
| `model` | string | ❌ No | Override model for this specific request |

### **Response Object**

```javascript
{
  success: true,
  provider: "openai",          // Provider name
  prompt: "...",               // Original prompt
  response: "...",             // AI's response text
  model: "gpt-4",              // Model used
  usage: {                     // Token usage stats
    inputTokens: 100,
    outputTokens: 200,
    totalTokens: 300
  },
  timestamp: "2025-10-30T...", // ISO timestamp
  config: {                    // Config used for this request
    temperature: 0.2,
    maxTokens: 1000
  }
}
```

---

## 📚 Complete Examples

### **Example 1: OpenAI with Different Behaviors**

```javascript
const ai = new AI({
  provider: "openai",
  apiKey: "sk-...",
  model: "gpt-4",
  system: "You are a cloud security expert"
});

// Creative brainstorming
const creative = await ai.generate({
  prompt: "Suggest innovative security controls",
  temperature: 0.9,
  maxTokens: 2000
});

// Factual analysis
const factual = await ai.generate({
  prompt: "Is this S3 bucket encrypted?",
  temperature: 0.1,
  maxTokens: 500
});
```

### **Example 2: AWS Bedrock**

```javascript
const ai = new AI({
  provider: "aws bedrock",
  apiKey: "ABSK...",
  modelId: "amazon.nova-lite-v1:0",
  region: "us-east-1",
  system: "You are an AWS compliance expert"
});

const response = await ai.generate({
  prompt: "Check if EC2 instance follows best practices",
  temperature: 0.2,
  maxTokens: 1000
});
```

### **Example 3: Azure OpenAI**

```javascript
const ai = new AI({
  provider: "azure openai",
  apiKey: "abc123...",
  endpoint: "https://sd-turbot-openai.openai.azure.com/",
  deployment: "o4-mini",
  apiVersion: "2024-12-01-preview"
});

const response = await ai.generate({
  prompt: "Analyze this resource configuration",
  temperature: 1.0,
  maxTokens: 1000
});
```

### **Example 4: Using Credentials from Guardrails**

```javascript
// Credentials come from Guardrails credentials resolver
const credentials = $.credentials;  // From GraphQL credentials(type: "ai")

// Constructor: Only connection details from credentials
const ai = new AI({
  provider: credentials.provider,
  apiKey: credentials.$apiKey,
  model: credentials.model || credentials.modelId,
  region: credentials.region,           // AWS Bedrock
  endpoint: credentials.endpoint,       // Azure OpenAI
  deployment: credentials.deployment,   // Azure OpenAI
  apiVersion: credentials.apiVersion,   // Azure OpenAI
  system: $.intelligentAssessmentSystemPrompt  // From policy
});

// generate(): Behavior from control execution
const response = await ai.generate({
  prompt: getUserPrompt(),
  temperature: credentials.temperature,  // From policy (optional)
  maxTokens: credentials.maxTokens       // From policy (optional)
});
```

---

## ⚠️ Important Notes

### **System Prompt is NOT Overridable**

```javascript
const ai = new AI({
  system: "You are a security expert"  // ✅ Set in constructor
});

// ❌ Cannot override system in generate()
await ai.generate({
  prompt: "Check S3 bucket"
  // system: "Different role"  ← NOT SUPPORTED
});
```

**Why?** System prompt defines the AI's identity. If you need a different identity, create a different AI instance.

### **temperature and maxTokens are ONLY in generate()**

```javascript
// ❌ Wrong - these are ignored in constructor
const ai = new AI({
  provider: "openai",
  apiKey: "...",
  model: "gpt-4",
  temperature: 0.2,  // ❌ IGNORED
  maxTokens: 1000    // ❌ IGNORED
});

// ✅ Right - pass in generate()
const response = await ai.generate({
  prompt: "...",
  temperature: 0.2,  // ✅ USED
  maxTokens: 1000    // ✅ USED
});
```

---

## 🔄 Migration from v1

### **v1 (Old):**
```javascript
const AI = require('guardrails-lib-ai');

const ai = new AI({
  provider: "openai",
  modelName: "gpt-4",
  apiKey: "sk-...",
  temperature: 0.2,    // ← In constructor
  max_tokens: 1000     // ← In constructor
});

const response = await ai.generate({
  prompt: "Hello",
  system: "You are helpful"  // ← In generate()
});
```

### **v2 (New):**
```javascript
const AI = require('guardrails-lib-ai/v2');

const ai = new AI({
  provider: "openai",
  model: "gpt-4",
  apiKey: "sk-...",
  system: "You are helpful"  // ← In constructor
});

const response = await ai.generate({
  prompt: "Hello",
  temperature: 0.2,    // ← In generate()
  maxTokens: 1000      // ← In generate()
});
```

**Key Changes:**
- `system` moved from generate() → constructor
- `temperature` moved from constructor → generate()
- `maxTokens` moved from constructor → generate()
- `modelName` → `model` (still accepts both)

---

## ✅ Summary

| Parameter | Constructor | generate() | Reason |
|-----------|-------------|------------|--------|
| `provider` | ✅ | ❌ | Connection setup |
| `apiKey` | ✅ | ❌ | Authentication |
| `model` | ✅ | ✅ (override) | Connection setup, but can override |
| `system` | ✅ | ❌ | AI's identity/persona |
| `region` | ✅ | ❌ | Infrastructure (AWS) |
| `endpoint` | ✅ | ❌ | Infrastructure (Azure) |
| `deployment` | ✅ | ❌ | Infrastructure (Azure) |
| `apiVersion` | ✅ | ❌ | Infrastructure (Azure) |
| `prompt` | ❌ | ✅ | What to ask |
| `temperature` | ❌ | ✅ | Request behavior |
| `maxTokens` | ❌ | ✅ | Request behavior |

