/**
 * Shared utilities for integration tests
 */

const AI = require('../../index');

// Increase timeout for API calls (120s to handle rate limiting retries)
jest.setTimeout(120000);

/**
 * Delay helper to avoid rate limiting
 * @param {number} ms - Milliseconds to delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Default delay between API calls (3 seconds)
const API_CALL_DELAY = 3000;

// Max tokens for reasoning models (GPT-5, O-series)
// These models use internal reasoning tokens and need higher limits
const REASONING_MODEL_MAX_TOKENS = 4000;

/**
 * Get appropriate maxTokens for a model
 * - Regular models: use base token count
 * - Reasoning models (GPT-5/5.1, O-series): use high token count for internal reasoning
 */
function getMaxTokens(supportsTemperature, isOSeries, base = 10) {
    if (isOSeries || !supportsTemperature) return REASONING_MODEL_MAX_TOKENS;
    return base; // Regular models
}

/**
 * Helper to check if an error indicates the model is not enabled/accessible for AWS Bedrock.
 * Models may not be enabled in the AWS account or region, or may require
 * inference profiles instead of on-demand throughput.
 */
function isModelNotEnabledError(error) {
    const message = error?.message || '';
    return (
        message.includes('not enabled') ||
        message.includes('not have access') ||
        message.includes('AccessDeniedException') ||
        message.includes('is not authorized') ||
        message.includes('model identifier is invalid') ||
        message.includes("on-demand throughput isn't supported") ||
        message.includes('inference profile')
    );
}

/**
 * Helper to check if an error indicates the deployment doesn't exist or is not accessible
 * for Azure OpenAI.
 */
function isDeploymentNotFoundError(error) {
    const message = error?.message || '';
    return (
        message.includes('DeploymentNotFound') ||
        message.includes('deployment') ||
        message.includes('not found') ||
        message.includes('does not exist') ||
        message.includes('404')
    );
}

module.exports = {
    AI,
    REASONING_MODEL_MAX_TOKENS,
    API_CALL_DELAY,
    delay,
    getMaxTokens,
    isModelNotEnabledError,
    isDeploymentNotFoundError
};
