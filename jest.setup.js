require('@testing-library/jest-dom')
const { TextEncoder, TextDecoder } = require('util')

// Polyfills
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock environment variables for testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock fetch globally
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
})

// Global test utilities
global.testUtils = {
  // Mock user with different roles
  mockUser: (role = 'USER') => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
  
  // Mock exercise data
  mockExercise: (overrides = {}) => ({
    id: 'test-exercise-id',
    name: 'Test Exercise',
    description: 'Test exercise description',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Test Location',
    status: 'PLANNING',
    totalBudget: 100000,
    createdBy: 'test-user-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    systems: [],
    ...overrides,
  }),
  
  // Mock system data
  mockSystem: (overrides = {}) => ({
    id: 'test-system-id',
    name: 'Test System',
    description: 'Test system description',
    basePrice: 50000,
    hasLicensing: false,
    licensePrice: 0,
    leadTime: 30,
    consumablesRate: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),
  
  // Mock API response
  mockApiResponse: (data, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  }),
  
  // Wait for async operations
  waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock file for upload testing
  mockFile: (name = 'test.txt', type = 'text/plain', content = 'test content') => {
    const file = new File([content], name, { type })
    return file
  }
}

// Performance testing utilities
global.performanceTestUtils = {
  // Measure component render time
  measureRenderTime: async (renderFn) => {
    const start = performance.now()
    await renderFn()
    const end = performance.now()
    return end - start
  },
  
  // Measure API response time
  measureApiTime: async (apiFn) => {
    const start = performance.now()
    await apiFn()
    const end = performance.now()
    return end - start
  },
  
  // Assert performance threshold
  expectPerformanceThreshold: (actualTime, threshold, operation = 'operation') => {
    if (actualTime > threshold) {
      throw new Error(`${operation} took ${actualTime}ms, which exceeds threshold of ${threshold}ms`)
    }
  }
} 