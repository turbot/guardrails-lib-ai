/**
 * Mock for the '@anthropic-ai/sdk' package
 */

const mockMessagesCreate = jest.fn();

class Anthropic {
    constructor(config) {
        this.config = config;
        this.messages = {
            create: mockMessagesCreate
        };
    }
}

// Export mock function for test assertions
Anthropic.__mockMessagesCreate = mockMessagesCreate;

module.exports = Anthropic;
