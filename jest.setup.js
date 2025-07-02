// Jest DOM matchers
import '@testing-library/jest-dom'

// Mock window.location
delete window.location
window.location = {
  href: '',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn()
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock fetch
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock
