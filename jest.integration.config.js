/**
 * Jest configuration for integration tests
 *
 * Key differences from unit test config:
 * - Runs ONLY integration tests
 * - Does NOT use mocks - makes real API calls
 * - Longer timeout for API calls (60 seconds)
 * - Custom reporter for provider-grouped statistics
 */
module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '**/__tests__/integration/**/*.test.js'
    ],
    testPathIgnorePatterns: [
        '/node_modules/'
    ],
    modulePathIgnorePatterns: [
        '<rootDir>/node_modules/',
        // Exclude mocks directory so real API calls are made
        '<rootDir>/__tests__/__mocks__/'
    ],
    // Don't auto-mock anything
    automock: false,
    // Reset mocks between tests
    clearMocks: true,
    // Setup file for loading .env
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
    // Longer timeout for API calls
    testTimeout: 60000,
    // Use default reporter plus custom provider stats reporter
    reporters: [
        'default',
        '<rootDir>/__tests__/integration/providerStatsReporter.js'
    ]
};
