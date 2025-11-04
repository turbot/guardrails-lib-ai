/**
 * Guardrails AI Library
 *
 * A unified interface for interacting with multiple AI service providers
 * including OpenAI, Anthropic, AWS Bedrock, and Azure OpenAI.
 *
 * This library provides:
 * - Standardized API across different AI providers
 * - Automatic credential management
 * - Provider-specific configuration handling
 * - Secret decryption for API keys
 * - HTTP proxy support
 * - Consistent error handling
 *
 * Usage:
 *   const AI = require('guardrails-lib-ai');
 *   const ai = new AI({
 *     provider: "openai",
 *     apiKey: "sk-...",
 *     modelName: "gpt-4",
 *     temperature: 0.2
 *   });
 *   const response = await ai.generate("Your prompt here");
 *
 * @module guardrails-lib-ai
 */

const { OpenAI, AzureOpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { BedrockRuntimeClient, ConverseCommand } = require("@aws-sdk/client-bedrock-runtime");
const errors = require("@turbot/errors");

/**
 * Supported AI provider configurations.
 * Each provider has a display name and specific implementation requirements.
 *
 * Supported providers:
 * - openai: OpenAI GPT models (gpt-4, gpt-4-turbo, etc.)
 * - anthropic: Anthropic Claude models
 * - aws bedrock: AWS Bedrock foundation models
 * - azure openai: Azure OpenAI Service
 */
const PROVIDERS = {
    openai: {
        name: 'OpenAI GPT',
    },
    anthropic: {
        name: 'Anthropic Claude',
    },
    "aws bedrock": {
        name: 'AWS Bedrock',
    },
    "azure openai": {
        name: 'Azure OpenAI',
    }
};

/**
 * AI class for interacting with multiple AI service providers.
 *
 * Supports OpenAI, Anthropic, AWS Bedrock, and Azure OpenAI.
 * Handles provider-specific configurations, authentication, and API calls.
 *
 * @class
 * @example
 * const ai = new AI({
 *   provider: "openai",
 *   apiKey: "sk-...",
 *   modelName: "gpt-4",
 *   temperature: 0.2,
 *   max_tokens: 1000
 * });
 */
class AI {
    /**
     * Initialize AI client with provider-specific configuration.
     *
     * @param {Object} config - Configuration object
     * @param {string} config.provider - AI provider (openai, anthropic, aws bedrock, azure openai)
     * @param {string} config.apiKey - API key for authentication
     * @param {string} config.modelName - Model name or ID (required)
     * @param {string} [config.modelId] - AWS Bedrock model ID (alternative to modelName)
     * @param {string} [config.region] - AWS region for Bedrock
     * @param {string} [config.endpoint] - Azure OpenAI endpoint URL
     * @param {string} [config.deployment] - Azure OpenAI deployment name
     * @param {string} [config.apiVersion] - Azure OpenAI API version
     * @param {string} [config.system] - System prompt
     * @param {number} [config.max_tokens] - Maximum tokens for response
     * @param {number} [config.temperature] - Temperature for response randomness (0-1)
     * @param {string} [config.proxyUrl] - HTTP proxy URL
     */
    constructor(config = {}) {
        // Validate required provider field
        if (!config.provider) {
          throw errors.badConfiguration(
            "Provider is required. Supported providers: openai, anthropic, aws bedrock, azure openai"
          );
        }

        // Normalize provider to lowercase
        const normalizedProvider = config.provider.toLowerCase();

        // Validate provider is supported
        if (!PROVIDERS[normalizedProvider]) {
          throw errors.badConfiguration(
            `Invalid provider: ${config.provider}. Supported providers: ${Object.keys(PROVIDERS).join(', ')}`
          );
        }

        // Validate API key (required for all providers)
        if (!config.apiKey) {
          throw errors.badConfiguration("API key is required. Please provide your API key");
        }

        // Validate model/modelId (required for all providers)
        const modelName = config.modelName || config.modelId || config.model || config.deployment;
        if (!modelName) {
          throw errors.badConfiguration(
            "Model name or model ID is required. Please specify a model name"
          );
        }

        // Validate provider-specific required fields
        if (normalizedProvider === "aws bedrock") {
            if (!config.region) {
                throw errors.badConfiguration(
                  "AWS region is required for AWS Bedrock provider. Please specify a region"
                );
            }
        } else if (normalizedProvider === "azure openai") {
            if (!config.endpoint) {
                throw errors.badConfiguration(
                  "Endpoint is required for Azure OpenAI provider. Please specify an endpoint"
                );
            }
            if (!config.deployment) {
                throw errors.badConfiguration(
                  "Deployment name is required for Azure OpenAI provider. Please specify a deployment"
                );
            }
            if (!config.apiVersion) {
                throw errors.badConfiguration(
                  "API version is required for Azure OpenAI provider. Please specify an API version"
                );
            }
        }

        // Store base configuration
        this.defaultConfig = {
            provider: normalizedProvider,
            // Model name (or modelId for AWS Bedrock)
            modelName: modelName,
            // System prompt for AI instructions
            system: config.system,
            // API authentication key
            apiKey: config.apiKey,
            // Proxy configuration (checks env vars as fallback)
            proxyUrl: config.proxyUrl || process.env.HTTPS_PROXY || process.env.HTTP_PROXY,
            // Response length limit (provider-specific defaults if not provided)
            max_tokens: config.max_tokens,
            // Response randomness/creativity (0=deterministic, 1=creative)
            temperature: config.temperature
        };

        // Store provider-specific configurations
        if (normalizedProvider === "aws bedrock") {
            this.defaultConfig.region = config.region;
            this.defaultConfig.modelId = modelName;
        } else if (normalizedProvider === "azure openai") {
            this.defaultConfig.endpoint = config.endpoint;
            this.defaultConfig.deployment = config.deployment;
            this.defaultConfig.apiVersion = config.apiVersion;
        }

        // Configure HTTP proxy if provided
        let proxyAgent = null;
        if (this.defaultConfig.proxyUrl) {
            const undici = require("undici");
            proxyAgent = new undici.ProxyAgent(this.defaultConfig.proxyUrl);
        }
        const fetchOptions = this.defaultConfig.proxyUrl ? { dispatcher: proxyAgent } : {};

        // Initialize OpenAI client
        if (normalizedProvider === "openai") {
            this.openai = new OpenAI({
                apiKey: config.apiKey,
                fetchOptions,
            });
        }

        // Initialize Azure OpenAI client (uses AzureOpenAI class)
        if (normalizedProvider === "azure openai") {
            this.azureOpenai = new AzureOpenAI({
                endpoint: config.endpoint,
                apiKey: config.apiKey,
                deployment: config.deployment,
                apiVersion: config.apiVersion,
                fetchOptions,
            });
        }

        // Initialize Anthropic client
        if (normalizedProvider === "anthropic") {
            this.anthropic = new Anthropic({
                apiKey: config.apiKey,
                fetchOptions,
            });
        }

        // Initialize AWS Bedrock client
        if (normalizedProvider === "aws bedrock") {
            // AWS Bedrock requires API key to be set in environment variable
            // The SDK will automatically pick it up from AWS_BEARER_TOKEN_BEDROCK
            if (config.apiKey) {
                process.env.AWS_BEARER_TOKEN_BEDROCK = config.apiKey;
            }

            // Initialize Bedrock Runtime client with region (required, no default)
            this.bedrock = new BedrockRuntimeClient({
                region: config.region
            });

            this.bedrockConfig = {
                region: config.region,
                modelId: modelName
            };
        }
    }

    /**
     * Check if a model is GPT-5.
     * GPT-5 models have different parameter requirements (e.g., no temperature).
     *
     * @param {string} model - Model name to check
     * @returns {boolean} True if model is GPT-5
     */
    isGPT5 = (model) => typeof model === "string" && /^gpt-5/i.test(model);

    /**
     * Call OpenAI API (GPT models).
     * Supports both direct OpenAI and Azure OpenAI endpoints.
     *
     * @param {string} prompt - User prompt/question
     * @param {Object} [options={}] - Optional override parameters
     * @param {string} [options.model] - Override model name
     * @param {string} [options.system] - Override system prompt
     * @param {number} [options.max_tokens] - Override max tokens
     * @param {number} [options.temperature] - Override temperature
     * @returns {Promise<Object>} Response object with content, usage, and model
     */
    async callOpenAI(prompt, options = {}) {
        try {
            const messages = [];

            // Add system message if provided (sets AI behavior/context)
            const systemMessage = options.system || this.defaultConfig.system;
            if (systemMessage) {
                messages.push({
                    role: "system",
                    content: systemMessage
                });
            }

            // Add user message (the actual prompt)
            messages.push({ role: "user", content: prompt });

            // Build request options with model and messages
            const requestOptions = {
                model: options.model || this.defaultConfig.modelName,
                messages: messages
            };

            const modelIsGPT5 = this.isGPT5(requestOptions.model);

            // Add max_tokens if specified (controls response length)
            if (options.max_tokens || this.defaultConfig.max_tokens) {
                requestOptions.max_completion_tokens = options.max_tokens || this.defaultConfig.max_tokens;
            }

            // Add temperature if specified (controls randomness)
            // Note: GPT-5 models don't support temperature parameter
            if (
              !modelIsGPT5 &&
              (options.temperature !== undefined || this.defaultConfig.temperature !== undefined)
            ) {
              requestOptions.temperature =
                options.temperature !== undefined
                  ? options.temperature
                  : this.defaultConfig.temperature;
            }

            // Make API call to OpenAI
            const completion = await this.openai.chat.completions.create(requestOptions);

            // Return standardized response format
            return {
                content: completion.choices[0].message.content,
                usage: completion.usage,
                model: completion.model
            };
        } catch (error) {
          throw errors.internal(`OpenAI API error: ${error.message}`, { error });
        }
    }

    /**
     * Call Anthropic API (Claude models).
     *
     * @param {string} prompt - User prompt/question
     * @param {Object} [options={}] - Optional override parameters
     * @param {string} [options.model] - Override model name
     * @param {string} [options.system] - Override system prompt
     * @param {number} [options.max_tokens] - Override max tokens
     * @param {number} [options.temperature] - Override temperature
     * @returns {Promise<Object>} Response object with content, usage, and model
     */
    async callAnthropic(prompt, options = {}) {
        try {
            // Anthropic expects messages array with user role
            const messages = [{ role: "user", content: prompt }];

            // Build request options with model and messages
            const requestOptions = {
                model: options.model || this.defaultConfig.modelName,
                messages: messages
            };

            // Add system message if provided (Anthropic uses separate system field)
            const systemMessage = options.system || this.defaultConfig.system;
            if (systemMessage) {
                requestOptions.system = systemMessage;
            }

            // Add max_tokens if specified (controls response length)
            if (options.max_tokens || this.defaultConfig.max_tokens) {
                requestOptions.max_tokens = options.max_tokens || this.defaultConfig.max_tokens;
            }

            // Add temperature if specified (controls randomness)
            if (options.temperature !== undefined || this.defaultConfig.temperature !== undefined) {
                requestOptions.temperature = options.temperature !== undefined ? options.temperature : this.defaultConfig.temperature;
            }

            // Make API call to Anthropic
            const message = await this.anthropic.messages.create(requestOptions);

            // Return standardized response format
            return {
                content: message.content[0].text,
                usage: message.usage,
                model: message.model
            };
        } catch (error) {
          throw errors.internal(`Anthropic API error: ${error.message}`, { error });
        }
    }

    /**
     * Call Azure OpenAI API.
     * Uses AzureOpenAI client with deployment-specific configuration.
     *
     * @param {string} prompt - User prompt/question
     * @param {Object} [options={}] - Optional override parameters
     * @param {string} [options.model] - Override model name
     * @param {string} [options.system] - Override system prompt
     * @param {number} [options.max_tokens] - Override max tokens
     * @param {number} [options.temperature] - Override temperature
     * @returns {Promise<Object>} Response object with content, usage, and model
     */
    async callAzureOpenAI(prompt, options = {}) {
        try {
            const messages = [];

            // Add system message if provided (sets AI behavior/context)
            const systemMessage = options.system || this.defaultConfig.system;
            if (systemMessage) {
                messages.push({
                    role: "system",
                    content: systemMessage
                });
            }

            // Add user message (the actual prompt)
            messages.push({ role: "user", content: prompt });

            // Build request options with model and messages
            const requestOptions = {
                model: options.model || this.defaultConfig.modelName,
                messages: messages
            };

            const modelIsGPT5 = this.isGPT5(requestOptions.model);

            // Add max_tokens if specified (controls response length)
            if (options.max_tokens || this.defaultConfig.max_tokens) {
                requestOptions.max_tokens = options.max_tokens || this.defaultConfig.max_tokens;
            }

            // Add temperature if specified (controls randomness)
            // Note: GPT-5 models don't support temperature parameter
            if (
              !modelIsGPT5 &&
              (options.temperature !== undefined || this.defaultConfig.temperature !== undefined)
            ) {
              requestOptions.temperature =
                options.temperature !== undefined
                  ? options.temperature
                  : this.defaultConfig.temperature;
            }

            // Make API call to Azure OpenAI
            const completion = await this.azureOpenai.chat.completions.create(requestOptions);

            // Return standardized response format
            return {
                content: completion.choices[0].message.content,
                usage: completion.usage,
                model: completion.model
            };
        } catch (error) {
          throw errors.internal(`Azure OpenAI API error: ${error.message}`, { error });
        }
    }

    /**
     * Call AWS Bedrock API using Converse API.
     * Uses BedrockRuntimeClient and ConverseCommand for standardized conversation interface.
     *
     * The Converse API provides a unified interface that works with ALL Bedrock models
     * (Anthropic, Nova, Titan, etc.) without requiring model-specific code.
     *
     * @param {string} prompt - User prompt/question
     * @param {Object} [options={}] - Optional override parameters
     * @param {string} [options.model] - Override model ID
     * @param {string} [options.system] - Override system prompt
     * @param {number} [options.max_tokens] - Override max tokens
     * @param {number} [options.temperature] - Override temperature
     * @returns {Promise<Object>} Response object with content, usage, and model
     */
    async callAwsBedrock(prompt, options = {}) {
        try {
            // Prepare messages array for Bedrock Converse API
            const messages = [
                {
                    role: "user",
                    content: [{ text: prompt }]
                }
            ];

            // Build request options for ConverseCommand
            const requestOptions = {
                modelId: options.model || this.bedrockConfig.modelId,
                messages: messages
            };

            // Add system message if provided (Bedrock expects array format)
            const systemMessage = options.system || this.defaultConfig.system;
            if (systemMessage) {
                requestOptions.system = [{ text: systemMessage }];
            }

            // Add inference configuration for optional parameters
            const inferenceConfig = {};

            // Add maxTokens if specified (controls response length)
            if (options.max_tokens || this.defaultConfig.max_tokens) {
                inferenceConfig.maxTokens = options.max_tokens || this.defaultConfig.max_tokens;
            }

            // Add temperature if specified (controls randomness)
            if (options.temperature !== undefined || this.defaultConfig.temperature !== undefined) {
                inferenceConfig.temperature = options.temperature !== undefined ? options.temperature : this.defaultConfig.temperature;
            }

            // Only add inferenceConfig if it has properties
            if (Object.keys(inferenceConfig).length > 0) {
                requestOptions.inferenceConfig = inferenceConfig;
            }

            // Create and send the Converse command
            const command = new ConverseCommand(requestOptions);
            const response = await this.bedrock.send(command);

            // Extract response text from Bedrock's standardized response format
            // This works for ALL models - Anthropic, Nova, Titan, etc.
            const responseText = response.output.message.content[0].text;

            // Return standardized response format
            return {
                content: responseText,
                usage: response.usage,
                model: requestOptions.modelId
            };
        } catch (error) {
          throw errors.internal(`AWS Bedrock API error: ${error.message}`, { error });
        }
    }

    /**
     * Generate AI response for a given prompt.
     * Main entry point for all AI interactions - routes to appropriate provider.
     *
     * This method:
     * 1. Validates the prompt
     * 2. Merges provided params with default configuration
     * 3. Routes to the appropriate provider-specific method
     * 4. Returns a standardized response format
     *
     * @param {string|Object} params - Prompt string or configuration object
     * @param {string} params.prompt - User prompt/question (required)
     * @param {string} [params.provider] - Override provider
     * @param {string} [params.model] - Override model name
     * @param {string} [params.modelName] - Alternative to params.model
     * @param {string} [params.system] - Override system prompt
     * @param {number} [params.max_tokens] - Override max tokens
     * @param {number} [params.temperature] - Override temperature
     * @returns {Promise<Object>} Standardized response with content, usage stats, and metadata
     *
     * @example
     * const response = await ai.generate({
     *   prompt: "Explain S3 bucket encryption",
     *   system: "You are a cloud security expert"
     * });
     * // response = { success: true, provider: "openai", response: "...", ... }
     */
    async generate(params) {
        // Support both string prompt and object params for convenience
        if (typeof params === 'string') {
            params = { prompt: params };
        }

        // Extract and validate prompt
        const prompt = params.prompt;
        if (!prompt) {
          throw errors.insufficientData("Prompt is required. Please provide a non-empty prompt");
        }

        // Merge params with default config (params take precedence)
        const provider = params.provider || this.defaultConfig.provider;
        const model = params.model || params.modelName || this.defaultConfig.modelName;
        const max_tokens = params.max_tokens || this.defaultConfig.max_tokens;
        const temperature = params.temperature !== undefined ? params.temperature : this.defaultConfig.temperature;
        const system = params.system || this.defaultConfig.system;

        // Normalize and validate provider
        const normalizedProvider = provider.toLowerCase();
        if (!PROVIDERS[normalizedProvider]) {
          throw errors.badRequest(
            `Unsupported provider: ${provider}. Supported providers: ${Object.keys(PROVIDERS).join(', ')}`
          );
        }

        // Prepare options object for provider-specific methods
        const options = {
            model: model,
            // Spread any additional custom options
            ...params
        };

        // Add optional parameters only if they have values
        if (max_tokens) options.max_tokens = max_tokens;
        if (temperature !== undefined) options.temperature = temperature;
        if (system) options.system = system;

        // Route to appropriate provider-specific method
        let result;
        switch (normalizedProvider) {
            case 'openai':
                result = await this.callOpenAI(prompt, options);
                break;
            case 'anthropic':
                result = await this.callAnthropic(prompt, options);
                break;
            case 'aws bedrock':
                result = await this.callAwsBedrock(prompt, options);
                break;
            case 'azure openai':
                // Azure OpenAI uses AzureOpenAI client with deployment configuration
                result = await this.callAzureOpenAI(prompt, options);
                break;
            default:
              throw errors.notImplemented(`Provider ${provider} is not implemented`);
        }

        // Return standardized response format across all providers
        return {
            success: true,
            provider: normalizedProvider,
            prompt,
            response: result.content,
            model: result.model,
            usage: result.usage,
            timestamp: new Date().toISOString(),
            config: {
                system: system || null,
                max_tokens: max_tokens || null,
                temperature: temperature !== undefined ? temperature : null
            }
        };
    }
}

module.exports = AI;
