/**
 * Integration tests for Azure OpenAI Provider
 *
 * Run with: npm run test:integration:azure-openai
 *
 * Environment variables required:
 *   - AZURE_OPENAI_API_KEY
 *   - AZURE_OPENAI_ENDPOINT
 *   - AZURE_OPENAI_API_VERSION (optional, defaults to 2024-04-01-preview)
 */

const { AI, API_CALL_DELAY, delay, isDeploymentNotFoundError } = require('./testUtils');

/**
 * Azure OpenAI Deployments to test
 *
 * Note: Azure OpenAI uses deployment names (user-created resources) rather than
 * standardized model names. The deployment names below are common conventions
 * that users typically follow when creating Azure OpenAI deployments.
 *
 * Deployments that don't exist will be gracefully skipped.
 * Use tofu script to create deployments: cd __tests__/infra/azure-openai && tofu apply
 *
 * GPT-4o Series - supports temperature
 * - gpt-4o: Multimodal flagship model
 * - gpt-4o-mini: Smaller, faster, cost-effective
 *
 * GPT-4.1 Series - supports temperature
 * - gpt-4.1-mini: Smaller, faster GPT-4.1
 *
 * GPT-5 Series - does NOT support temperature
 * - gpt-5: Flagship model
 * - gpt-5-mini: Balanced performance/cost
 *
 * Reference: https://learn.microsoft.com/en-us/azure/ai-services/openai/
 */
const AZURE_OPENAI_DEPLOYMENTS = [
    // GPT-4o family - supports temperature
    // { name: 'gpt-4o', supportsTemperature: true },
    { name: 'gpt-4o-mini', supportsTemperature: true },

    // GPT-4.1 family - supports temperature
    // { name: 'gpt-4.1-mini', supportsTemperature: true },

    // GPT-5 family - does NOT support temperature
    { name: 'gpt-5', supportsTemperature: false },
    { name: 'gpt-5-mini', supportsTemperature: false }
];

describe('Azure OpenAI Provider', () => {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-04-01-preview';

    if (!apiKey || !endpoint) {
        it.skip('skipped - AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT not set', () => {
            console.log('Set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT to run Azure OpenAI tests');
        });
        return;
    }

    describe.each(AZURE_OPENAI_DEPLOYMENTS)('Deployment: $name (supportsTemperature: $supportsTemperature)', ({ name: deploymentName, supportsTemperature }) => {
        let ai;
        let deploymentAvailable = true;

        beforeAll(async () => {
            ai = new AI({
                provider: 'azure openai',
                apiKey,
                endpoint,
                modelName: deploymentName,
                apiVersion,
                system: 'You are a helpful assistant. Be brief.'
            });

            // Test deployment availability once
            try {
                await ai.generate({
                    prompt: 'Hi',
                    maxTokens: 5
                });
            } catch (error) {
                if (isDeploymentNotFoundError(error)) {
                    deploymentAvailable = false;
                } else {
                    throw error;
                }
            }
        });

        // Add delay between each test to avoid rate limiting
        beforeEach(async () => {
            await delay(API_CALL_DELAY);
        });

        it('should generate response', async () => {
            if (!deploymentAvailable) {
                return;
            }

            const response = await ai.generate({
                prompt: 'What is 2+2? Answer with just the number.',
                maxTokens: 10
            });

            expect(response.success).toBe(true);
            expect(response.provider).toBe('azure openai');
            expect(response.response).toBeDefined();
        });

        it('should handle maxTokens (max_tokens) correctly', async () => {
            if (!deploymentAvailable) {
                return;
            }

            const response = await ai.generate({
                prompt: 'Write a short sentence.',
                maxTokens: 50
            });

            expect(response.success).toBe(true);
            expect(response.usage).toBeDefined();
        });

        if (supportsTemperature) {
            it('should handle temperature parameter', async () => {
                if (!deploymentAvailable) {
                    return;
                }

                const response = await ai.generate({
                    prompt: 'Say hello.',
                    temperature: 0.5,
                    maxTokens: 10
                });

                expect(response.success).toBe(true);
            });

            it('should handle temperature=0', async () => {
                if (!deploymentAvailable) {
                    return;
                }

                const response = await ai.generate({
                    prompt: 'What is the capital of France?',
                    temperature: 0,
                    maxTokens: 50
                });

                expect(response.success).toBe(true);
                expect(response.response.toLowerCase()).toContain('paris');
            });

            it('should handle temperature=1 (high creativity)', async () => {
                if (!deploymentAvailable) {
                    return;
                }

                const response = await ai.generate({
                    prompt: 'Say hello.',
                    temperature: 1,
                    maxTokens: 20
                });

                expect(response.success).toBe(true);
            });

            it('should handle null/undefined temperature gracefully', async () => {
                if (!deploymentAvailable) {
                    return;
                }

                // Test null
                const responseNull = await ai.generate({
                    prompt: 'Say hi.',
                    temperature: null,
                    maxTokens: 10
                });
                expect(responseNull.success).toBe(true);
            });

            it('should handle null/undefined/empty maxTokens gracefully', async () => {
                if (!deploymentAvailable) {
                    return;
                }

                // Test null
                const responseNull = await ai.generate({
                    prompt: 'Say hello briefly.',
                    maxTokens: null
                });
                expect(responseNull.success).toBe(true);

                await delay(API_CALL_DELAY);

                // Test empty string
                const responseEmpty = await ai.generate({
                    prompt: 'Say hello briefly.',
                    maxTokens: ''
                });
                expect(responseEmpty.success).toBe(true);
            });
        } else {
            it('should work without temperature (not supported)', async () => {
                if (!deploymentAvailable) {
                    return;
                }

                const response = await ai.generate({
                    prompt: 'Say hello.',
                    maxTokens: 10
                });

                expect(response.success).toBe(true);
            });

            it('should handle null/undefined temperature gracefully', async () => {
                if (!deploymentAvailable) {
                    return;
                }

                // Test null
                const responseNull = await ai.generate({
                    prompt: 'Say hi.',
                    temperature: null,
                    maxTokens: 10
                });
                expect(responseNull.success).toBe(true);

                await delay(API_CALL_DELAY);

                // Test undefined
                const responseUndefined = await ai.generate({
                    prompt: 'Say hi.',
                    temperature: undefined,
                    maxTokens: 10
                });
                expect(responseUndefined.success).toBe(true);
            });

            it('should handle null/undefined/empty maxTokens gracefully', async () => {
                if (!deploymentAvailable) {
                    return;
                }

                // Test null
                const responseNull = await ai.generate({
                    prompt: 'Say hello briefly.',
                    maxTokens: null
                });
                expect(responseNull.success).toBe(true);

                await delay(API_CALL_DELAY);

                // Test undefined
                const responseUndefined = await ai.generate({
                    prompt: 'Say hello briefly.',
                    maxTokens: undefined
                });
                expect(responseUndefined.success).toBe(true);

                await delay(API_CALL_DELAY);

                // Test empty string
                const responseEmpty = await ai.generate({
                    prompt: 'Say hello briefly.',
                    maxTokens: ''
                });
                expect(responseEmpty.success).toBe(true);
            });
        }

        it('should handle system prompt (in messages array)', async () => {
            if (!deploymentAvailable) {
                return;
            }

            const aiWithSystem = new AI({
                provider: 'azure openai',
                apiKey,
                endpoint,
                modelName: deploymentName,
                apiVersion,
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
