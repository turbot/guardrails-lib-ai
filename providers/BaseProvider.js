/**
 * Base Provider class - Abstract interface for all AI providers.
 *
 * All provider implementations must extend this class and implement
 * the generate() method. This ensures consistent behavior across providers.
 *
 * @abstract
 */
class BaseProvider {
    /**
     * Initialize base provider with configuration.
     *
     * Constructor should only receive connection/setup parameters.
     * Request behavior parameters (temperature, maxTokens) should be passed to generate().
     *
     * @param {Object} config - Provider configuration
     * @param {string} config.apiKey - API key for authentication
     * @param {string} config.modelName - Model name or ID
     * @param {string} [config.system] - System prompt (AI's persona/role)
     * @param {string} [config.proxyUrl] - HTTP proxy URL
     */
    constructor(config = {}) {
        this.config = config;
        this.client = null;
    }

    /**
     * Validate provider-specific required fields.
     * Override this in subclasses to add custom validation.
     *
     * @throws {Error} If required fields are missing
     */
    validate() {
        const errors = require("@turbot/errors");

        if (!this.config.apiKey) {
            throw errors.badConfiguration("API key is required");
        }

        if (!this.config.modelName) {
            throw errors.badConfiguration("Model name is required");
        }
    }

    /**
     * Initialize the provider client.
     * Must be implemented by subclasses.
     *
     * @abstract
     * @throws {Error} If not implemented by subclass
     */
    initializeClient() {
        throw new Error("initializeClient() must be implemented by subclass");
    }

    /**
     * Generate AI response for the given prompt.
     * Must be implemented by subclasses.
     *
     * @abstract
     * @param {string} prompt - User prompt/question
     * @param {Object} [options={}] - Optional override parameters
     * @returns {Promise<Object>} Response object with content, usage, and model
     * @throws {Error} If not implemented by subclass
     */
    async generate(prompt, options = {}) {
        throw new Error("generate() must be implemented by subclass");
    }

    /**
     * Get provider name.
     *
     * @returns {string} Provider name in lowercase
     */
    getName() {
        return this.constructor.PROVIDER_NAME || 'unknown';
    }
}

module.exports = BaseProvider;

