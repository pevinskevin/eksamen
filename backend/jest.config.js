export default {
    transform: {},
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'controllers/**/*.js',
        'services/**/*.js',
        'repositories/**/*.js',
        '!**/__tests__/**',
        '!**/node_modules/**',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    moduleNameMapper: {
        '^(\\.\\.?\\/.+)\\.js$': '$1',
    },
};
