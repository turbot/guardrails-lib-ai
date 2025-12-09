/**
 * Guardrails AI Library v2
 *
 * A refactored, OOP-compliant implementation with proper design patterns:
 * - Strategy Pattern: Different providers implement same interface
 * - Factory Pattern: ProviderFactory creates appropriate provider instances
 * - Single Responsibility: Each class has one clear responsibility
 * - Open/Closed: Easy to extend with new providers without modifying existing code
 * - Dependency Inversion: Depends on BaseProvider abstraction, not concrete classes
 *
 * @module guardrails-lib-ai/v2
 */

const ProviderFactory = require('./providers/ProviderFactory');
const errors = require("@turbot/errors");

/**
 * AI class - Main entry point for AI interactions.
 *
 * This class follows OOP best practices:
 * - Delegates provider creation to ProviderFactory
 * - Delegates AI generation to provider implementations
 * - Single responsibility: orchestration and response formatting
 * - No provider-specific logic in this class
 *
 * @class
 * @example
 * const AI = require('guardrails-lib-ai/v2');
 *
 * const ai = new AI({
 *   provider: "openai",
 *   apiKey: "sk-...",
 *   modelName: "gpt-4"
 * });
 *
 * const response = await ai.generate("Your prompt here");
 */
class AI {
    /**
     * Initialize AI with provider configuration.
     *
     * Constructor parameters define the client setup (connection details).
     * Request behavior parameters (temperature, maxTokens) are passed to generate().
     *
     * The constructor:
     * 1. Normalizes configuration (handles modelName/modelId/model/deployment aliases)
     * 2. Uses ProviderFactory to create the appropriate provider
     * 3. All provider-specific logic is delegated to provider classes
     *
     * @param {Object} config - Configuration object
     * @param {string} config.provider - AI provider (openai, anthropic, aws bedrock, azure openai)
     * @param {string} config.apiKey - API key for authentication
     * @param {string} config.modelName - Model name or ID (required)
     * @param {string} [config.modelId] - Alternative to modelName
     * @param {string} [config.model] - Alternative to modelName
     * @param {string} [config.deployment] - Alternative to modelName (Azure OpenAI)
     * @param {string} [config.system] - System prompt (AI's persona/role)
     * @param {string} [config.region] - AWS region for Bedrock
     * @param {string} [config.endpoint] - Azure OpenAI endpoint URL
     * @param {string} [config.apiVersion] - Azure OpenAI API version
     * @param {string} [config.proxyUrl] - HTTP proxy URL
     */
    constructor(config = {}) {
        // Normalize model field names (different providers use different names)
        const normalizedConfig = {
            ...config,
            modelName: config.modelName || config.modelId || config.model || config.deployment
        };

        // Use factory to create appropriate provider
        // This delegates all provider-specific logic
        this.provider = ProviderFactory.create(normalizedConfig);

        // Store configuration for reference
        this.config = normalizedConfig;
    }

    /**
     * Generate AI response for a given prompt.
     *
     * Request behavior parameters (temperature, maxTokens) are passed here,
     * not in the constructor. This allows varying behavior per request
     * without recreating the AI client.
     *
     * This method:
     * 1. Validates the prompt
     * 2. Delegates generation to the provider
     * 3. Standardizes the response format
     * 4. Adds metadata (timestamp, config used)
     *
     * @param {string|Object} params - Prompt string or configuration object
     * @param {string} params.prompt - User prompt/question (required)
     * @param {number} [params.temperature] - Temperature for this request (0-1)
     * @param {number} [params.maxTokens] - Max tokens for this request
     * @returns {Promise<Object>} Standardized response object
     *
     * @example
     * const response = await ai.generate({
     *   prompt: "Explain S3 bucket encryption",
     *   temperature: 0.2,
     *   maxTokens: 1000
     * });
     *
     * // response = {
     * //   success: true,
     * //   provider: "openai",
     * //   prompt: "Explain S3 bucket encryption",
     * //   response: "...",
     * //   model: "gpt-4",
     * //   usage: { ... },
     * //   timestamp: "2025-10-30T12:00:00.000Z",
     * //   config: { temperature: 0.2, maxTokens: 1000 }
     * // }
     */
    async generate(params) {
        // Support both string prompt and object params for convenience
        if (typeof params === 'string') {
            params = { prompt: params };
        }

        // Validate prompt is provided
        const prompt = params.prompt;
        if (!prompt) {
            throw errors.insufficientData("Prompt is required. Please provide a non-empty prompt");
        }

        // Prepare options for provider (only request behavior parameters)
        const options = {
            maxTokens: params.maxTokens,
            temperature: params.temperature,
        };

        // Delegate to provider for actual generation
        const result = await this.provider.generate(prompt, options);

        // Add metadata and return standardized response
        return {
            success: true,
            provider: this.provider.getName(),
            prompt,
            response: result.content,
            model: result.model,
            usage: result.usage,
            timestamp: new Date().toISOString(),
            config: {
                temperature: options.temperature !== undefined ? options.temperature : null,
                maxTokens: options.maxTokens || null
            }
        };
    }

    /**
     * Get the current provider name.
     *
     * @returns {string} Provider name in lowercase
     */
    getProviderName() {
        return this.provider.getName();
    }

    /**
     * Get list of supported providers.
     * Static method for convenience.
     *
     * @returns {string[]} Array of supported provider names
     */
    static getSupportedProviders() {
        return ProviderFactory.getSupportedProviders();
    }
}

// Default export: AI (v1)
module.exports = AI;

// Named export: { AI }
module.exports.AI = AI;

