/**
 * Integration tests for AWS Bedrock Provider
 *
 * Run with: npm run test:integration:bedrock
 *
 * Environment variables required:
 *   - AWS_BEDROCK_API_KEY
 *   - AWS_BEDROCK_REGION (optional, defaults to us-east-1)
 */

const { AI, isModelNotEnabledError } = require('./testUtils');

/**
 * AWS Bedrock Models to test
 *
 * Amazon Nova Series (2024-2025) - Amazon's native models
 * - amazon.nova-micro-v1:0: Text-only, low latency, 128K context
 * - amazon.nova-lite-v1:0: Multimodal (image/video/text), 300K context
 * - amazon.nova-pro-v1:0: Multimodal, best for complex tasks, 300K context
 *
 * Anthropic Claude on Bedrock
 * - anthropic.claude-3-haiku-20240307-v1:0: Fast, cost-effective (Claude 3)
 * - anthropic.claude-3-5-haiku-20241022-v1:0: Improved Haiku (Claude 3.5)
 * - anthropic.claude-3-7-sonnet-20250219-v1:0: Hybrid reasoning (Claude 3.7)
 * - anthropic.claude-sonnet-4-20250514-v1:0: Fast, capable (Claude 4)
 * - anthropic.claude-sonnet-4-5-20250929-v1:0: Complex agents/coding (Claude 4.5)
 *
 * Note: The following models are NOT included in tests:
 * - Meta Llama (meta.llama3-*): Requires explicit model access enablement in AWS Console
 * - Mistral (mistral.*): Requires explicit model access enablement in AWS Console
 * - DeepSeek (deepseek.r1-v1:0): Requires inference profile, doesn't support on-demand throughput
 *
 * Reference: https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html
 */
const AWS_BEDROCK_MODELS = [
    // Amazon Nova family - Amazon's native models
    { name: 'amazon.nova-micro-v1:0', supportsTemperature: true },
    { name: 'amazon.nova-lite-v1:0', supportsTemperature: true },
    { name: 'amazon.nova-pro-v1:0', supportsTemperature: true },

    // Anthropic Claude on Bedrock
    { name: 'anthropic.claude-3-haiku-20240307-v1:0', supportsTemperature: true },
    { name: 'anthropic.claude-3-5-haiku-20241022-v1:0', supportsTemperature: true },
    { name: 'anthropic.claude-3-7-sonnet-20250219-v1:0', supportsTemperature: true },
    { name: 'anthropic.claude-sonnet-4-20250514-v1:0', supportsTemperature: true },
    { name: 'anthropic.claude-sonnet-4-5-20250929-v1:0', supportsTemperature: true }
];

describe('AWS Bedrock Provider', () => {
    const apiKey = process.env.AWS_BEDROCK_API_KEY;
    const region = process.env.AWS_BEDROCK_REGION || 'us-east-1';

    if (!apiKey) {
        it.skip('skipped - AWS_BEDROCK_API_KEY not set', () => {
            console.log('Set AWS_BEDROCK_API_KEY to run AWS Bedrock integration tests');
        });
        return;
    }

    describe.each(AWS_BEDROCK_MODELS)('Model: $name', ({ name: modelId }) => {
        let ai;
        let modelAvailable = true;

        beforeAll(async () => {
            ai = new AI({
                provider: 'aws bedrock',
                apiKey,
                modelId,
                region,
                system: 'You are a helpful assistant. Be brief.'
            });

            // Test model availability once
            try {
                await ai.generate({
                    prompt: 'Hi',
                    maxTokens: 5
                });
            } catch (error) {
                if (isModelNotEnabledError(error)) {
                    modelAvailable = false;
                } else {
                    throw error;
                }
            }
        });

        it('should generate response', async () => {
            if (!modelAvailable) return;

            const response = await ai.generate({
                prompt: 'What is 2+2? Answer with just the number.',
                maxTokens: 10
            });

            expect(response.success).toBe(true);
            expect(response.provider).toBe('aws bedrock');
            expect(response.response).toBeDefined();
        });

        it('should handle maxTokens (inferenceConfig.maxTokens) correctly', async () => {
            if (!modelAvailable) return;

            const response = await ai.generate({
                prompt: 'Write a short sentence.',
                maxTokens: 50
            });

            expect(response.success).toBe(true);
            expect(response.usage).toBeDefined();
        });

        it('should handle temperature (in inferenceConfig) parameter', async () => {
            if (!modelAvailable) return;

            const response = await ai.generate({
                prompt: 'Say hello.',
                temperature: 0.5,
                maxTokens: 10
            });

            expect(response.success).toBe(true);
        });

        it('should handle temperature=0', async () => {
            if (!modelAvailable) return;

            const response = await ai.generate({
                prompt: 'What is the capital of France?',
                temperature: 0,
                maxTokens: 50
            });

            expect(response.success).toBe(true);
            expect(response.response.toLowerCase()).toContain('paris');
        });

        it('should handle temperature=1 (high creativity)', async () => {
            if (!modelAvailable) return;

            const response = await ai.generate({
                prompt: 'Say hello.',
                temperature: 1,
                maxTokens: 20
            });

            expect(response.success).toBe(true);
        });

        it('should handle temperature=null gracefully', async () => {
            if (!modelAvailable) return;

            const response = await ai.generate({
                prompt: 'Say hello.',
                temperature: null,
                maxTokens: 10
            });

            expect(response.success).toBe(true);
        });

        it('should handle temperature=undefined gracefully', async () => {
            if (!modelAvailable) return;

            const response = await ai.generate({
                prompt: 'Say hello.',
                temperature: undefined,
                maxTokens: 10
            });

            expect(response.success).toBe(true);
        });

        it('should handle maxTokens=null gracefully', async () => {
            if (!modelAvailable) return;

            const response = await ai.generate({
                prompt: 'Say hello briefly.',
                maxTokens: null
            });

            expect(response.success).toBe(true);
        });

        it('should handle maxTokens=undefined gracefully', async () => {
            if (!modelAvailable) return;

            const response = await ai.generate({
                prompt: 'Say hello briefly.',
                maxTokens: undefined
            });

            expect(response.success).toBe(true);
        });

        it('should handle maxTokens="" (empty string) gracefully', async () => {
            if (!modelAvailable) return;

            const response = await ai.generate({
                prompt: 'Say hello briefly.',
                maxTokens: ''
            });

            expect(response.success).toBe(true);
        });

        it('should handle system prompt (array format)', async () => {
            if (!modelAvailable) return;

            const aiWithSystem = new AI({
                provider: 'aws bedrock',
                apiKey,
                modelId,
                region,
                system: 'Always respond in exactly 3 words.'
            });

            const response = await aiWithSystem.generate({
                prompt: 'Greet me.',
                maxTokens: 20
            });

            expect(response.success).toBe(true);
        });
    });
});
