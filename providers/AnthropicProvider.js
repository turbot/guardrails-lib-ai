const Anthropic = require('@anthropic-ai/sdk');
const BaseProvider = require('./BaseProvider');
const errors = require("@turbot/errors");

/**
 * Anthropic provider implementation.
 * Handles API calls to Anthropic Claude models.
 */
class AnthropicProvider extends BaseProvider {
    static PROVIDER_NAME = 'anthropic';

    /**
     * Initialize Anthropic provider.
     *
     * @param {Object} config - Provider configuration
     * @param {string} config.apiKey - Anthropic API key
     * @param {string} config.modelName - Model name (e.g., claude-3-opus, claude-3-sonnet)
     * @param {string} [config.proxyUrl] - HTTP proxy URL
     */
    constructor(config) {
        super(config);
        this.validate();
        this.initializeClient();
    }

    /**
     * Initialize Anthropic client.
     */
    initializeClient() {
        const fetchOptions = this._getProxyOptions();

        this.client = new Anthropic({
            apiKey: this.config.apiKey,
            fetchOptions,
        });
    }

    /**
     * Generate AI response using Anthropic API.
     *
     * @param {string} prompt - User prompt/question
     * @param {Object} [options={}] - Request behavior parameters
     * @param {number} [options.temperature] - Temperature for this request
     * @param {number} [options.maxTokens] - Max tokens for this request
     * @returns {Promise<Object>} Response object
     */
    async generate(prompt, options = {}) {
        try {
            // Anthropic expects messages array with user role
            const messages = [{ role: "user", content: prompt }];

            // Build request options
            // Model comes from constructor only (no override allowed)
            const requestOptions = {
                model: this.config.modelName,
                messages: messages
            };

            // Add system message from constructor (if provided)
            // Anthropic uses separate system field (not in messages array)
            if (this.config.system) {
                requestOptions.system = this.config.system;
            }

            // Add max_tokens from generate() options only
            // Filter out empty/whitespace strings as they're not valid numeric values
            const maxTokens = typeof options.maxTokens === 'string' ? options.maxTokens.trim() : options.maxTokens;
            if (maxTokens) {
                requestOptions.max_tokens = maxTokens;
            }

            // Add temperature from generate() options only
            // Filter out empty/whitespace strings as they're not valid numeric values
            const temperature = typeof options.temperature === 'string' ? options.temperature.trim() : options.temperature;
            if (temperature != null && temperature !== '') {
                requestOptions.temperature = temperature;
            }

            // Make API call
            const message = await this.client.messages.create(requestOptions);

            // Return standardized format
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

module.exports = AnthropicProvider;

