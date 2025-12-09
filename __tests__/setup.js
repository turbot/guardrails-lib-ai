/**
 * Jest setup file
 * Runs after Jest is initialized but before tests run
 */

const path = require('path');

// Load environment variables from .env file for integration tests
require('dotenv').config({
    path: path.resolve(__dirname, '..', '.env'),
    quiet: true
});

// Note: We intentionally do NOT clean up AWS_BEARER_TOKEN_BEDROCK after each test
// because the AwsBedrockProvider sets it during initialization and the AWS SDK
// needs it to remain set for authentication across all tests in the suite.
