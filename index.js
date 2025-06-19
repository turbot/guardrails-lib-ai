const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const errors = require("@turbot/errors");

// Provider configurations
const PROVIDERS = {
    openai: {
        name: 'OpenAI GPT',
    },
    anthropic: {
        name: 'Anthropic Claude',
    }
};

class AI {
    constructor(config = {}) {
        // Validate required configuration
        if (!config.provider) {
          throw errors.badConfiguration("Provider is required in constructor. Use: openai or anthropic");
        }

        if (!config.apiKey) {
          throw errors.badConfiguration("Missing API key: Please provide an apiKey in the configuration object");
        }

        if (!config.modelName) {
          throw errors.badConfiguration("Missing model name: Please provide an modelName in the configuration object");
        }

        // Validate provider
        const normalizedProvider = config.provider.toLowerCase();
        if (!PROVIDERS[normalizedProvider]) {
          throw errors.badRequest(`Invalid Provider: ${config.provider}. Supported providers: ${Object.keys(PROVIDERS).join(', ')}`);
        }

        // Store configuration (no defaults except for optional ones)
        this.defaultConfig = {
            provider: normalizedProvider,
            modelName: config.modelName, // null if not provided
            system: config.system, // null if not provided
            apiKey: config.apiKey, // null if not provided
            proxyUrl: config.proxyUrl || process.env.HTTPS_PROXY || process.env.HTTP_PROXY,
            max_tokens: config.max_tokens, // null if not provided, will use API defaults
            temperature: config.temperature // null if not provided, will use API defaults
        };

        // Proxy configuration
        let proxyAgent = null;
        if (this.defaultConfig.proxyUrl) {
            const undici = require("undici");
            proxyAgent = new undici.ProxyAgent(this.defaultConfig.proxyUrl);
        }
        const fetchOptions = this.defaultConfig.proxyUrl ? { dispatcher: proxyAgent } : {};

        // Initialize OpenAI client
        this.openai = new OpenAI({
            apiKey: config.apiKey,
            fetchOptions,
        });

        // Initialize Anthropic client
        this.anthropic = new Anthropic({
            apiKey: config.apiKey,
            fetchOptions,
        });

    }

    async callOpenAI(prompt, options = {}) {
        try {
            const messages = [];

            // Add system message if provided
            const systemMessage = options.system || this.defaultConfig.system;
            if (systemMessage) {
                messages.push({
                    role: "system",
                    content: systemMessage
                });
            }

            // Add user message
            messages.push({ role: "user", content: prompt });

            // Build request options
            const requestOptions = {
                model: options.model || this.defaultConfig.modelName,
                messages: messages
            };

            // Only add optional parameters if they were specified
            if (options.max_tokens || this.defaultConfig.max_tokens) {
                requestOptions.max_tokens = options.max_tokens || this.defaultConfig.max_tokens;
            }

            if (options.temperature !== undefined || this.defaultConfig.temperature !== undefined) {
                requestOptions.temperature = options.temperature !== undefined ? options.temperature : this.defaultConfig.temperature;
            }

            const completion = await this.openai.chat.completions.create(requestOptions);

            return {
                content: completion.choices[0].message.content,
                usage: completion.usage,
                model: completion.model
            };
        } catch (error) {
          throw errors.internal("OpenAI API Error", error.message);
        }
    }

    async callAnthropic(prompt, options = {}) {
        try {
            const messages = [{ role: "user", content: prompt }];

            // Build request options
            const requestOptions = {
                model: options.model || this.defaultConfig.modelName,
                messages: messages
            };

            // Add system message if provided
            const systemMessage = options.system || this.defaultConfig.system;
            if (systemMessage) {
                requestOptions.system = systemMessage;
            }

            // Only add optional parameters if they were specified
            if (options.max_tokens || this.defaultConfig.max_tokens) {
                requestOptions.max_tokens = options.max_tokens || this.defaultConfig.max_tokens;
            }

            if (options.temperature !== undefined || this.defaultConfig.temperature !== undefined) {
                requestOptions.temperature = options.temperature !== undefined ? options.temperature : this.defaultConfig.temperature;
            }

            const message = await this.anthropic.messages.create(requestOptions);

            return {
                content: message.content[0].text,
                usage: message.usage,
                model: message.model
            };
        } catch (error) {
          throw errors.internal("Anthropic API Error", error.message);
        }
    }

    async generate(params) {
        // Support both object params and direct prompt string
        if (typeof params === 'string') {
            params = { prompt: params };
        }

        // Extract prompt
        const prompt = params.prompt;

        // Validate required parameters
        if (!prompt) {
          throw errors.insufficientData("Prompt is required");
        }

        // Use provider from params or constructor (no fallback defaults)
        const provider = params.provider || this.defaultConfig.provider;
        const model = params.model || params.modelName || this.defaultConfig.modelName;
        const max_tokens = params.max_tokens || this.defaultConfig.max_tokens;
        const temperature = params.temperature !== undefined ? params.temperature : this.defaultConfig.temperature;
        const system = params.system || this.defaultConfig.system;

        // Validate provider (should not reach here if constructor validation worked)
        const normalizedProvider = provider.toLowerCase();
        if (!PROVIDERS[normalizedProvider]) {
            throw errors.badRequest(`Unsupported Provider: ${provider}. Supported providers: ${Object.keys(PROVIDERS).join(', ')}`);
        }

        // Prepare options (only include defined values)
        const options = {
            model: model,
            ...params // Allow any other custom options
        };

        // Only add optional parameters if they have values
        if (max_tokens) options.max_tokens = max_tokens;
        if (temperature !== undefined) options.temperature = temperature;
        if (system) options.system = system;

        // Route to appropriate provider
        let result;
        switch (normalizedProvider) {
            case 'openai':
                result = await this.callOpenAI(prompt, options);
                break;
            case 'anthropic':
                result = await this.callAnthropic(prompt, options);
                break;
            default:
                throw errors.notImplemented(`Provider ${provider} not implemented`);
        }

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
