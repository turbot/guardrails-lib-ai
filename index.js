const { generateText } = require('ai');
const { openai } = require('@ai-sdk/openai');
const { anthropic } = require('@ai-sdk/anthropic');
const { deepseek } = require('@ai-sdk/deepseek');
const { mistral } = require('@ai-sdk/mistral');
const { groq } = require('@ai-sdk/groq');
const { togetherai } = require('@ai-sdk/togetherai');
const { cohere } = require('@ai-sdk/cohere');
const { fireworks } = require('@ai-sdk/fireworks');
const { deepinfra } = require('@ai-sdk/deepinfra');
const { cerebras } = require('@ai-sdk/cerebras');
const { perplexity } = require('@ai-sdk/perplexity');
const errors  = require('@turbot/errors');
const  log  = require('@turbot/log');

const PROVIDERS = {
  openai,
  anthropic,
  deepseek,
  mistral,
  groq,
  togetherai,
  cohere,
  fireworks,
  deepinfra,
  cerebras,
  perplexity,
};

class MultiModelAI {
  constructor(config = {}) {
    // Validate required configuration
    const missingParams = [];
    if (!config.provider) missingParams.push('provider');
    if (!config.modelName) missingParams.push('modelName');
    if (!config.apiKey && !process.env[`${config.provider?.toUpperCase()}_API_KEY`]) {
      missingParams.push('apiKey (or corresponding environment variable)');
    }

    if (missingParams.length > 0) {
      const error = new errors.BadConfigurationError(
        `Missing required configuration parameters: ${missingParams.join(', ')}`,
        {
          missingParams,
          config: { ...config, apiKey: config.apiKey ? '[REDACTED]' : undefined }
        }
      );
      log.error('Invalid configuration', {
        error: error.message,
        missingParams,
      });
      throw error;
    }

    this.config = {
      provider: config.provider,
      modelName: config.modelName,
      apiKey: config.apiKey, // Not used directly, relies on env vars
      ...config,
    };
    this.provider = this.getProvider();
    log.info('MultiModelAI initialized', {
      provider: this.config.provider,
      modelName: this.config.modelName,
    });
  }

  getProvider() {
    const providerKey = this.config.provider.toLowerCase();
    const provider = PROVIDERS[providerKey];
    if (!provider) {
      const error = new errors.ProviderError(`Unsupported provider: ${providerKey}`);
      log.error('Provider not supported', {
        provider: providerKey,
        error: error.message,
      });
      throw error;
    }
    return provider;
  }

  async query(prompt, options = {}) {
    const startTime = Date.now();

    try {
      const { modelName, system } = this.config;
      const { systemPrompt, ...rest } = options;
      const result = await generateText({
        model: this.provider(modelName),
        system: systemPrompt || system || undefined,
        prompt,
        ...rest,
      });

      return result.text;
    } catch (error) {
      // Convert to Turbot error types
      let turbotError;
      if (error.name === 'ProviderError') {
        turbotError = new errors.ProviderError(error.message, {
          cause: error,
          provider: this.config.provider,
          modelName: this.config.modelName,
        });
      } else if (error.name === 'ModelError') {
        turbotError = new errors.ModelError(error.message, {
          cause: error,
          provider: this.config.provider,
          modelName: this.config.modelName,
        });
      } else {
        turbotError = new errors.AIError('Unexpected error during AI query', {
          cause: error,
          provider: this.config.provider,
          modelName: this.config.modelName,
        });
      }

      log.error('AI query failed', {
        error: turbotError.message,
        errorType: turbotError.name,
        provider: this.config.provider,
        modelName: this.config.modelName,
        stack: turbotError.stack,
      });

      throw turbotError;
    }
  }
}

module.exports = MultiModelAI;