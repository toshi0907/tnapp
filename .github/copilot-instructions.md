# TN API Server - GitHub Copilot Instructions

**ALWAYS follow these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Bootstrap and Build the Repository
- `npm install` -- takes 45-50 seconds. NEVER CANCEL. Set timeout to 120+ seconds.
- `cp .env.example .env` -- copy environment configuration
- `mkdir -p data` -- create data directory for JSON storage
- `npm run init-data` -- initialize sample data, takes 0.2 seconds
- `npm test` -- run all tests, takes 2 seconds. NEVER CANCEL. Set timeout to 30+ seconds.

### Development Commands
- `npm run dev` -- start development server with nodemon (hot reload)
- `npm start` -- start production server
- `npm run init-data` -- reinitialize sample data if needed
- `npm test` -- run all tests (32 tests should pass)
- `npm run test:watch` -- run tests in watch mode

### Environment Configuration
- Copy `.env.example` to `.env` before first run
- Default Basic Auth: `admin:your-secure-password`
- Default port: `3000`
- Set `BASIC_AUTH_ENABLED=false` to disable authentication (for development only)

## Validation

### ALWAYS run these validation steps after making changes:
1. **Build validation**: `npm install` (if dependencies changed)
2. **Test validation**: `npm test` -- all 32 tests must pass
3. **Server validation**: Start server with `npm run dev`, verify startup message
4. **Health check**: `curl -u admin:your-secure-password http://localhost:3000/health`
5. **API validation**: Test at least one CRUD operation (see scenarios below)

### Manual Validation Scenarios
**CRITICAL**: Always test actual functionality after making changes. Starting and stopping the server is NOT sufficient.

#### Complete Bookmark Workflow Test
```bash
# 1. Start server
npm run dev

# 2. Health check
curl -u admin:your-secure-password http://localhost:3000/health

# 3. Create bookmark
curl -u admin:your-secure-password \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Bookmark","url":"https://test-unique.example.com","description":"Test","tags":["test"],"category":"testing"}' \
  -X POST http://localhost:3000/api/bookmarks

# 4. List bookmarks
curl -u admin:your-secure-password http://localhost:3000/api/bookmarks

# 5. Update bookmark (use ID from create response)
curl -u admin:your-secure-password \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Test","description":"Updated description"}' \
  -X PUT http://localhost:3000/api/bookmarks/{BOOKMARK_ID}

# 6. Delete bookmark
curl -u admin:your-secure-password -X DELETE http://localhost:3000/api/bookmarks/{BOOKMARK_ID}
```

#### TODO Workflow Test
```bash
# Create todo
curl -u admin:your-secure-password \
  -H "Content-Type: application/json" \
  -d '{"title":"Test TODO","description":"Test description","priority":"high","category":"test"}' \
  -X POST http://localhost:3000/api/todos

# List todos
curl -u admin:your-secure-password http://localhost:3000/api/todos

# Mark as completed (use ID from response)
curl -u admin:your-secure-password \
  -H "Content-Type: application/json" \
  -d '{"completed":true}' \
  -X PUT http://localhost:3000/api/todos/{TODO_ID}
```

### Swagger UI Validation
- Access http://localhost:3000/api-docs (no authentication required)
- Verify interactive API documentation loads properly
- Test API endpoints directly from Swagger UI

## Timing Expectations

**CRITICAL**: NEVER CANCEL builds or tests. Set appropriate timeouts.

- **Dependencies**: `npm install` takes 45-50 seconds. Set timeout to 120+ seconds.
- **Tests**: `npm test` takes 2 seconds. Set timeout to 30+ seconds for safety.
- **Data init**: `npm run init-data` takes 0.2 seconds. Set timeout to 30+ seconds.
- **Server startup**: Both `npm run dev` and `npm start` start immediately (<3 seconds)

## Project Structure

### Repository Root
```
tnapp/
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore rules
├── README.md              # Project documentation
├── copilot-instructions.md # Existing project-specific instructions
├── package.json           # Dependencies and scripts
├── package-lock.json      # Lockfile
├── tnapp.code-workspace   # VS Code workspace
├── src/                   # Application source code
├── tests/                 # Test files
├── public/                # Static web files
└── data/                  # JSON data files (created after init-data)
```

