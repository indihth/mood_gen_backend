module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],
  verbose: true,
  forceExit: true,

  // clears and resets mocks before each test
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
