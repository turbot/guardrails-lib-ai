/**
 * Example usage of Guardrails AI Library v2
 *
 * This demonstrates the OOP-refactored version with proper design patterns.
 */

const AI = require('./index');

/**
 * Example 1: Using OpenAI
 */
async function exampleOpenAI() {
    console.log('\n=== OpenAI Example ===');

    // Constructor: Only connection details + system prompt (AI's identity)
    const ai = new AI({
        provider: "openai",
        apiKey: process.env.OPENAI_API_KEY || "sk-...",
        model: "gpt-4",
        system: "You are a helpful geography teacher."  // AI's persona
    });

    // generate(): Request behavior parameters
    const response = await ai.generate({
        prompt: "What is the capital of France?",
        temperature: 0.2,   // Per-request behavior
        maxTokens: 1000     // Per-request behavior
    });

    console.log('Provider:', response.provider);
    console.log('Model:', response.model);
    console.log('Response:', response.response);
    console.log('Usage:', response.usage);
}

/**
 * Example 2: Using Anthropic
 */
async function exampleAnthropic() {
    console.log('\n=== Anthropic Example ===');

    // Constructor: Connection details only
    const ai = new AI({
        provider: "anthropic",
        apiKey: process.env.ANTHROPIC_API_KEY || "sk-ant-...",
        model: "claude-3-opus-20240229"
    });

    // generate(): Behavior parameters
    const response = await ai.generate({
        prompt: "Explain quantum computing in simple terms",
        temperature: 0.2,
        maxTokens: 1000
    });

    console.log('Provider:', response.provider);
    console.log('Response:', response.response);
}

/**
 * Example 3: Using AWS Bedrock
 */
async function exampleAwsBedrock() {
    console.log('\n=== AWS Bedrock Example ===');

    // Constructor: Connection details only (provider, apiKey, modelId, region)
    const ai = new AI({
        provider: "aws bedrock",
        apiKey: process.env.AWS_BEDROCK_API_KEY || "ABSK...",
        modelId: "amazon.nova-lite-v1:0",
        region: "us-east-1",
        system: "You are an AWS expert."  // AI's persona
    });

    // generate(): Behavior parameters
    const response = await ai.generate({
        prompt: "What is AWS Bedrock?",
        temperature: 0.2,
        maxTokens: 1000
    });

    console.log('Provider:', response.provider);
    console.log('Model:', response.model);
    console.log('Response:', response.response);
}

/**
 * Example 4: Using Azure OpenAI
 */
async function exampleAzureOpenAI() {
    console.log('\n=== Azure OpenAI Example ===');

    // Constructor: Connection details (endpoint, deployment, apiVersion are mandatory)
    const ai = new AI({
        provider: "azure openai",
        apiKey: process.env.AZURE_OPENAI_API_KEY || "abc123...",
        endpoint: "https://my-resource.openai.azure.com/",
        deployment: "gpt-35-turbo",
        apiVersion: "2024-04-01-preview"
    });

    // generate(): Behavior parameters
    const response = await ai.generate({
        prompt: "What is Azure OpenAI?",
        temperature: 1.0,
        maxTokens: 1000
    });

    console.log('Provider:', response.provider);
    console.log('Response:', response.response);
}

/**
 * Example 5: Dynamic Provider Selection
 */
async function exampleDynamicProvider() {
    console.log('\n=== Dynamic Provider Example ===');

    // Get supported providers
    console.log('Supported providers:', AI.getSupportedProviders());

    // Provider configuration from external source (e.g., credentials resolver)
    // Only connection details in config
    const providerConfig = {
        provider: "openai",
        apiKey: "sk-...",
        model: "gpt-4",
        system: "You are a helpful assistant"
    };

    // Create AI instance dynamically
    const ai = new AI(providerConfig);
    console.log('Using provider:', ai.getProviderName());

    // Behavior parameters in generate()
    const response = await ai.generate({
        prompt: "Hello, how are you?",
        temperature: 0.2,
        maxTokens: 1000
    });
    console.log('Response:', response.response);
}

/**
 * Example 6: Error Handling
 */
async function exampleErrorHandling() {
    console.log('\n=== Error Handling Example ===');

    try {
        // Missing required field (apiKey)
        const ai = new AI({
            provider: "openai",
            modelName: "gpt-4"
        });
    } catch (error) {
        console.log('Configuration error caught:', error.message);
    }

    try {
        // Unsupported provider
        const ai = new AI({
            provider: "unsupported",
            apiKey: "test",
            modelName: "test"
        });
    } catch (error) {
        console.log('Provider error caught:', error.message);
    }

    try {
        // Missing region for AWS Bedrock
        const ai = new AI({
            provider: "aws bedrock",
            apiKey: "test",
            modelId: "amazon.nova-lite-v1:0"
            // Missing: region
        });
    } catch (error) {
        console.log('AWS Bedrock validation error:', error.message);
    }
}

/**
 * Run all examples
 */
async function runExamples() {
    console.log('Guardrails AI Library v2 - Examples');
    console.log('====================================');

    try {
        await exampleDynamicProvider();
        await exampleErrorHandling();

        // Uncomment when you have API keys configured:
        // await exampleOpenAI();
        // await exampleAnthropic();
        // await exampleAwsBedrock();
        // await exampleAzureOpenAI();
    } catch (error) {
        console.error('Example error:', error);
    }
}

// Run if executed directly
if (require.main === module) {
    runExamples().catch(console.error);
}

module.exports = {
    exampleOpenAI,
    exampleAnthropic,
    exampleAwsBedrock,
    exampleAzureOpenAI,
    exampleDynamicProvider,
    exampleErrorHandling
};

