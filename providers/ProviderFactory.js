const errors = require("@turbot/errors");
const OpenAIProvider = require('./OpenAIProvider');
const AnthropicProvider = require('./AnthropicProvider');
const AwsBedrockProvider = require('./AwsBedrockProvider');
const AzureOpenAIProvider = require('./AzureOpenAIProvider');

/**
 * Provider registry - maps provider names to their implementation classes.
 *
 * This is a closed registry - only the providers defined here are supported.
 * External registration is not allowed to maintain security and control.
 *
 * To add a new provider (internal development only):
 * 1. Create a new provider class extending BaseProvider in this directory
 * 2. Import it at the top of this file
 * 3. Add it to this registry
 */
const PROVIDER_REGISTRY = {
    'openai': OpenAIProvider,
    'anthropic': AnthropicProvider,
    'aws bedrock': AwsBedrockProvider,
    'azure openai': AzureOpenAIProvider,
};

/**
 * Factory class for creating AI provider instances.
 *
 * Implements the Factory Pattern to decouple provider creation
 * from the main AI class. Makes it easy to add new providers
 * without modifying existing code.
 */
class ProviderFactory {
    /**
     * Get list of supported provider names.
     *
     * @returns {string[]} Array of supported provider names
     */
    static getSupportedProviders() {
        return Object.keys(PROVIDER_REGISTRY);
    }

    /**
     * Check if a provider is supported.
     *
     * @param {string} providerName - Provider name (lowercase)
     * @returns {boolean} True if provider is supported
     */
    static isSupported(providerName) {
        const normalized = providerName.toLowerCase();
        return PROVIDER_REGISTRY.hasOwnProperty(normalized);
    }

    /**
     * Create a provider instance based on configuration.
     *
     * @param {Object} config - Provider configuration
     * @param {string} config.provider - Provider name
     * @returns {BaseProvider} Provider instance
     * @throws {Error} If provider is not supported
     */
    static create(config) {
        if (!config.provider) {
            throw errors.badConfiguration(
                `Provider is required. Supported providers: ${this.getSupportedProviders().join(', ')}`
            );
        }

        // Normalize provider name to lowercase
        const normalizedProvider = config.provider.toLowerCase();

        // Get provider class from registry
        const ProviderClass = PROVIDER_REGISTRY[normalizedProvider];

        if (!ProviderClass) {
            throw errors.badConfiguration(
                `Unsupported provider: ${config.provider}. Supported providers: ${this.getSupportedProviders().join(', ')}`
            );
        }

        // Create and return provider instance
        return new ProviderClass(config);
    }
}

module.exports = ProviderFactory;

