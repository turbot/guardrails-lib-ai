jest.mock('@anthropic-ai/sdk');
jest.mock('undici');

const AnthropicProvider = require('../../../providers/AnthropicProvider');
const Anthropic = require('@anthropic-ai/sdk');

describe('AnthropicProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Anthropic.__mockMessagesCreate.mockReset();
    });

    describe('constructor and validation', () => {
        it('should create provider with valid config', () => {
            const provider = new AnthropicProvider({
                apiKey: 'sk-ant-test',
                modelName: 'claude-3-opus'
            });

            expect(provider).toBeInstanceOf(AnthropicProvider);
            expect(provider.getName()).toBe('anthropic');
        });

        it('should throw when apiKey is missing', () => {
            expect(() => new AnthropicProvider({ modelName: 'claude-3-opus' }))
                .toThrow('API key is required');
        });

        it('should throw when modelName is missing', () => {
            expect(() => new AnthropicProvider({ apiKey: 'sk-ant-test' }))
                .toThrow('Model name is required');
        });

        it('should initialize Anthropic client', () => {
            const provider = new AnthropicProvider({
                apiKey: 'sk-ant-test-key',
                modelName: 'claude-3-opus'
            });

            expect(provider.client).toBeDefined();
        });
    });

    describe('generate() - parameter transformation', () => {
        let provider;

        beforeEach(() => {
            provider = new AnthropicProvider({
                apiKey: 'sk-ant-test',
                modelName: 'claude-3-opus'
            });

            Anthropic.__mockMessagesCreate.mockResolvedValue({
                content: [{ text: 'Test response' }],
                usage: { input_tokens: 10, output_tokens: 20 },
                model: 'claude-3-opus'
            });
        });

        it('should use max_tokens (not max_completion_tokens)', async () => {
            await provider.generate('test prompt', { maxTokens: 1000 });

            const callArgs = Anthropic.__mockMessagesCreate.mock.calls[0][0];
            expect(callArgs.max_tokens).toBe(1000);
            expect(callArgs.max_completion_tokens).toBeUndefined();
        });

        it('should include temperature when defined', async () => {
            await provider.generate('test prompt', { temperature: 0.7 });

            const callArgs = Anthropic.__mockMessagesCreate.mock.calls[0][0];
            expect(callArgs.temperature).toBe(0.7);
        });

        it('should include temperature=0', async () => {
            await provider.generate('test prompt', { temperature: 0 });

            const callArgs = Anthropic.__mockMessagesCreate.mock.calls[0][0];
            expect(callArgs.temperature).toBe(0);
        });

        it('should use model from constructor config', async () => {
            await provider.generate('test prompt');

            const callArgs = Anthropic.__mockMessagesCreate.mock.calls[0][0];
            expect(callArgs.model).toBe('claude-3-opus');
        });

        it('should NOT include maxTokens when undefined', async () => {
            await provider.generate('test prompt', {});

            const callArgs = Anthropic.__mockMessagesCreate.mock.calls[0][0];
            expect(callArgs).not.toHaveProperty('max_tokens');
        });
    });

    describe('generate() - system prompt handling (CRITICAL DIFFERENCE from OpenAI)', () => {
        it('should use separate system field (not in messages array)', async () => {
            const provider = new AnthropicProvider({
                apiKey: 'sk-ant-test',
                modelName: 'claude-3-opus',
                system: 'You are Claude'
            });

            Anthropic.__mockMessagesCreate.mockResolvedValue({
                content: [{ text: 'Response' }],
                usage: {},
                model: 'claude-3-opus'
            });

            await provider.generate('test');

            const callArgs = Anthropic.__mockMessagesCreate.mock.calls[0][0];
            // System is SEPARATE field, not in messages
            expect(callArgs.system).toBe('You are Claude');
            expect(callArgs.messages).toEqual([
                { role: 'user', content: 'test' }
            ]);
        });

        it('should NOT include system field when not provided', async () => {
            const provider = new AnthropicProvider({
                apiKey: 'sk-ant-test',
                modelName: 'claude-3-opus'
            });

            Anthropic.__mockMessagesCreate.mockResolvedValue({
                content: [{ text: 'Response' }],
                usage: {},
                model: 'claude-3-opus'
            });

            await provider.generate('test');

            const callArgs = Anthropic.__mockMessagesCreate.mock.calls[0][0];
            expect(callArgs).not.toHaveProperty('system');
        });
    });

    describe('generate() - temperature handling', () => {
        let provider;

        beforeEach(() => {
            provider = new AnthropicProvider({
                apiKey: 'sk-ant-test',
                modelName: 'claude-3-opus'
            });

            Anthropic.__mockMessagesCreate.mockResolvedValue({
                content: [{ text: 'Response' }],
                usage: {},
                model: 'claude-3-opus'
            });
        });

        it('should NOT include temperature when not provided', async () => {
            await provider.generate('test', {});

            const callArgs = Anthropic.__mockMessagesCreate.mock.calls[0][0];
            expect(callArgs).not.toHaveProperty('temperature');
        });
    });

    describe('generate() - response format', () => {
        it('should return standardized response object', async () => {
            const provider = new AnthropicProvider({
                apiKey: 'sk-ant-test',
                modelName: 'claude-3-opus'
            });

            Anthropic.__mockMessagesCreate.mockResolvedValue({
                content: [{ text: 'The answer is 42' }],
                usage: { input_tokens: 5, output_tokens: 10 },
                model: 'claude-3-opus-20240229'
            });

            const result = await provider.generate('What is the answer?');

            expect(result).toEqual({
                content: 'The answer is 42',
                usage: { input_tokens: 5, output_tokens: 10 },
                model: 'claude-3-opus-20240229'
            });
        });
    });

    describe('generate() - error handling', () => {
        it('should wrap API errors with internal error', async () => {
            const provider = new AnthropicProvider({
                apiKey: 'sk-ant-test',
                modelName: 'claude-3-opus'
            });

            Anthropic.__mockMessagesCreate.mockRejectedValue(new Error('Rate limit exceeded'));

            await expect(provider.generate('test'))
                .rejects.toThrow('Anthropic API error: Rate limit exceeded');
        });
    });

    describe('getName()', () => {
        it('should return "anthropic"', () => {
            const provider = new AnthropicProvider({
                apiKey: 'sk-ant-test',
                modelName: 'claude-3-opus'
            });

            expect(provider.getName()).toBe('anthropic');
        });
    });
});
