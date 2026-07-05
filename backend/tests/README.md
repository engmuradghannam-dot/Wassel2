# Wassel ERP - Test Suite

## Testing Setup

### Prerequisites
```bash
cd backend
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### Test Structure

```
tests/
├── setup.ts              # Global test setup
├── auth.test.ts          # Authentication tests
├── companies.test.ts     # Company management tests
├── customers.test.ts     # Customer management tests
├── suppliers.test.ts     # Supplier management tests
├── items.test.ts         # Item/Inventory tests
├── invoices.test.ts      # Invoice tests
└── employees.test.ts     # Employee tests
```

### Test Coverage Areas

| Module | Tests | Status |
|--------|-------|--------|
| Auth | Register, Login, Profile | ✅ |
| Companies | CRUD operations | ✅ |
| Customers | CRUD operations | ✅ |
| Suppliers | CRUD operations | ✅ |
| Items | CRUD operations | ✅ |
| Invoices | CRUD + Submit/Cancel | ✅ |
| Employees | CRUD operations | ✅ |

### Environment Variables

Create `.env.test` file:
```env
NODE_ENV=test
PORT=5001
DATABASE_URL="postgresql://user:pass@localhost:5432/wassel_test"
JWT_SECRET=test_secret
```

### Notes
- Tests use an isolated test database
- All test data is cleaned up after tests
- Tests run sequentially (`--runInBand`)
