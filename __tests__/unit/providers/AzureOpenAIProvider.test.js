jest.mock('openai');
jest.mock('undici');

const AzureOpenAIProvider = require('../../../providers/AzureOpenAIProvider');
const { AzureOpenAI } = require('openai');

describe('AzureOpenAIProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        AzureOpenAI.__mockChatCompletionsCreate.mockReset();
    });

    describe('constructor and validation', () => {
        it('should create provider with valid config', () => {
            const provider = new AzureOpenAIProvider({
                apiKey: 'test-key',
                modelName: 'gpt-35-turbo',
                endpoint: 'https://example.openai.azure.com/',
                apiVersion: '2024-04-01-preview'
            });

            expect(provider).toBeInstanceOf(AzureOpenAIProvider);
            expect(provider.getName()).toBe('azure openai');
        });

        it('should throw when apiKey is missing', () => {
            expect(() => new AzureOpenAIProvider({
                modelName: 'gpt-35-turbo',
                endpoint: 'https://example.openai.azure.com/',
                apiVersion: '2024-04-01-preview'
            })).toThrow('API key is required');
        });

        it('should throw when modelName is missing', () => {
            expect(() => new AzureOpenAIProvider({
                apiKey: 'test-key',
                endpoint: 'https://example.openai.azure.com/',
                apiVersion: '2024-04-01-preview'
            })).toThrow('Model name is required');
        });

        it('should throw when endpoint is missing', () => {
            expect(() => new AzureOpenAIProvider({
                apiKey: 'test-key',
                modelName: 'gpt-35-turbo',
                apiVersion: '2024-04-01-preview'
            })).toThrow('Endpoint is required');
        });

        it('should throw when apiVersion is missing', () => {
            expect(() => new AzureOpenAIProvider({
                apiKey: 'test-key',
                modelName: 'gpt-35-turbo',
                endpoint: 'https://example.openai.azure.com/'
            })).toThrow('API version is required');
        });

        it('should initialize AzureOpenAI client', () => {
            const provider = new AzureOpenAIProvider({
                apiKey: 'test-key',
                modelName: 'gpt-35-turbo',
                endpoint: 'https://example.openai.azure.com/',
                apiVersion: '2024-04-01-preview'
            });

            expect(provider.client).toBeDefined();
        });
    });

    describe('isGPT5()', () => {
        let provider;

        beforeEach(() => {
            provider = new AzureOpenAIProvider({
                apiKey: 'test-key',
                modelName: 'gpt-35-turbo',
                endpoint: 'https://example.openai.azure.com/',
                apiVersion: '2024-04-01-preview'
            });
        });

        it('should return true for gpt-5', () => {
            expect(provider.isGPT5('gpt-5')).toBe(true);
        });

        it('should return true for GPT-5 (case insensitive)', () => {
            expect(provider.isGPT5('GPT-5')).toBe(true);
        });

        it('should return false for gpt-4', () => {
            expect(provider.isGPT5('gpt-4')).toBe(false);
        });

        it('should return false for gpt-35-turbo', () => {
            expect(provider.isGPT5('gpt-35-turbo')).toBe(false);
        });
    });

    describe('generate() - parameter transformation (DIFFERENCE from OpenAI)', () => {
        let provider;

        beforeEach(() => {
            provider = new AzureOpenAIProvider({
                apiKey: 'test-key',
                modelName: 'gpt-35-turbo',
                endpoint: 'https://example.openai.azure.com/',
                apiVersion: '2024-04-01-preview'
            });

            AzureOpenAI.__mockChatCompletionsCreate.mockResolvedValue({
                choices: [{ message: { content: 'Azure response' } }],
                usage: { prompt_tokens: 10, completion_tokens: 20 },
                model: 'gpt-35-turbo'
            });
        });

        // CRITICAL DIFFERENCE: Azure uses max_tokens, OpenAI uses max_completion_tokens
        it('should use max_tokens (not max_completion_tokens like OpenAI)', async () => {
            await provider.generate('test', { maxTokens: 1000 });

            const callArgs = AzureOpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs.max_tokens).toBe(1000);
            expect(callArgs.max_completion_tokens).toBeUndefined();
        });

        it('should include temperature for non-GPT-5 models', async () => {
            await provider.generate('test', { temperature: 0.5 });

            const callArgs = AzureOpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs.temperature).toBe(0.5);
        });

        it('should include temperature=0', async () => {
            await provider.generate('test', { temperature: 0 });

            const callArgs = AzureOpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs.temperature).toBe(0);
        });

        it('should NOT include temperature when undefined', async () => {
            await provider.generate('test', {});

            const callArgs = AzureOpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs).not.toHaveProperty('temperature');
        });

        it('should NOT include maxTokens when undefined', async () => {
            await provider.generate('test', {});

            const callArgs = AzureOpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs).not.toHaveProperty('max_tokens');
        });
    });

    describe('generate() - GPT-5 handling (same as OpenAI)', () => {
        it('should NOT include temperature for GPT-5', async () => {
            const provider = new AzureOpenAIProvider({
                apiKey: 'test-key',
                modelName: 'gpt-5',
                endpoint: 'https://example.openai.azure.com/',
                apiVersion: '2024-04-01-preview'
            });

            AzureOpenAI.__mockChatCompletionsCreate.mockResolvedValue({
                choices: [{ message: { content: 'GPT-5 response' } }],
                usage: {},
                model: 'gpt-5'
            });

            await provider.generate('test', { temperature: 0.5 });

            const callArgs = AzureOpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs).not.toHaveProperty('temperature');
        });

        it('should still include maxTokens for GPT-5', async () => {
            const provider = new AzureOpenAIProvider({
                apiKey: 'test-key',
                modelName: 'gpt-5',
                endpoint: 'https://example.openai.azure.com/',
                apiVersion: '2024-04-01-preview'
            });

            AzureOpenAI.__mockChatCompletionsCreate.mockResolvedValue({
                choices: [{ message: { content: 'GPT-5 response' } }],
                usage: {},
                model: 'gpt-5'
            });

            await provider.generate('test', { maxTokens: 500 });

            const callArgs = AzureOpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs.max_tokens).toBe(500);
        });
    });

    describe('generate() - system prompt handling (same as OpenAI)', () => {
        it('should add system message to messages array', async () => {
            const provider = new AzureOpenAIProvider({
                apiKey: 'test-key',
                modelName: 'gpt-35-turbo',
                endpoint: 'https://example.openai.azure.com/',
                apiVersion: '2024-04-01-preview',
                system: 'You are a helpful assistant'
            });

            AzureOpenAI.__mockChatCompletionsCreate.mockResolvedValue({
                choices: [{ message: { content: 'Response' } }],
                usage: {},
                model: 'gpt-35-turbo'
            });

            await provider.generate('test');

            const callArgs = AzureOpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs.messages).toEqual([
                { role: 'system', content: 'You are a helpful assistant' },
                { role: 'user', content: 'test' }
            ]);
        });

        it('should work without system prompt', async () => {
            const provider = new AzureOpenAIProvider({
                apiKey: 'test-key',
                modelName: 'gpt-35-turbo',
                endpoint: 'https://example.openai.azure.com/',
                apiVersion: '2024-04-01-preview'
            });

            AzureOpenAI.__mockChatCompletionsCreate.mockResolvedValue({
                choices: [{ message: { content: 'Response' } }],
                usage: {},
                model: 'gpt-35-turbo'
            });

            await provider.generate('test');

            const callArgs = AzureOpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs.messages).toEqual([
                { role: 'user', content: 'test' }
            ]);
        });
    });

    describe('generate() - response format', () => {
        it('should return standardized response object', async () => {
            const provider = new AzureOpenAIProvider({
                apiKey: 'test-key',
                modelName: 'gpt-35-turbo',
                endpoint: 'https://example.openai.azure.com/',
                apiVersion: '2024-04-01-preview'
            });

            AzureOpenAI.__mockChatCompletionsCreate.mockResolvedValue({
                choices: [{ message: { content: 'The answer is 42' } }],
                usage: { prompt_tokens: 5, completion_tokens: 10 },
                model: 'gpt-35-turbo-0613'
            });

            const result = await provider.generate('What is the answer?');

            expect(result).toEqual({
                content: 'The answer is 42',
                usage: { prompt_tokens: 5, completion_tokens: 10 },
                model: 'gpt-35-turbo-0613'
            });
        });
    });

    describe('generate() - error handling', () => {
        it('should wrap API errors with internal error', async () => {
            const provider = new AzureOpenAIProvider({
                apiKey: 'test-key',
                modelName: 'gpt-35-turbo',
                endpoint: 'https://example.openai.azure.com/',
                apiVersion: '2024-04-01-preview'
            });

            AzureOpenAI.__mockChatCompletionsCreate.mockRejectedValue(new Error('Deployment not found'));

            await expect(provider.generate('test'))
                .rejects.toThrow('Azure OpenAI API error: Deployment not found');
        });
    });

    describe('getName()', () => {
        it('should return "azure openai"', () => {
            const provider = new AzureOpenAIProvider({
                apiKey: 'test-key',
                modelName: 'gpt-35-turbo',
                endpoint: 'https://example.openai.azure.com/',
                apiVersion: '2024-04-01-preview'
            });

            expect(provider.getName()).toBe('azure openai');
        });
    });
});
