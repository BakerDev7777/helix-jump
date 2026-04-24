import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^three$': '<rootDir>/__mocks__/three.ts',
  },
  testMatch: ['**/src/__tests__/**/*.test.ts'],
}

export default config
