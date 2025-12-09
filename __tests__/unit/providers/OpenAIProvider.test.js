jest.mock('openai');
jest.mock('undici');

const OpenAIProvider = require('../../../providers/OpenAIProvider');
const { OpenAI } = require('openai');

describe('OpenAIProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        OpenAI.__mockChatCompletionsCreate.mockReset();
    });

    describe('constructor and validation', () => {
        it('should create provider with valid config', () => {
            const provider = new OpenAIProvider({
                apiKey: 'sk-test',
                modelName: 'gpt-4'
            });

            expect(provider).toBeInstanceOf(OpenAIProvider);
            expect(provider.getName()).toBe('openai');
        });

        it('should throw when apiKey is missing', () => {
            expect(() => new OpenAIProvider({ modelName: 'gpt-4' }))
                .toThrow('API key is required');
        });

        it('should throw when modelName is missing', () => {
            expect(() => new OpenAIProvider({ apiKey: 'sk-test' }))
                .toThrow('Model name is required');
        });

        it('should initialize OpenAI client', () => {
            const provider = new OpenAIProvider({
                apiKey: 'sk-test-key',
                modelName: 'gpt-4'
            });

            expect(provider.client).toBeDefined();
        });
    });

    describe('isGPT5()', () => {
        let provider;

        beforeEach(() => {
            provider = new OpenAIProvider({
                apiKey: 'sk-test',
                modelName: 'gpt-4'
            });
        });

        it('should return true for gpt-5', () => {
            expect(provider.isGPT5('gpt-5')).toBe(true);
        });

        it('should return true for gpt-5-turbo', () => {
            expect(provider.isGPT5('gpt-5-turbo')).toBe(true);
        });

        it('should return true for GPT-5 (case insensitive)', () => {
            expect(provider.isGPT5('GPT-5')).toBe(true);
        });

        it('should return true for gpt-5-preview', () => {
            expect(provider.isGPT5('gpt-5-preview')).toBe(true);
        });

        it('should return false for gpt-4', () => {
            expect(provider.isGPT5('gpt-4')).toBe(false);
        });

        it('should return false for gpt-4-turbo', () => {
            expect(provider.isGPT5('gpt-4-turbo')).toBe(false);
        });

        it('should return false for gpt-3.5-turbo', () => {
            expect(provider.isGPT5('gpt-3.5-turbo')).toBe(false);
        });

        it('should return false for non-string input', () => {
            expect(provider.isGPT5(null)).toBe(false);
            expect(provider.isGPT5(undefined)).toBe(false);
            expect(provider.isGPT5(123)).toBe(false);
            expect(provider.isGPT5({})).toBe(false);
        });
    });

    describe('generate() - parameter transformation', () => {
        let provider;

        beforeEach(() => {
            provider = new OpenAIProvider({
                apiKey: 'sk-test',
                modelName: 'gpt-4'
            });

            OpenAI.__mockChatCompletionsCreate.mockResolvedValue({
                choices: [{ message: { content: 'Test response' } }],
                usage: { prompt_tokens: 10, completion_tokens: 20 },
                model: 'gpt-4'
            });
        });

        it('should use max_completion_tokens (not max_tokens)', async () => {
            await provider.generate('test prompt', { maxTokens: 1000 });

            const callArgs = OpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs.max_completion_tokens).toBe(1000);
            expect(callArgs.max_tokens).toBeUndefined();
        });

        it('should include temperature for non-GPT-5 models', async () => {
            await provider.generate('test prompt', { temperature: 0.5 });

            const callArgs = OpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs.temperature).toBe(0.5);
        });

        it('should include temperature=0 for non-GPT-5 models', async () => {
            await provider.generate('test prompt', { temperature: 0 });

            const callArgs = OpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs.temperature).toBe(0);
        });

        it('should NOT include temperature when undefined', async () => {
            await provider.generate('test prompt', {});

            const callArgs = OpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs).not.toHaveProperty('temperature');
        });

        it('should NOT include maxTokens when undefined', async () => {
            await provider.generate('test prompt', {});

            const callArgs = OpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs).not.toHaveProperty('max_completion_tokens');
        });

        it('should use model from constructor config', async () => {
            await provider.generate('test prompt');

            const callArgs = OpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs.model).toBe('gpt-4');
        });
    });

    describe('generate() - GPT-5 special handling', () => {
        let provider;

        beforeEach(() => {
            provider = new OpenAIProvider({
                apiKey: 'sk-test',
                modelName: 'gpt-5'
            });

            OpenAI.__mockChatCompletionsCreate.mockResolvedValue({
                choices: [{ message: { content: 'GPT-5 response' } }],
                usage: { prompt_tokens: 10, completion_tokens: 20 },
                model: 'gpt-5'
            });
        });

        it('should NOT include temperature for GPT-5 models', async () => {
            await provider.generate('test prompt', { temperature: 0.5 });

            const callArgs = OpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs).not.toHaveProperty('temperature');
        });

        it('should still include maxTokens for GPT-5 models', async () => {
            await provider.generate('test prompt', { maxTokens: 500 });

            const callArgs = OpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs.max_completion_tokens).toBe(500);
        });

        it('should NOT include temperature for gpt-5-turbo', async () => {
            const gpt5TurboProvider = new OpenAIProvider({
                apiKey: 'sk-test',
                modelName: 'gpt-5-turbo'
            });

            await gpt5TurboProvider.generate('test prompt', { temperature: 0.7 });

            const callArgs = OpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs).not.toHaveProperty('temperature');
        });
    });

    describe('generate() - system prompt handling', () => {
        it('should add system message to messages array when provided', async () => {
            const provider = new OpenAIProvider({
                apiKey: 'sk-test',
                modelName: 'gpt-4',
                system: 'You are a helpful assistant'
            });

            OpenAI.__mockChatCompletionsCreate.mockResolvedValue({
                choices: [{ message: { content: 'Response' } }],
                usage: {},
                model: 'gpt-4'
            });

            await provider.generate('test');

            const callArgs = OpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs.messages).toEqual([
                { role: 'system', content: 'You are a helpful assistant' },
                { role: 'user', content: 'test' }
            ]);
        });

        it('should work without system prompt', async () => {
            const provider = new OpenAIProvider({
                apiKey: 'sk-test',
                modelName: 'gpt-4'
            });

            OpenAI.__mockChatCompletionsCreate.mockResolvedValue({
                choices: [{ message: { content: 'Response' } }],
                usage: {},
                model: 'gpt-4'
            });

            await provider.generate('test');

            const callArgs = OpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs.messages).toEqual([
                { role: 'user', content: 'test' }
            ]);
        });
    });

    describe('generate() - response format', () => {
        it('should return standardized response object', async () => {
            const provider = new OpenAIProvider({
                apiKey: 'sk-test',
                modelName: 'gpt-4'
            });

            OpenAI.__mockChatCompletionsCreate.mockResolvedValue({
                choices: [{ message: { content: 'The answer is 42' } }],
                usage: { prompt_tokens: 5, completion_tokens: 10 },
                model: 'gpt-4-0613'
            });

            const result = await provider.generate('What is the answer?');

            expect(result).toEqual({
                content: 'The answer is 42',
                usage: { prompt_tokens: 5, completion_tokens: 10 },
                model: 'gpt-4-0613'
            });
        });
    });

    describe('generate() - error handling', () => {
        it('should wrap API errors with internal error', async () => {
            const provider = new OpenAIProvider({
                apiKey: 'sk-test',
                modelName: 'gpt-4'
            });

            OpenAI.__mockChatCompletionsCreate.mockRejectedValue(new Error('Rate limit exceeded'));

            await expect(provider.generate('test'))
                .rejects.toThrow('OpenAI API error: Rate limit exceeded');
        });
    });

    describe('getName()', () => {
        it('should return "openai"', () => {
            const provider = new OpenAIProvider({
                apiKey: 'sk-test',
                modelName: 'gpt-4'
            });

            expect(provider.getName()).toBe('openai');
        });
    });
});
