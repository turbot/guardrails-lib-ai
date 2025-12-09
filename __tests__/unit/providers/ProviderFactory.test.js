jest.mock('openai');
jest.mock('@anthropic-ai/sdk');
jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('undici');

const ProviderFactory = require('../../../providers/ProviderFactory');
const OpenAIProvider = require('../../../providers/OpenAIProvider');
const AnthropicProvider = require('../../../providers/AnthropicProvider');
const AwsBedrockProvider = require('../../../providers/AwsBedrockProvider');
const AzureOpenAIProvider = require('../../../providers/AzureOpenAIProvider');

describe('ProviderFactory', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getSupportedProviders()', () => {
        it('should return array of all 4 supported providers', () => {
            const providers = ProviderFactory.getSupportedProviders();

            expect(providers).toEqual([
                'openai',
                'anthropic',
                'aws bedrock',
                'azure openai'
            ]);
        });

        it('should return 4 providers', () => {
            const providers = ProviderFactory.getSupportedProviders();

            expect(providers).toHaveLength(4);
        });
    });

    describe('isSupported()', () => {
        it('should return true for "openai"', () => {
            expect(ProviderFactory.isSupported('openai')).toBe(true);
        });

        it('should return true for "anthropic"', () => {
            expect(ProviderFactory.isSupported('anthropic')).toBe(true);
        });

        it('should return true for "aws bedrock"', () => {
            expect(ProviderFactory.isSupported('aws bedrock')).toBe(true);
        });

        it('should return true for "azure openai"', () => {
            expect(ProviderFactory.isSupported('azure openai')).toBe(true);
        });

        it('should be case insensitive - "OpenAI"', () => {
            expect(ProviderFactory.isSupported('OpenAI')).toBe(true);
        });

        it('should be case insensitive - "ANTHROPIC"', () => {
            expect(ProviderFactory.isSupported('ANTHROPIC')).toBe(true);
        });

        it('should be case insensitive - "AWS BEDROCK"', () => {
            expect(ProviderFactory.isSupported('AWS BEDROCK')).toBe(true);
        });

        it('should be case insensitive - "Azure OpenAI"', () => {
            expect(ProviderFactory.isSupported('Azure OpenAI')).toBe(true);
        });

        it('should return false for unsupported providers', () => {
            expect(ProviderFactory.isSupported('google')).toBe(false);
            expect(ProviderFactory.isSupported('cohere')).toBe(false);
            expect(ProviderFactory.isSupported('mistral')).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(ProviderFactory.isSupported('')).toBe(false);
        });
    });

    describe('create()', () => {
        describe('validation', () => {
            it('should throw when provider is missing', () => {
                expect(() => ProviderFactory.create({ apiKey: 'test' }))
                    .toThrow(/Provider is required/);
            });

            it('should throw when provider is empty string', () => {
                expect(() => ProviderFactory.create({ provider: '', apiKey: 'test' }))
                    .toThrow(/Provider is required/);
            });

            it('should throw for unsupported provider', () => {
                expect(() => ProviderFactory.create({ provider: 'google', apiKey: 'test' }))
                    .toThrow(/Unsupported provider: google/);
            });

            it('should include supported providers list in error message', () => {
                expect(() => ProviderFactory.create({ provider: 'invalid' }))
                    .toThrow(/openai, anthropic, aws bedrock, azure openai/);
            });
        });

        describe('OpenAI provider creation', () => {
            it('should create OpenAIProvider for "openai"', () => {
                const provider = ProviderFactory.create({
                    provider: 'openai',
                    apiKey: 'sk-test',
                    modelName: 'gpt-4'
                });

                expect(provider).toBeInstanceOf(OpenAIProvider);
            });

            it('should create OpenAIProvider for "OpenAI" (case insensitive)', () => {
                const provider = ProviderFactory.create({
                    provider: 'OpenAI',
                    apiKey: 'sk-test',
                    modelName: 'gpt-4'
                });

                expect(provider).toBeInstanceOf(OpenAIProvider);
            });
        });

        describe('Anthropic provider creation', () => {
            it('should create AnthropicProvider for "anthropic"', () => {
                const provider = ProviderFactory.create({
                    provider: 'anthropic',
                    apiKey: 'sk-ant-test',
                    modelName: 'claude-3-opus'
                });

                expect(provider).toBeInstanceOf(AnthropicProvider);
            });

            it('should create AnthropicProvider for "ANTHROPIC" (case insensitive)', () => {
                const provider = ProviderFactory.create({
                    provider: 'ANTHROPIC',
                    apiKey: 'sk-ant-test',
                    modelName: 'claude-3-opus'
                });

                expect(provider).toBeInstanceOf(AnthropicProvider);
            });
        });

        describe('AWS Bedrock provider creation', () => {
            it('should create AwsBedrockProvider for "aws bedrock"', () => {
                const provider = ProviderFactory.create({
                    provider: 'aws bedrock',
                    apiKey: 'test-token',
                    modelName: 'amazon.nova-lite-v1:0',
                    region: 'us-east-1'
                });

                expect(provider).toBeInstanceOf(AwsBedrockProvider);
            });

            it('should create AwsBedrockProvider for "AWS BEDROCK" (case insensitive)', () => {
                const provider = ProviderFactory.create({
                    provider: 'AWS BEDROCK',
                    apiKey: 'test-token',
                    modelName: 'amazon.nova-lite-v1:0',
                    region: 'us-east-1'
                });

                expect(provider).toBeInstanceOf(AwsBedrockProvider);
            });
        });

        describe('Azure OpenAI provider creation', () => {
            it('should create AzureOpenAIProvider for "azure openai"', () => {
                const provider = ProviderFactory.create({
                    provider: 'azure openai',
                    apiKey: 'test-key',
                    modelName: 'gpt-35-turbo',
                    endpoint: 'https://example.openai.azure.com/',
                    apiVersion: '2024-04-01-preview'
                });

                expect(provider).toBeInstanceOf(AzureOpenAIProvider);
            });

            it('should create AzureOpenAIProvider for "Azure OpenAI" (case insensitive)', () => {
                const provider = ProviderFactory.create({
                    provider: 'Azure OpenAI',
                    apiKey: 'test-key',
                    modelName: 'gpt-35-turbo',
                    endpoint: 'https://example.openai.azure.com/',
                    apiVersion: '2024-04-01-preview'
                });

                expect(provider).toBeInstanceOf(AzureOpenAIProvider);
            });
        });

        describe('config passthrough', () => {
            it('should pass full config to provider constructor', () => {
                const config = {
                    provider: 'openai',
                    apiKey: 'sk-test',
                    modelName: 'gpt-4',
                    system: 'You are helpful',
                    proxyUrl: 'http://proxy.example.com'
                };

                const provider = ProviderFactory.create(config);

                expect(provider.config).toEqual(config);
            });
        });
    });
});
