const BaseProvider = require('../../../providers/BaseProvider');

describe('BaseProvider', () => {
    describe('constructor', () => {
        it('should store config and initialize client to null', () => {
            const config = { apiKey: 'test-key', modelName: 'test-model' };
            const provider = new BaseProvider(config);

            expect(provider.config).toEqual(config);
            expect(provider.client).toBeNull();
        });

        it('should use empty object as default config', () => {
            const provider = new BaseProvider();

            expect(provider.config).toEqual({});
            expect(provider.client).toBeNull();
        });
    });

    describe('validate()', () => {
        it('should throw when apiKey is missing', () => {
            const provider = new BaseProvider({ modelName: 'test' });

            expect(() => provider.validate()).toThrow('API key is required');
        });

        it('should throw when modelName is missing', () => {
            const provider = new BaseProvider({ apiKey: 'test' });

            expect(() => provider.validate()).toThrow('Model name is required');
        });

        it('should not throw when both apiKey and modelName are provided', () => {
            const provider = new BaseProvider({ apiKey: 'test', modelName: 'test-model' });

            expect(() => provider.validate()).not.toThrow();
        });
    });

    describe('initializeClient()', () => {
        it('should throw "must be implemented by subclass" error', () => {
            const provider = new BaseProvider({});

            expect(() => provider.initializeClient()).toThrow(
                'initializeClient() must be implemented by subclass'
            );
        });
    });

    describe('generate()', () => {
        it('should throw "must be implemented by subclass" error', async () => {
            const provider = new BaseProvider({});

            await expect(provider.generate('test prompt')).rejects.toThrow(
                'generate() must be implemented by subclass'
            );
        });
    });

    describe('getName()', () => {
        it('should return "unknown" for base provider', () => {
            const provider = new BaseProvider({});

            expect(provider.getName()).toBe('unknown');
        });

        it('should return PROVIDER_NAME if defined on subclass', () => {
            class TestProvider extends BaseProvider {
                static PROVIDER_NAME = 'test-provider';
            }

            const provider = new TestProvider({});

            expect(provider.getName()).toBe('test-provider');
        });
    });
});
