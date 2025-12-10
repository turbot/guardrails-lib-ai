/**
 * Cross-provider comparison tests
 *
 * Run with: npm run test:integration
 *
 * Environment variables required:
 *   - OPENAI_API_KEY
 *   - ANTHROPIC_API_KEY
 */

const { AI } = require('./testUtils');

describe('Cross-Provider Comparison', () => {
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    const hasMultipleProviders = hasOpenAI && hasAnthropic;

    (hasMultipleProviders ? it : it.skip)('should get consistent responses from different providers', async () => {
        const prompt = 'What is 2+2? Answer with just the number.';

        const openai = new AI({
            provider: 'openai',
            apiKey: process.env.OPENAI_API_KEY,
            modelName: 'gpt-4.1'
        });

        const anthropic = new AI({
            provider: 'anthropic',
            apiKey: process.env.ANTHROPIC_API_KEY,
            modelName: 'claude-sonnet-4-20250514'
        });

        const [openaiResponse, anthropicResponse] = await Promise.all([
            openai.generate({ prompt, maxTokens: 10 }),
            anthropic.generate({ prompt, maxTokens: 10 })
        ]);

        // Both should contain "4" in the response
        expect(openaiResponse.response).toContain('4');
        expect(anthropicResponse.response).toContain('4');

        // Both should have standardized response format
        expect(openaiResponse.success).toBe(true);
        expect(anthropicResponse.success).toBe(true);
    });
});
