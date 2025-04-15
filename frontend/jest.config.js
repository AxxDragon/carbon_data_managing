module.exports = {
    preset: "ts-jest",
    testEnvironment: "jest-environment-jsdom",
    moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
    transform: {
      "^.+\\.(ts|tsx)$": "ts-jest"
    },
    transformIgnorePatterns: [
      "/node_modules/(?!axios)/"
    ],
    setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
    testMatch: ["**/__tests__/**/*.[jt]s?(x)"],
  };
  