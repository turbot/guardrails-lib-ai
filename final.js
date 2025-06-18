const Anthropic = require("@anthropic-ai/sdk");
const OpenAI = require("openai");
const undici = require("undici");
const errors = require("@turbot/errors");
const log = require("@turbot/log");

class MultiModelAI {
  constructor(config = {}) {
    this.validateConfig(config);
    this.setupConfig(config);
    this.clients = new Map(); // Cache for provider clients
    
    log.info("MultiModelAI initialized", {
      provider: this.config.provider,
      modelName: this.config.modelName,
    });
  }

  validateConfig(config) {
    const missingParams = [];
    if (!config.provider) missingParams.push("provider");
    if (!config.modelName) missingParams.push("modelName");

    const envKeyName = `${config.provider?.toUpperCase()}_API_KEY`;
    if (!config.apiKey && !process.env[envKeyName]) {
      missingParams.push("apiKey (or corresponding environment variable)");
    }

    if (missingParams.length > 0) {
      const error = errors.badConfiguration(
        `Missing required configuration parameters: ${missingParams.join(", ")}`,
        {
          missingParams,
          config: {
            ...config,
            apiKey: config.apiKey ? "[REDACTED]" : undefined,
          },
        }
      );
      log.error("Invalid configuration", {
        error: error.message,
        missingParams,
      });
      throw error;
    }
  }

  setupConfig(config) {
    const envKeyName = `${config.provider.toUpperCase()}_API_KEY`;
    
    // Only set environment variable if not already set
    if (config.apiKey && !process.env[envKeyName]) {
      process.env[envKeyName] = config.apiKey;
    }

    this.config = {
      provider: config.provider.toLowerCase(),
      modelName: config.modelName,
      maxTokens: config.maxTokens || 1024,
      temperature: config.temperature || 0.7,
      ...config,
    };
  }

  getProviderClient(provider) {
    // Return cached client if available
    if (this.clients.has(provider)) {
      return this.clients.get(provider);
    }

    log.debug("Creating new provider client", { provider });

    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    const fetchOptions = proxyUrl ? { dispatcher: new undici.ProxyAgent(proxyUrl) } : {};

    let client;
    switch (provider) {
      case "openai":
        client = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          fetchOptions,
        });
        break;
      case "anthropic":
        client = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
          fetchOptions,
        });
        break;
      default:
        throw errors.badConfiguration(`Unsupported provider: ${provider}`, {
          provider,
          supportedProviders: ["openai", "anthropic"],
        });
    }

    // Cache the client
    this.clients.set(provider, client);
    return client;
  }

  async queryAnthropic(client, prompt, options) {
    const message = await client.messages.create({
      max_tokens: options.maxTokens || this.config.maxTokens,
      messages: [{ role: "user", content: prompt }],
      model: this.config.modelName,
      ...(options.systemPrompt && { system: options.systemPrompt }),
    });

    return message.content[0]?.text || "";
  }

  async queryOpenAI(client, prompt, options) {
    const messages = [{ role: "user", content: prompt }];
    
    if (options.systemPrompt) {
      messages.unshift({ role: "system", content: options.systemPrompt });
    }

    const completion = await client.chat.completions.create({
      model: this.config.modelName,
      messages,
      max_tokens: options.maxTokens || this.config.maxTokens,
      temperature: options.temperature ?? this.config.temperature,
    });

    return completion.choices[0]?.message?.content || "";
  }

  async query(prompt, options = {}) {
    if (!prompt?.trim()) {
      throw errors.badRequest("Prompt cannot be empty", { prompt });
    }

    try {
      const { provider } = this.config;
      const client = this.getProviderClient(provider);

      log.debug("Executing AI query", {
        provider,
        modelName: this.config.modelName,
        promptLength: prompt.length,
      });

      let result;
      if (provider === "anthropic") {
        result = await this.queryAnthropic(client, prompt, options);
      } else if (provider === "openai") {
        result = await this.queryOpenAI(client, prompt, options);
      }

      log.debug("AI query completed successfully", {
        provider,
        responseLength: result?.length || 0,
      });

      return result;
    } catch (error) {
      const turbotError = this.createTurbotError(error);
      
      log.error("AI query failed", {
        error: turbotError.message,
        errorType: turbotError.constructor.name,
        provider: this.config.provider,
        modelName: this.config.modelName,
        originalError: error.message,
      });

      throw turbotError;
    }
  }

  createTurbotError(error) {
    const context = {
      cause: error,
      provider: this.config.provider,
      modelName: this.config.modelName,
    };

    // More specific error classification
    if (error.status === 401 || error.message?.includes("auth")) {
      return errors.unauthorized(`AI API authentication failed: ${error.message}`, context);
    }
    
    if (error.status === 429 || error.message?.includes("rate limit")) {
      return errors.throttled(`AI API rate limit exceeded: ${error.message}`, context);
    }
    
    if (error.status >= 400 && error.status < 500) {
      return errors.badRequest(`AI API client error: ${error.message}`, context);
    }
    
    if (error.status >= 500 || error.message?.includes("API")) {
      return errors.unavailable(`AI API server error: ${error.message}`, context);
    }
    
    if (error.message?.includes("model")) {
      return errors.badConfiguration(`AI model error: ${error.message}`, context);
    }

    return errors.internal(`Unexpected error during AI query: ${error.message}`, context);
  }

  // Utility method to clear cached clients (useful for testing or config changes)
  clearClientCache() {
    this.clients.clear();
    log.debug("Provider client cache cleared");
  }

  // Utility method to check if provider is supported
  static getSupportedProviders() {
    return ["openai", "anthropic"];
  }
}

module.exports = MultiModelAI;