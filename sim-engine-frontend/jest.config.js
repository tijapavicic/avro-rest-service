export default {
  // Test environment
  testEnvironment: 'jsdom',

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@utils/(.*)$': '<rootDir>/components/simulation-launcher/utils/$1'
  },

  // Transform files
  transform: {},

  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'components/**/*.js',
    '!components/**/*.test.js',
    '!**/node_modules/**'
  ],

  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks automatically
  clearMocks: true,

  // Restore mocks automatically
  restoreMocks: true,

  // Module file extensions
  moduleFileExtensions: ['js', 'json'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/'
  ],

  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
};

