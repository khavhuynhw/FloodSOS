# Contributing to FloodRelief

Thank you for your interest in contributing to FloodRelief!

## Development Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd FloodRelief
```

2. **Start infrastructure:**
```bash
docker-compose up -d
```

3. **Setup backend:**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your configuration
npx prisma migrate dev
npx prisma generate
npm run seed  # Create admin user
npm run dev
```

4. **Setup frontend:**
```bash
cd web
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

## Code Style

- Use TypeScript for all code
- Follow existing code style and patterns
- Run linters before committing
- Write tests for new features

## Testing

- Backend: `cd server && npm test`
- Frontend: `cd web && npm test`
- E2E: `cd web && npm run test:e2e`

## Pull Request Process

1. Create a feature branch
2. Make your changes
3. Add tests if applicable
4. Ensure all tests pass
5. Submit a pull request with a clear description

## Questions?

Open an issue for any questions or concerns.

