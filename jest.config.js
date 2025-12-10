module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '**/__tests__/**/*.test.js'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/__tests__/integration/'
    ],
    modulePathIgnorePatterns: [
        '<rootDir>/node_modules/'
    ],
    clearMocks: true,
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js']
};
