/**
 * Integration tests for OpenAI Provider
 *
 * Run with: npm run test:integration:openai
 *
 * Environment variables required:
 *   - OPENAI_API_KEY
 */

const { AI, getMaxTokens } = require('./testUtils');

/**
 * OpenAI Models to test
 *
 * GPT-4o Series (May 2024) - supports temperature
 * - gpt-4o: Multimodal flagship model
 * - gpt-4o-mini: Smaller, faster, cost-effective
 *
 * GPT-4.1 Series (April 2025) - supports temperature
 * - gpt-4.1: Latest GPT-4, strong at coding and instruction following
 * - gpt-4.1-mini: Smaller, faster GPT-4.1
 * - gpt-4.1-nano: Smallest GPT-4.1, optimized for speed
 *
 * GPT-5 Series (August 2025) - does NOT support temperature
 * - gpt-5: Flagship model, strongest overall
 * - gpt-5-mini: Balanced performance/cost
 * - gpt-5-nano: Fastest, lowest cost
 *
 * GPT-5.1 Series (November 2025) - reasoning models with adaptive thinking
 * - gpt-5.1: Advanced reasoning model
 *
 * O1 Series (Reasoning models) - does NOT support temperature
 * - o1: Advanced reasoning model
 *
 * O3 Series (Latest reasoning) - does NOT support temperature
 * - o3: Latest reasoning model
 * - o3-mini: Smaller, faster reasoning model
 *
 * O4 Series (Latest) - does NOT support temperature
 * - o4-mini: Latest mini reasoning model
 *
 * Reference: https://platform.openai.com/docs/models/
 */
const OPENAI_MODELS = [
    // GPT-4o family - supports temperature
    { name: 'gpt-4o', supportsTemperature: true },
    { name: 'gpt-4o-mini', supportsTemperature: true },

    // GPT-4.1 family - supports temperature
    { name: 'gpt-4.1', supportsTemperature: true },
    { name: 'gpt-4.1-mini', supportsTemperature: true },
    { name: 'gpt-4.1-nano', supportsTemperature: true },

    // GPT-5 family - does NOT support temperature
    { name: 'gpt-5', supportsTemperature: false },
    { name: 'gpt-5-mini', supportsTemperature: false },
    { name: 'gpt-5-nano', supportsTemperature: false },

    // GPT-5.1 family - reasoning models, does NOT support temperature
    { name: 'gpt-5.1', supportsTemperature: false },

    // O1 series - reasoning models, needs higher token limits for deep reasoning
    { name: 'o1', supportsTemperature: false, isOSeries: true },

    // O3 series - reasoning models, needs higher token limits for deep reasoning
    { name: 'o3', supportsTemperature: false, isOSeries: true },
    { name: 'o3-mini', supportsTemperature: false, isOSeries: true },

    // O4 series - reasoning models, needs higher token limits for deep reasoning
    { name: 'o4-mini', supportsTemperature: false, isOSeries: true }
];

