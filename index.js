const Anthropic = require("@anthropic-ai/sdk");
const OpenAI = require("openai");
const undici = require("undici");
const errors = require("@turbot/errors");
const log = require("@turbot/log");

class MultiModelAI {
  constructor(config = {}) {
    // Validate required configuration
    const missingParams = [];
    if (!config.provider) missingParams.push("provider");
    if (!config.modelName) missingParams.push("modelName");

    // Check if API key is provided directly or via environment variable
    const envKeyName = `${config.provider?.toUpperCase()}_API_KEY`;
    if (!config.apiKey && !process.env[envKeyName]) {
      missingParams.push("apiKey (or corresponding environment variable)");
    }

    if (missingParams.length > 0) {
      const error = errors.badConfiguration(
        `Missing required configuration parameters: ${missingParams.join(
          ", "
        )}`,
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

    // Set up environment variable if API key is provided directly
    if (config.apiKey && !process.env[envKeyName]) {
      process.env[envKeyName] = config.apiKey;
    }

    this.config = {
      provider: config.provider,
      modelName: config.modelName,
      apiKey: config.apiKey, // Keep for reference, but providers will use env vars
      ...config,
    };

    log.info("MultiModelAI initialized", {
      provider: this.config.provider,
      modelName: this.config.modelName,
    });
  }

  getProviderClient(provider) {
    console.log("Creating Provider Client...", { provider });

    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    const proxyAgent = new undici.ProxyAgent(proxyUrl);

    switch (provider.toLowerCase()) {
      case "openai":
        return new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          fetchOptions: {
            dispatcher: proxyAgent,
          },
        });
      case "anthropic":
        return new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
          fetchOptions: {
            dispatcher: proxyAgent,
          },
        });
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async query(prompt, options = {}) {
    try {
      const { modelName, system, provider } = this.config;
      const { systemPrompt, ...rest } = options;

      // Configure provider client with proxy
      const client = this.getProviderClient(provider);

      console.log(`Executing the query with ${provider} and ${modelName}`);

      if (provider === "anthropic") {
        const message = await client.messages.create({
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
          model: modelName,
        });

        const content = message.content[0].text;
        if (content) {
          return JSON.stringify(content);
        }

        return content;
      } else {
        const completion = await client.chat.completions.create({
          model: modelName,
          messages: [{ role: "user", content: prompt }],
          max_tokens: options.max_tokens || 1000,
          temperature: options.temperature || 0.7,
        });

        return completion.choices[0].message.content;
      }
    } catch (error) {
      // Convert to Turbot error types
      let turbotError;
      if (error.message && error.message.includes("API")) {
        // API-related errors
        turbotError = errors.unavailable(`AI API error: ${error.message}`, {
          cause: error,
          provider: this.config.provider,
          modelName: this.config.modelName,
        });
      } else if (error.message && error.message.includes("model")) {
        // Model-related errors
        turbotError = errors.badConfiguration(
          `AI model error: ${error.message}`,
          {
            cause: error,
            provider: this.config.provider,
            modelName: this.config.modelName,
          }
        );
      } else {
        // General AI query errors
        turbotError = errors.internal(
          `Unexpected error during AI query: ${error.message}`,
          {
            cause: error,
            provider: this.config.provider,
            modelName: this.config.modelName,
          }
        );
      }

      log.error("AI query failed", {
        error: turbotError.message,
        errorType: turbotError.constructor.name,
        provider: this.config.provider,
        modelName: this.config.modelName,
        stack: turbotError.stack,
      });

      throw turbotError;
    }
  }
}

module.exports = MultiModelAI;