### Source Code Structure
```
src/
├── config/
│   └── swagger.js         # Swagger UI configuration
├── database/
│   ├── bookmarkStorage.js # Bookmark data persistence
│   └── todoStorage.js     # TODO data persistence  
├── routes/
│   ├── bookmarks.js       # Bookmark API routes
│   └── todos.js           # TODO API routes
├── createApp.js           # Express app factory
├── initData.js            # Sample data initialization
└── server.js              # Main server entry point
```

### Key API Endpoints
- `GET /health` -- health check with database statistics
- `GET /api-docs` -- Swagger UI documentation (no auth required)
- `GET /api/bookmarks` -- list all bookmarks
- `POST /api/bookmarks` -- create bookmark
- `GET /api/bookmarks/:id` -- get specific bookmark
- `PUT /api/bookmarks/:id` -- update bookmark
- `DELETE /api/bookmarks/:id` -- delete bookmark
- `GET /api/todos` -- list all todos
- `POST /api/todos` -- create todo
- `PUT /api/todos/:id` -- update todo
- `DELETE /api/todos/:id` -- delete todo

## Common Tasks

### After Making Code Changes
1. **ALWAYS** run `npm test` to ensure tests pass
2. **ALWAYS** start the server and test basic functionality
3. **ALWAYS** test the specific API endpoints you modified
4. Check console for any error messages during startup

### When Modifying API Routes
1. Update the route handler in `src/routes/`
2. Update or add Swagger JSDoc comments for documentation
3. Add or update tests in `tests/`
4. Run `npm test` to verify tests pass
5. Test the endpoint manually with curl
6. Verify Swagger UI documentation updates correctly

### When Modifying Data Models
1. Update storage classes in `src/database/`
2. Update API routes that use the modified data
3. Update or add tests for the new functionality
4. Run `npm run init-data` to reset test data if needed
5. Test complete CRUD workflows manually

## Technology Stack

- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **express-basic-auth**: Authentication middleware
- **helmet**: Security headers
- **cors**: Cross-origin request handling
- **dotenv**: Environment variable management
- **swagger-jsdoc**: API documentation generation
- **swagger-ui-express**: Interactive API documentation
- **Jest**: Testing framework
- **supertest**: HTTP testing
- **nodemon**: Development auto-reload

## Authentication

- **Basic Authentication** protects all API endpoints (except `/api-docs`)
- Default credentials: `admin:your-secure-password` (configurable via `.env`)
- Can be disabled by setting `BASIC_AUTH_ENABLED=false` in `.env`
- **NEVER** commit actual credentials to repository

## Data Storage

- Uses **JSON file storage** in `data/` directory
- **bookmarks.json**: Bookmark data
- **todos.json**: TODO data
- Data persists between server restarts
- Use `npm run init-data` to reset to sample data

## Development Guidelines

### Error Handling
- All API endpoints return consistent error format: `{ error: "message" }`
- Use appropriate HTTP status codes (400, 404, 409, 500)
- Log server errors to console

### Testing
- Unit tests mock database operations
- E2E tests use actual server and file system
- Tests are in `tests/` directory with `.test.js` extension
- Use descriptive test names in Japanese (matching existing style)
- All tests must pass before committing changes

### Code Style
- Follow existing JavaScript patterns in the codebase
- Use async/await for asynchronous operations
- Include comprehensive error handling
- Add Swagger JSDoc comments for all API endpoints

## Troubleshooting

### Tests Failing
- Ensure `data/` directory exists: `mkdir -p data`
- Run `npm run init-data` to create initial data files
- Check if server is already running on port 3000

### Server Won't Start
- Verify `.env` file exists: `cp .env.example .env`
- Check if port 3000 is available
- Ensure all dependencies are installed: `npm install`

### API Returns 401 Unauthorized
- Check Basic Auth credentials in `.env` file
- Use correct format: `curl -u username:password`
- Verify `BASIC_AUTH_ENABLED=true` in `.env`

### Data Not Persisting
- Ensure `data/` directory exists and is writable
- Check for errors in console output
- Verify JSON files are not corrupted

## Quick Reference Commands

```bash
# Complete setup from fresh clone
npm install
cp .env.example .env
mkdir -p data
npm run init-data

# Development workflow  
npm run dev                 # Start dev server
npm test                    # Run tests
npm run test:watch          # Watch mode tests

# Production
npm start                   # Start production server

# Health check
curl -u admin:your-secure-password http://localhost:3000/health

# Test API
curl -u admin:your-secure-password http://localhost:3000/api/bookmarks
curl -u admin:your-secure-password http://localhost:3000/api/todos
```