describe('OpenAI Provider', () => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        it.skip('skipped - OPENAI_API_KEY not set', () => {
            console.log('Set OPENAI_API_KEY to run OpenAI integration tests');
        });
        return;
    }

    describe.each(OPENAI_MODELS)('Model: $name (temperature: $supportsTemperature)', ({ name: modelName, supportsTemperature, isOSeries }) => {
        let ai;

        beforeAll(() => {
            ai = new AI({
                provider: 'openai',
                apiKey,
                modelName,
                system: 'You are a helpful assistant. Be brief.'
            });
        });

        it('should generate response', async () => {
            const response = await ai.generate({
                prompt: 'What is 2+2? Answer with just the number.',
                maxTokens: getMaxTokens(supportsTemperature, isOSeries, 10)
            });

            expect(response.success).toBe(true);
            expect(response.provider).toBe('openai');
            expect(response.response).toBeDefined();
            expect(response.response.length).toBeGreaterThan(0);
        });

        it('should handle maxTokens (max_completion_tokens) correctly', async () => {
            const response = await ai.generate({
                prompt: 'Write a short sentence.',
                maxTokens: getMaxTokens(supportsTemperature, isOSeries, 20)
            });

            expect(response.success).toBe(true);
            expect(response.usage).toBeDefined();
        });

        if (supportsTemperature) {
            it('should handle temperature parameter', async () => {
                const response = await ai.generate({
                    prompt: 'Say hello.',
                    temperature: 0,
                    maxTokens: 10
                });

                expect(response.success).toBe(true);
            });

            it('should handle temperature=0', async () => {
                const response = await ai.generate({
                    prompt: 'What is the capital of France?',
                    temperature: 0,
                    maxTokens: 50
                });

                expect(response.success).toBe(true);
                expect(response.response.toLowerCase()).toContain('paris');
            });

            it('should handle temperature=1 (high creativity)', async () => {
                const response = await ai.generate({
                    prompt: 'Say hello.',
                    temperature: 1,
                    maxTokens: 20
                });

                expect(response.success).toBe(true);
            });

            it('should handle temperature=null gracefully', async () => {
                const response = await ai.generate({
                    prompt: 'Say hello.',
                    temperature: null,
                    maxTokens: 10
                });

                expect(response.success).toBe(true);
            });

            it('should handle temperature=undefined gracefully', async () => {
                const response = await ai.generate({
                    prompt: 'Say hello.',
                    temperature: undefined,
                    maxTokens: 10
                });

                expect(response.success).toBe(true);
            });

            it('should handle maxTokens=null gracefully', async () => {
                const response = await ai.generate({
                    prompt: 'Say hello briefly.',
                    maxTokens: null
                });

                expect(response.success).toBe(true);
            });

            it('should handle maxTokens=undefined gracefully', async () => {
                const response = await ai.generate({
                    prompt: 'Say hello briefly.',
                    maxTokens: undefined
                });

                expect(response.success).toBe(true);
            });

            it('should handle maxTokens="" (empty string) gracefully', async () => {
                const response = await ai.generate({
                    prompt: 'Say hello briefly.',
                    maxTokens: ''
                });

                expect(response.success).toBe(true);
            });
        } else {
            it('should work without temperature (not supported)', async () => {
                // This model doesn't support temperature, verify it works without it
                const response = await ai.generate({
                    prompt: 'Say hello.',
                    maxTokens: getMaxTokens(supportsTemperature, isOSeries, 10)
                });

                expect(response.success).toBe(true);
            });

            it('should handle temperature=null gracefully', async () => {
                // Passing null should be handled (not sent to API)
                const response = await ai.generate({
                    prompt: 'Say hello.',
                    temperature: null,
                    maxTokens: getMaxTokens(supportsTemperature, isOSeries, 10)
                });

                expect(response.success).toBe(true);
            });

            it('should handle temperature=undefined gracefully', async () => {
                // Passing undefined should be handled (not sent to API)
                const response = await ai.generate({
                    prompt: 'Say hello.',
                    temperature: undefined,
                    maxTokens: getMaxTokens(supportsTemperature, isOSeries, 10)
                });

                expect(response.success).toBe(true);
            });

            it('should handle maxTokens=null gracefully', async () => {
                // Passing null maxTokens should use default behavior
                const response = await ai.generate({
                    prompt: 'Say hello.',
                    maxTokens: null
                });

                expect(response.success).toBe(true);
            });

            it('should handle maxTokens=undefined gracefully', async () => {
                // Passing undefined maxTokens should use default behavior
                const response = await ai.generate({
                    prompt: 'Say hello.',
                    maxTokens: undefined
                });

                expect(response.success).toBe(true);
            });

            it('should handle maxTokens="" (empty string) gracefully', async () => {
                const response = await ai.generate({
                    prompt: 'Say hello.',
                    maxTokens: ''
                });

                expect(response.success).toBe(true);
            });
        }

        it('should handle system prompt (in messages array)', async () => {
            const aiWithSystem = new AI({
                provider: 'openai',
                apiKey,
                modelName,
                system: 'Always respond with exactly one word.'
            });

            const response = await aiWithSystem.generate({
                prompt: 'Greet me.',
                maxTokens: getMaxTokens(supportsTemperature, isOSeries, 10)
            });

            expect(response.success).toBe(true);
        });
    });
});
