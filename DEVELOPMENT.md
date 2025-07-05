# 🛠️ Development Guide

This guide covers development workflows, testing, and advanced usage of the Secret Santa application.

## 🚀 Development Workflow

### Quick Development Commands

```bash
make help          # Show all available commands
make start         # Start development environment
make stop          # Stop all services
make restart       # Restart all services
make logs          # View all logs
make health        # Check service health
```

### Development Environment

The application runs in development mode with:
- **Hot reload** for both frontend and backend
- **Database persistence** across restarts
- **Debug logging** enabled
- **Source maps** for easier debugging

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
make test

# Run specific test suites
make test-server    # Backend tests only
make test-client    # Frontend tests only

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
apps/
├── server/
│   └── src/
│       └── __tests__/     # Backend tests
└── client/
    └── src/
        └── __tests__/     # Frontend tests
```

### Writing Tests

**Backend Tests (Jest + Supertest):**
```typescript
// apps/server/src/__tests__/participants.test.ts
import request from 'supertest';
import app from '../app';

describe('Participants API', () => {
  test('GET /api/participants', async () => {
    const response = await request(app)
      .get('/api/participants')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

**Frontend Tests (Vitest + Testing Library):**
```typescript
// apps/client/src/__tests__/ParticipantList.test.tsx
import { render, screen } from '@testing-library/react';
import ParticipantList from '../components/ParticipantList';

test('renders participant list', () => {
  render(<ParticipantList participants={[]} />);
  expect(screen.getByText('Participants')).toBeInTheDocument();
});
```

---

## 🗄️ Database Development

### Database Commands

```bash
make db-migrate    # Run database migrations
make db-reset      # Reset database (destructive!)
make db-studio     # Open Prisma Studio (database GUI)
```

### Working with Prisma

**Generate Prisma Client:**
```bash
docker compose exec server npm run db:generate
```

**Create Migration:**
```bash
docker compose exec server npm run db:migrate:dev --name add_new_field
```

**Reset Database:**
```bash
docker compose exec server npm run db:reset
```

### Database Schema

The database schema is defined in `apps/server/prisma/schema.prisma`:

```prisma
model Participant {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 🔧 Code Quality

### Linting and Formatting

```bash
make lint          # Run ESLint
make lint-fix      # Fix linting issues automatically
make format        # Format code with Prettier
```

### Pre-commit Hooks

The project uses Husky for pre-commit hooks:
- **Lint-staged:** Runs linting on staged files
- **Type checking:** Ensures TypeScript compiles
- **Tests:** Runs relevant tests

### Code Style Guidelines

- **TypeScript** for type safety
- **ESLint** with strict rules
- **Prettier** for consistent formatting
- **Conventional Commits** for commit messages

---

## 📁 Project Structure

```
secret-santa/
├── apps/
│   ├── client/              # React frontend
│   │   ├── src/
│   │   │   ├── components/  # React components
│   │   │   ├── pages/       # Page components
│   │   │   ├── hooks/       # Custom hooks
│   │   │   ├── utils/       # Utility functions
│   │   │   └── types/       # TypeScript types
│   │   └── package.json
│   └── server/              # Node.js backend
│       ├── src/
│       │   ├── routes/      # API routes
│       │   ├── services/    # Business logic
│       │   ├── middleware/  # Express middleware
│       │   ├── utils/       # Utility functions
│       │   └── types/       # TypeScript types
│       ├── prisma/          # Database schema & migrations
│       └── package.json
├── packages/
│   └── shared-types/        # Shared TypeScript types
├── docker-compose.yml       # Docker services
├── Makefile                 # Development commands
├── .env.example            # Environment template
└── README.md
```

---

## 🔄 Development Workflows

### Adding a New Feature

1. **Create feature branch:**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Start development environment:**
   ```bash
   make start
   ```

3. **Make changes and test:**
   ```bash
   # Make your changes
   make test
   make lint
   ```

4. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

### Database Schema Changes

1. **Update schema:**
   ```bash
   # Edit apps/server/prisma/schema.prisma
   ```

2. **Create migration:**
   ```bash
   docker compose exec server npm run db:migrate:dev --name describe_change
   ```

3. **Test migration:**
   ```bash
   make db-reset
   make test
   ```

### Adding API Endpoints

1. **Create route file:**
   ```typescript
   // apps/server/src/routes/newResource.ts
   import { Router } from 'express';
   
   const router = Router();
   
   router.get('/', (req, res) => {
     res.json({ message: 'New resource endpoint' });
   });
   
   export default router;
   ```

2. **Register route:**
   ```typescript
   // apps/server/src/app.ts
   import newResourceRoutes from './routes/newResource';
   
   app.use('/api/new-resource', newResourceRoutes);
   ```

3. **Add tests:**
   ```typescript
   // apps/server/src/__tests__/newResource.test.ts
   ```

---

## 🐳 Docker Development

### Docker Commands

```bash
# View running containers
docker compose ps

# Execute commands in containers
docker compose exec server npm run db:migrate
docker compose exec postgres psql -U secret_santa_user -d secret_santa

# View container logs
docker compose logs -f server
docker compose logs -f client
docker compose logs -f postgres

# Rebuild specific service
docker compose build server
docker compose up -d server
```

### Development vs Production

**Development (default):**
- Hot reload enabled
- Debug logging
- Source maps
- Development dependencies included

**Production:**
- Optimized builds
- Minimal logging
- No source maps
- Production-only dependencies

---

## 🔍 Debugging

### Backend Debugging

**View server logs:**
```bash
make logs-server
```

**Debug database queries:**
```bash
# Enable Prisma query logging in .env
DATABASE_URL="postgresql://...?schema=public&logging=true"
```

**Connect to database:**
```bash
docker compose exec postgres psql -U secret_santa_user -d secret_santa
```

### Frontend Debugging

**View client logs:**
```bash
make logs-client
```

**Browser DevTools:**
- React DevTools extension
- Network tab for API calls
- Console for JavaScript errors

---

## 📚 Additional Resources

- **Prisma Documentation:** https://www.prisma.io/docs
- **React Documentation:** https://react.dev
- **Express Documentation:** https://expressjs.com
- **Docker Documentation:** https://docs.docker.com
- **Make Documentation:** https://www.gnu.org/software/make/manual/
