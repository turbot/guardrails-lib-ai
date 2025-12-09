/**
 * Mock for the '@aws-sdk/client-bedrock-runtime' package
 */

const mockSend = jest.fn();
let lastConverseCommandInput = null;

class BedrockRuntimeClient {
    constructor(config) {
        this.config = config;
        this.send = mockSend;
    }
}

class ConverseCommand {
    constructor(input) {
        this.input = input;
        lastConverseCommandInput = input;
    }
}

// Export mock functions for test assertions
BedrockRuntimeClient.__mockSend = mockSend;
ConverseCommand.__getLastInput = () => lastConverseCommandInput;
ConverseCommand.__resetLastInput = () => { lastConverseCommandInput = null; };

module.exports = { BedrockRuntimeClient, ConverseCommand };
