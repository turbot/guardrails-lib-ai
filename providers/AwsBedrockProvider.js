const { BedrockRuntimeClient, ConverseCommand } = require("@aws-sdk/client-bedrock-runtime");
const BaseProvider = require('./BaseProvider');
const errors = require("@turbot/errors");


/**
 * AWS Bedrock provider implementation.
 * Handles API calls to AWS Bedrock models using Converse API.
 */
class AwsBedrockProvider extends BaseProvider {
    static PROVIDER_NAME = 'aws bedrock';

    /**
     * Initialize AWS Bedrock provider.
     *
     * @param {Object} config - Provider configuration
     * @param {string} config.apiKey - AWS Bedrock API key (bearer token)
     * @param {string} config.modelName - Model ID (e.g., amazon.nova-lite-v1:0)
     * @param {string} config.region - AWS region (required)
     * @param {string} [config.proxyUrl] - HTTP proxy URL
     */
    constructor(config) {
        super(config);
        this.validate();
        this.initializeClient();
    }

    /**
     * Validate AWS Bedrock specific required fields.
     *
     * @throws {Error} If required fields are missing
     */
    validate() {
        super.validate();
        const errors = require("@turbot/errors");

        if (!this.config.region) {
            throw errors.badConfiguration("AWS region is required for AWS Bedrock provider");
        }
    }

    /**
     * Initialize AWS Bedrock Runtime client.
     */
    initializeClient() {
        // AWS Bedrock requires API key to be set in environment variable
        // The SDK will automatically pick it up from AWS_BEARER_TOKEN_BEDROCK
        if (this.config.apiKey) {
            process.env.AWS_BEARER_TOKEN_BEDROCK = this.config.apiKey;
        }

        // Configure proxy support for AWS SDK v3
        // Unlike other providers that use undici.ProxyAgent, AWS SDK v3 doesn't support
        // custom fetch dispatchers. Instead, it automatically respects the HTTPS_PROXY
        // environment variable. We only set it if not already configured to avoid
        // overriding user's existing proxy settings.
        const proxyUrl = this.config.proxyUrl;
        if (proxyUrl && !process.env.HTTPS_PROXY) {
            process.env.HTTPS_PROXY = proxyUrl;
        }

        // Initialize Bedrock Runtime client with region
        this.client = new BedrockRuntimeClient({
            region: this.config.region
        });
    }

    /**
     * Generate AI response using AWS Bedrock Converse API.
     * Uses generic Converse API that works with all Bedrock models.
     *
     * @param {string} prompt - User prompt/question
     * @param {Object} [options={}] - Request behavior parameters
     * @param {number} [options.temperature] - Temperature for this request
     * @param {number} [options.maxTokens] - Max tokens for this request
     * @returns {Promise<Object>} Response object
     */
    async generate(prompt, options = {}) {
        try {
            // Prepare messages array for Converse API
            const messages = [
                {
                    role: "user",
                    content: [{ text: prompt }]
                }
            ];

            // Build request options
            // Model comes from constructor only (no override allowed)
            const requestOptions = {
                modelId: this.config.modelName,
                messages: messages
            };

            // Add system message from constructor (if provided)
            // Converse API expects array format
            if (this.config.system) {
                requestOptions.system = [{ text: this.config.system }];
            }

            // Add inference configuration from generate() options only
            const inferenceConfig = {};

            // Add maxTokens from generate() options only
            // Filter out empty/whitespace strings as they're not valid numeric values
            const maxTokens = typeof options.maxTokens === 'string' ? options.maxTokens.trim() : options.maxTokens;
            if (maxTokens) {
                inferenceConfig.maxTokens = maxTokens;
            }

            // Add temperature from generate() options only
            // Filter out empty/whitespace strings as they're not valid numeric values
            const temperature = typeof options.temperature === 'string' ? options.temperature.trim() : options.temperature;
            if (temperature != null && temperature !== '') {
                inferenceConfig.temperature = temperature;
            }

            // Only add inferenceConfig if it has properties
            if (Object.keys(inferenceConfig).length > 0) {
                requestOptions.inferenceConfig = inferenceConfig;
            }

            // Create and send the Converse command
            const command = new ConverseCommand(requestOptions);
            const response = await this.client.send(command);

            // TODO: Check and verify the response output format.

            // Extract response from standardized Converse API format
            // This works for ALL Bedrock models (Anthropic, Nova, Titan, etc.)
            const responseText = response.output.message.content[0].text;

            // Return standardized format
            return {
                content: responseText,
                usage: response.usage,
                model: requestOptions.modelId
            };
        } catch (error) {
            throw errors.internal(`AWS Bedrock API error: ${error.message}`, { error });
        }
    }
}

module.exports = AwsBedrockProvider;

