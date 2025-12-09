/**
 * Integration tests for Anthropic Provider
 *
 * Run with: npm run test:integration:anthropic
 *
 * Environment variables required:
 *   - ANTHROPIC_API_KEY
 */

const { AI } = require('./testUtils');

/**
 * Anthropic Models to test
 *
 * Claude 4.5 Series (Latest - 2025)
 * - claude-sonnet-4-5-20250929: Smart model for complex agents and coding
 * - claude-haiku-4-5-20251001: Fastest model with near-frontier intelligence
 * - claude-opus-4-5-20251101: Premium model, maximum intelligence
 *
 * Claude 4 Series (May 2025)
 * - claude-sonnet-4-20250514: Fast, capable model
 * - claude-opus-4-20250514: High-capability model
 * - claude-opus-4-1-20250805: Upgrade focused on agentic tasks
 *
 * Claude 3.7 Series (February 2025)
 * - claude-3-7-sonnet-20250219: Hybrid reasoning model
 *
 * Claude 3.5 Series (Legacy)
 * - claude-3-5-haiku-20241022: Fast, cost-effective
 *
 * Claude 3 Series (Legacy)
 * - claude-3-haiku-20240307: Original Haiku
 *
 * Reference: https://docs.anthropic.com/en/docs/about-claude/models/overview
 */
const ANTHROPIC_MODELS = [
    // Claude 4.5 family (Latest)
    { name: 'claude-sonnet-4-5-20250929', supportsTemperature: true },
    { name: 'claude-haiku-4-5-20251001', supportsTemperature: true },
    { name: 'claude-opus-4-5-20251101', supportsTemperature: true },

    // Claude 4 family
    { name: 'claude-sonnet-4-20250514', supportsTemperature: true },
    { name: 'claude-opus-4-20250514', supportsTemperature: true },
    { name: 'claude-opus-4-1-20250805', supportsTemperature: true },

    // Claude 3.7 family
    { name: 'claude-3-7-sonnet-20250219', supportsTemperature: true },

    // Claude 3.5 family (Legacy)
    { name: 'claude-3-5-haiku-20241022', supportsTemperature: true },

    // Claude 3 family (Legacy)
    { name: 'claude-3-haiku-20240307', supportsTemperature: true }
];

describe('Anthropic Provider', () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
        it.skip('skipped - ANTHROPIC_API_KEY not set', () => {
            console.log('Set ANTHROPIC_API_KEY to run Anthropic integration tests');
        });
        return;
    }

    describe.each(ANTHROPIC_MODELS)('Model: $name', ({ name: modelName }) => {
        let ai;

        beforeAll(() => {
            ai = new AI({
                provider: 'anthropic',
                apiKey,
                modelName,
                system: 'You are a helpful assistant. Be brief.'
            });
        });

        it('should generate response', async () => {
            const response = await ai.generate({
                prompt: 'What is 2+2? Answer with just the number.',
                maxTokens: 10
            });

            expect(response.success).toBe(true);
            expect(response.provider).toBe('anthropic');
            expect(response.response).toBeDefined();
            expect(response.response.length).toBeGreaterThan(0);
        });

        it('should handle maxTokens (max_tokens) correctly', async () => {
            const response = await ai.generate({
                prompt: 'Write a short sentence.',
                maxTokens: 50
            });

            expect(response.success).toBe(true);
            expect(response.usage).toBeDefined();
        });

        it('should handle temperature parameter', async () => {
            const response = await ai.generate({
                prompt: 'Say hello.',
                temperature: 0.5,
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

        // Note: Unlike OpenAI, Anthropic REQUIRES max_tokens - it has no default.
        // Tests for maxTokens=null/undefined/empty are not applicable for Anthropic.
        // The library correctly filters these out, but Anthropic API rejects requests without max_tokens.

        it('should handle system prompt (separate system field)', async () => {
            const aiWithSystem = new AI({
                provider: 'anthropic',
                apiKey,
                modelName,
                system: 'Always respond with exactly one word.'
            });

            const response = await aiWithSystem.generate({
                prompt: 'Greet me.',
                maxTokens: 20
            });

            expect(response.success).toBe(true);
        });
    });
});
