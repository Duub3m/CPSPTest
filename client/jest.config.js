module.exports = {
    testEnvironment: 'jsdom',
    moduleNameMapper: {
      '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
      '\\.(css|scss)$': 'identity-obj-proxy',
    },
  };
  