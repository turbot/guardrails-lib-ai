jest.mock('openai');
jest.mock('@anthropic-ai/sdk');
jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('undici');

const AI = require('../../index');
const { OpenAI } = require('openai');

describe('AI', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        OpenAI.__mockChatCompletionsCreate.mockReset();

        // Default mock response
        OpenAI.__mockChatCompletionsCreate.mockResolvedValue({
            choices: [{ message: { content: 'Test response' } }],
            usage: { prompt_tokens: 10, completion_tokens: 20 },
            model: 'gpt-4'
        });
    });

    describe('constructor - model name normalization', () => {
        it('should accept modelName', () => {
            const ai = new AI({
                provider: 'openai',
                apiKey: 'sk-test',
                modelName: 'gpt-4'
            });

            expect(ai.config.modelName).toBe('gpt-4');
        });

        it('should normalize model to modelName', () => {
            const ai = new AI({
                provider: 'openai',
                apiKey: 'sk-test',
                model: 'gpt-4-turbo'
            });

            expect(ai.config.modelName).toBe('gpt-4-turbo');
        });

        it('should normalize modelId to modelName', () => {
            const ai = new AI({
                provider: 'openai',
                apiKey: 'sk-test',
                modelId: 'gpt-4o'
            });

            expect(ai.config.modelName).toBe('gpt-4o');
        });

        it('should normalize deployment to modelName (Azure)', () => {
            const ai = new AI({
                provider: 'openai',
                apiKey: 'sk-test',
                deployment: 'gpt-35-turbo'
            });

            expect(ai.config.modelName).toBe('gpt-35-turbo');
        });

        it('should prefer modelName over other aliases', () => {
            const ai = new AI({
                provider: 'openai',
                apiKey: 'sk-test',
                modelName: 'primary',
                model: 'secondary',
                modelId: 'tertiary',
                deployment: 'quaternary'
            });

            expect(ai.config.modelName).toBe('primary');
        });

        it('should use modelId when modelName is not provided', () => {
            const ai = new AI({
                provider: 'openai',
                apiKey: 'sk-test',
                modelId: 'model-from-id',
                model: 'model-from-model'
            });

            expect(ai.config.modelName).toBe('model-from-id');
        });
    });

    describe('constructor - provider creation', () => {
        it('should create OpenAI provider', () => {
            const ai = new AI({
                provider: 'openai',
                apiKey: 'sk-test',
                modelName: 'gpt-4'
            });

            expect(ai.getProviderName()).toBe('openai');
        });

        it('should throw when provider is missing', () => {
            expect(() => new AI({
                apiKey: 'sk-test',
                modelName: 'gpt-4'
            })).toThrow(/Provider is required/);
        });

        it('should throw for unsupported provider', () => {
            expect(() => new AI({
                provider: 'unsupported',
                apiKey: 'sk-test',
                modelName: 'test'
            })).toThrow(/Unsupported provider/);
        });
    });

    describe('generate() - prompt handling', () => {
        let ai;

        beforeEach(() => {
            ai = new AI({
                provider: 'openai',
                apiKey: 'sk-test',
                modelName: 'gpt-4'
            });
        });

        it('should accept string prompt', async () => {
            const response = await ai.generate('Hello world');

            expect(response.prompt).toBe('Hello world');
            expect(OpenAI.__mockChatCompletionsCreate).toHaveBeenCalled();
        });

        it('should accept object with prompt', async () => {
            const response = await ai.generate({ prompt: 'Hello world' });

            expect(response.prompt).toBe('Hello world');
        });

        it('should throw when prompt is missing', async () => {
            await expect(ai.generate({}))
                .rejects.toThrow(/Prompt is required/);
        });

        it('should throw when prompt is empty string', async () => {
            await expect(ai.generate(''))
                .rejects.toThrow(/Prompt is required/);
        });

        it('should throw when prompt is null', async () => {
            await expect(ai.generate({ prompt: null }))
                .rejects.toThrow(/Prompt is required/);
        });
    });

    describe('generate() - options passthrough', () => {
        let ai;

        beforeEach(() => {
            ai = new AI({
                provider: 'openai',
                apiKey: 'sk-test',
                modelName: 'gpt-4'
            });
        });

        it('should pass temperature to provider', async () => {
            await ai.generate({
                prompt: 'test',
                temperature: 0.5
            });

            const callArgs = OpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs.temperature).toBe(0.5);
        });

        it('should pass maxTokens to provider as max_completion_tokens', async () => {
            await ai.generate({
                prompt: 'test',
                maxTokens: 1000
            });

            const callArgs = OpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs.max_completion_tokens).toBe(1000);
        });

        it('should pass temperature=0', async () => {
            await ai.generate({
                prompt: 'test',
                temperature: 0
            });

            const callArgs = OpenAI.__mockChatCompletionsCreate.mock.calls[0][0];
            expect(callArgs.temperature).toBe(0);
        });
    });

    describe('generate() - response format', () => {
        let ai;

        beforeEach(() => {
            ai = new AI({
                provider: 'openai',
                apiKey: 'sk-test',
                modelName: 'gpt-4'
            });

            OpenAI.__mockChatCompletionsCreate.mockResolvedValue({
                choices: [{ message: { content: 'The answer is 42' } }],
                usage: { prompt_tokens: 5, completion_tokens: 10 },
                model: 'gpt-4-0613'
            });
        });

        it('should return standardized response object', async () => {
            const response = await ai.generate({
                prompt: 'What is the answer?',
                temperature: 0.5,
                maxTokens: 100
            });

            expect(response).toMatchObject({
                success: true,
                provider: 'openai',
                prompt: 'What is the answer?',
                response: 'The answer is 42',
                model: 'gpt-4-0613',
                usage: { prompt_tokens: 5, completion_tokens: 10 },
                config: {
                    temperature: 0.5,
                    maxTokens: 100
                }
            });
        });

        it('should include timestamp in response', async () => {
            const response = await ai.generate('test');

            expect(response.timestamp).toBeDefined();
            expect(new Date(response.timestamp).toISOString()).toBe(response.timestamp);
        });

        it('should set config.temperature to null when not provided', async () => {
            const response = await ai.generate('test');

            expect(response.config.temperature).toBeNull();
        });

        it('should set config.maxTokens to null when not provided', async () => {
            const response = await ai.generate('test');

            expect(response.config.maxTokens).toBeNull();
        });

        it('should preserve temperature=0 in response config', async () => {
            const response = await ai.generate({
                prompt: 'test',
                temperature: 0
            });

            expect(response.config.temperature).toBe(0);
        });
    });

    describe('getProviderName()', () => {
        it('should return provider name for openai', () => {
            const ai = new AI({
                provider: 'openai',
                apiKey: 'sk-test',
                modelName: 'gpt-4'
            });

            expect(ai.getProviderName()).toBe('openai');
        });
    });

    describe('static getSupportedProviders()', () => {
        it('should return array of all supported providers', () => {
            const providers = AI.getSupportedProviders();

            expect(providers).toEqual([
                'openai',
                'anthropic',
                'aws bedrock',
                'azure openai'
            ]);
        });

        it('should return 4 providers', () => {
            const providers = AI.getSupportedProviders();

            expect(providers).toHaveLength(4);
        });
    });

    describe('named export', () => {
        it('should export AI as named export', () => {
            const { AI: AIClass } = require('../../index');

            expect(AIClass).toBeDefined();
            expect(AIClass).toBe(AI);
        });
    });
});
