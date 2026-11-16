module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/tests"],
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/tests/e2e/"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" }
};
