import { config } from 'dotenv';
config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Setup test database if needed
});

afterAll(async () => {
  // Cleanup
});
