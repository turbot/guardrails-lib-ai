const { AzureOpenAI } = require('openai');
const BaseProvider = require('./BaseProvider');
const errors = require("@turbot/errors");

/**
 * Azure OpenAI provider implementation.
 * Handles API calls to Azure OpenAI Service.
 */
class AzureOpenAIProvider extends BaseProvider {
    static PROVIDER_NAME = 'azure openai';

    /**
     * Initialize Azure OpenAI provider.
     *
     * @param {Object} config - Provider configuration
     * @param {string} config.apiKey - Azure OpenAI API key
     * @param {string} config.endpoint - Azure OpenAI endpoint URL
     * @param {string} config.apiVersion - API version
     * @param {string} config.modelName - Model name (used as deployment name)
     * @param {string} [config.proxyUrl] - HTTP proxy URL
     */
    constructor(config) {
        super(config);
        this.validate();
        this.initializeClient();
    }

    /**
     * Validate Azure OpenAI specific required fields.
     *
     * @throws {Error} If required fields are missing
     */
    validate() {
        super.validate();
        const errors = require("@turbot/errors");

        if (!this.config.endpoint) {
            throw errors.badConfiguration("Endpoint is required for Azure OpenAI provider");
        }

        if (!this.config.apiVersion) {
            throw errors.badConfiguration("API version is required for Azure OpenAI provider");
        }
    }

    /**
     * Initialize Azure OpenAI client.
     */
    initializeClient() {
        const fetchOptions = this._getProxyOptions();

        this.client = new AzureOpenAI({
            endpoint: this.config.endpoint,
            apiKey: this.config.apiKey,
            deployment: this.config.modelName,
            apiVersion: this.config.apiVersion,
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
     * Generate AI response using Azure OpenAI API.
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
            if (this.config.system) {
                messages.push({
                    role: "system",
                    content: this.config.system
                });
            }

            // Add user message
            messages.push({ role: "user", content: prompt });

            // Build request options
            // Model comes from constructor only (no override allowed)
            const requestOptions = {
                model: this.config.modelName,
                messages: messages
            };

            const modelIsGPT5 = this.isGPT5(requestOptions.model);

            // Add max_tokens from generate() options only
            // Filter out empty/whitespace strings as they're not valid numeric values
            const maxTokens = typeof options.maxTokens === 'string' ? options.maxTokens.trim() : options.maxTokens;
            if (maxTokens) {
                requestOptions.max_tokens = maxTokens;
            }

            // Add temperature from generate() options only
            // Note: GPT-5 doesn't support temperature
            // Filter out empty/whitespace strings as they're not valid numeric values
            const temperature = typeof options.temperature === 'string' ? options.temperature.trim() : options.temperature;
            if (!modelIsGPT5 && temperature !== undefined && temperature !== null && temperature !== '') {
                requestOptions.temperature = temperature;
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
            throw errors.internal(`Azure OpenAI API error: ${error.message}`, { error });
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

module.exports = AzureOpenAIProvider;

