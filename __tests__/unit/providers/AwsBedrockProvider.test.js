jest.mock('@aws-sdk/client-bedrock-runtime');

const AwsBedrockProvider = require('../../../providers/AwsBedrockProvider');
const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');

describe('AwsBedrockProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        BedrockRuntimeClient.__mockSend.mockReset();
        ConverseCommand.__resetLastInput();
    });

    describe('constructor and validation', () => {
        it('should create provider with valid config', () => {
            const provider = new AwsBedrockProvider({
                apiKey: 'test-token',
                modelName: 'amazon.nova-lite-v1:0',
                region: 'us-east-1'
            });

            expect(provider).toBeInstanceOf(AwsBedrockProvider);
            expect(provider.getName()).toBe('aws bedrock');
        });

        it('should throw when apiKey is missing', () => {
            expect(() => new AwsBedrockProvider({
                modelName: 'amazon.nova-lite-v1:0',
                region: 'us-east-1'
            })).toThrow('API key is required');
        });

        it('should throw when modelName is missing', () => {
            expect(() => new AwsBedrockProvider({
                apiKey: 'test-token',
                region: 'us-east-1'
            })).toThrow('Model name is required');
        });

        it('should throw when region is missing', () => {
            expect(() => new AwsBedrockProvider({
                apiKey: 'test-token',
                modelName: 'amazon.nova-lite-v1:0'
            })).toThrow('AWS region is required');
        });

        it('should set AWS_BEARER_TOKEN_BEDROCK environment variable', () => {
            new AwsBedrockProvider({
                apiKey: 'my-bearer-token',
                modelName: 'amazon.nova-lite-v1:0',
                region: 'us-east-1'
            });

            expect(process.env.AWS_BEARER_TOKEN_BEDROCK).toBe('my-bearer-token');
        });

        it('should initialize BedrockRuntimeClient', () => {
            const provider = new AwsBedrockProvider({
                apiKey: 'test-token',
                modelName: 'amazon.nova-lite-v1:0',
                region: 'us-west-2'
            });

            expect(provider.client).toBeDefined();
        });
    });

    describe('generate() - parameter transformation (CRITICAL DIFFERENCES)', () => {
        let provider;

        beforeEach(() => {
            provider = new AwsBedrockProvider({
                apiKey: 'test-token',
                modelName: 'amazon.nova-lite-v1:0',
                region: 'us-east-1'
            });

            BedrockRuntimeClient.__mockSend.mockResolvedValue({
                output: {
                    message: {
                        content: [{ text: 'Bedrock response' }]
                    }
                },
                usage: { inputTokens: 10, outputTokens: 20 }
            });
        });

        it('should use modelId (not model)', async () => {
            await provider.generate('test');

            const lastInput = ConverseCommand.__getLastInput();
            expect(lastInput.modelId).toBe('amazon.nova-lite-v1:0');
            expect(lastInput.model).toBeUndefined();
        });

        it('should wrap maxTokens in inferenceConfig', async () => {
            await provider.generate('test', { maxTokens: 500 });

            const lastInput = ConverseCommand.__getLastInput();
            expect(lastInput.inferenceConfig).toBeDefined();
            expect(lastInput.inferenceConfig.maxTokens).toBe(500);
        });

        it('should use camelCase maxTokens (not max_tokens or max_completion_tokens)', async () => {
            await provider.generate('test', { maxTokens: 500 });

            const lastInput = ConverseCommand.__getLastInput();
            expect(lastInput.inferenceConfig.maxTokens).toBe(500);
            expect(lastInput.inferenceConfig.max_tokens).toBeUndefined();
            expect(lastInput.inferenceConfig.max_completion_tokens).toBeUndefined();
        });

        it('should wrap temperature in inferenceConfig', async () => {
            await provider.generate('test', { temperature: 0.7 });

            const lastInput = ConverseCommand.__getLastInput();
            expect(lastInput.inferenceConfig).toBeDefined();
            expect(lastInput.inferenceConfig.temperature).toBe(0.7);
        });

        it('should include temperature=0 in inferenceConfig', async () => {
            await provider.generate('test', { temperature: 0 });

            const lastInput = ConverseCommand.__getLastInput();
            expect(lastInput.inferenceConfig.temperature).toBe(0);
        });
    });

    describe('generate() - message format (CRITICAL DIFFERENCE)', () => {
        let provider;

        beforeEach(() => {
            provider = new AwsBedrockProvider({
                apiKey: 'test-token',
                modelName: 'amazon.nova-lite-v1:0',
                region: 'us-east-1'
            });

            BedrockRuntimeClient.__mockSend.mockResolvedValue({
                output: {
                    message: {
                        content: [{ text: 'Response' }]
                    }
                },
                usage: {}
            });
        });

        it('should wrap content in array with text property', async () => {
            await provider.generate('Hello world');

            const lastInput = ConverseCommand.__getLastInput();
            expect(lastInput.messages).toEqual([{
                role: 'user',
                content: [{ text: 'Hello world' }]
            }]);
        });
    });

    describe('generate() - system prompt format (CRITICAL DIFFERENCE)', () => {
        it('should use array format with text property for system', async () => {
            const provider = new AwsBedrockProvider({
                apiKey: 'test-token',
                modelName: 'amazon.nova-lite-v1:0',
                region: 'us-east-1',
                system: 'You are an AWS expert'
            });

            BedrockRuntimeClient.__mockSend.mockResolvedValue({
                output: {
                    message: {
                        content: [{ text: 'Response' }]
                    }
                },
                usage: {}
            });

            await provider.generate('test');

            const lastInput = ConverseCommand.__getLastInput();
            expect(lastInput.system).toEqual([{ text: 'You are an AWS expert' }]);
        });

        it('should NOT include system field when not provided', async () => {
            const provider = new AwsBedrockProvider({
                apiKey: 'test-token',
                modelName: 'amazon.nova-lite-v1:0',
                region: 'us-east-1'
            });

            BedrockRuntimeClient.__mockSend.mockResolvedValue({
                output: {
                    message: {
                        content: [{ text: 'Response' }]
                    }
                },
                usage: {}
            });

            await provider.generate('test');

            const lastInput = ConverseCommand.__getLastInput();
            expect(lastInput).not.toHaveProperty('system');
        });
    });

    describe('generate() - temperature handling', () => {
        let provider;

        beforeEach(() => {
            provider = new AwsBedrockProvider({
                apiKey: 'test-token',
                modelName: 'amazon.nova-lite-v1:0',
                region: 'us-east-1'
            });

            BedrockRuntimeClient.__mockSend.mockResolvedValue({
                output: {
                    message: {
                        content: [{ text: 'Response' }]
                    }
                },
                usage: {}
            });
        });

        it('should NOT include inferenceConfig when no options provided', async () => {
            await provider.generate('test', {});

            const lastInput = ConverseCommand.__getLastInput();
            expect(lastInput).not.toHaveProperty('inferenceConfig');
        });
    });

    describe('generate() - response format', () => {
        it('should return standardized response object', async () => {
            const provider = new AwsBedrockProvider({
                apiKey: 'test-token',
                modelName: 'amazon.nova-lite-v1:0',
                region: 'us-east-1'
            });

            BedrockRuntimeClient.__mockSend.mockResolvedValue({
                output: {
                    message: {
                        content: [{ text: 'The answer is 42' }]
                    }
                },
                usage: { inputTokens: 5, outputTokens: 10 }
            });

            const result = await provider.generate('What is the answer?');

            expect(result).toEqual({
                content: 'The answer is 42',
                usage: { inputTokens: 5, outputTokens: 10 },
                model: 'amazon.nova-lite-v1:0'
            });
        });
    });

    describe('generate() - error handling', () => {
        it('should wrap API errors with internal error', async () => {
            const provider = new AwsBedrockProvider({
                apiKey: 'test-token',
                modelName: 'amazon.nova-lite-v1:0',
                region: 'us-east-1'
            });

            BedrockRuntimeClient.__mockSend.mockRejectedValue(new Error('Throttling exception'));

            await expect(provider.generate('test'))
                .rejects.toThrow('AWS Bedrock API error: Throttling exception');
        });
    });

    describe('getName()', () => {
        it('should return "aws bedrock"', () => {
            const provider = new AwsBedrockProvider({
                apiKey: 'test-token',
                modelName: 'amazon.nova-lite-v1:0',
                region: 'us-east-1'
            });

            expect(provider.getName()).toBe('aws bedrock');
        });
    });
});
