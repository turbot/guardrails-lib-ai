const { OpenAI } = require('openai');
const BaseProvider = require('./BaseProvider');
const errors = require("@turbot/errors");

/**
 * OpenAI provider implementation.
 * Handles API calls to OpenAI GPT models.
 */
class OpenAIProvider extends BaseProvider {
    static PROVIDER_NAME = 'openai';

    /**
     * Initialize OpenAI provider.
     *
     * @param {Object} config - Provider configuration
     * @param {string} config.apiKey - OpenAI API key
     * @param {string} config.modelName - Model name (e.g., gpt-4, gpt-4-turbo)
     * @param {string} [config.proxyUrl] - HTTP proxy URL
     */
    constructor(config) {
        super(config);
        this.validate();
        this.initializeClient();
    }

    /**
     * Initialize OpenAI client.
     */
    initializeClient() {
        const fetchOptions = this._getProxyOptions();

        this.client = new OpenAI({
            apiKey: this.config.apiKey,
            fetchOptions,
        });
    }

    /**
     * Check if a model is GPT-5.
     * GPT-5 models have different parameter requirements.
     *
     * @param {string} model - Model name
     * @returns {boolean} True if GPT-5 model
     */
    isGPT5(model) {
        return typeof model === "string" && /^gpt-5/i.test(model);
    }

    /**
     * Generate AI response using OpenAI API.
     *
     * @param {string} prompt - User prompt/question
     * @param {Object} [options={}] - Request behavior parameters
     * @param {number} [options.temperature] - Temperature for this request
     * @param {number} [options.maxTokens] - Max tokens for this request
     * @returns {Promise<Object>} Response object
     */
    async generate(prompt, options = {}) {
        try {
            const messages = [];

            // Add system message from constructor (if provided)
            // System prompt is NOT overridable - it defines the AI's identity
            if (this.config.system) {
                messages.push({
                    role: "system",
                    content: this.config.system
                });
            }

            // Add user message
            messages.push({ role: "user", content: prompt });

            // Build request options
            const requestOptions = {
                model: this.config.modelName,
                messages: messages
            };

            const modelIsGPT5 = this.isGPT5(requestOptions.model);

            // Add max_tokens from generate() options only
            if (options.maxTokens) {
                requestOptions.max_completion_tokens = options.maxTokens;
            }

            // Add temperature from generate() options only
            // Note: GPT-5 doesn't support temperature
            if (!modelIsGPT5 && options.temperature !== undefined) {
                requestOptions.temperature = options.temperature;
            }

            // Make API call
            const completion = await this.client.chat.completions.create(requestOptions);

            // Return standardized format
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
     * Get proxy configuration if proxy URL is set.
     *
     * @private
     * @returns {Object} Fetch options with proxy agent if configured
     */
    _getProxyOptions() {
        const proxyUrl = this.config.proxyUrl || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

        if (proxyUrl) {
            const undici = require("undici");
            const proxyAgent = new undici.ProxyAgent(proxyUrl);
            return { dispatcher: proxyAgent };
        }

        return {};
    }
}

module.exports = OpenAIProvider;

