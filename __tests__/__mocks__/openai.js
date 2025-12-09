/**
 * Mock for the 'openai' package
 * Mocks both OpenAI and AzureOpenAI classes
 */

const mockChatCompletionsCreate = jest.fn();

class OpenAI {
    constructor(config) {
        this.config = config;
        this.chat = {
            completions: {
                create: mockChatCompletionsCreate
            }
        };
    }
}

class AzureOpenAI {
    constructor(config) {
        this.config = config;
        this.endpoint = config.endpoint;
        this.deployment = config.deployment;
        this.apiVersion = config.apiVersion;
        this.chat = {
            completions: {
                create: mockChatCompletionsCreate
            }
        };
    }
}

// Export mock function for test assertions
OpenAI.__mockChatCompletionsCreate = mockChatCompletionsCreate;
AzureOpenAI.__mockChatCompletionsCreate = mockChatCompletionsCreate;

module.exports = { OpenAI, AzureOpenAI };
