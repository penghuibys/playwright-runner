# Playwright Runner

A secure, observable, and scalable browser automation engine built on Playwright. Execute browser automation tasks through a queue-based architecture with Redis persistence, structured logging, and health monitoring.

## 🚀 Features

- **Queue-based Architecture**: Asynchronous task processing using BullMQ and Redis
- **Browser Automation**: Powered by Playwright for reliable cross-browser automation
- **HTTP API**: Simple REST endpoints for task submission and status checking
- **Observability**: Structured logging with Winston and health check endpoints
- **Scalability**: Horizontal scaling support with configurable concurrency
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Docker Support**: Containerized deployment with Docker Compose
- **Graceful Shutdown**: Proper resource cleanup and lifecycle management

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ⚡ Quick Start

### Prerequisites

- **Node.js**: Version 18 or higher
- **Docker & Docker Compose**: For containerized deployment
- **Redis**: For job queue (can be run via Docker)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd playwright-runner
npm install
```

### 2. Start with Docker Compose (Recommended)

```bash
# Start the complete stack (app + Redis)
docker compose up

# Or run in development mode with hot reload
docker compose -f docker-compose.dev.yml up
```

### 3. Submit Your First Task

```bash
# Using curl to submit a simple screenshot task
curl -X POST http://localhost:3000/submit \
  -H "Content-Type: application/json" \
  -d '{
    "steps": [
      {"action": "goto", "url": "https://example.com"},
      {"action": "screenshot", "path": "my-screenshot.png"}
    ],
    "browser": "chromium",
    "timeout": 15000
  }'
```

### 4. Check Task Status

```bash
# Check job status (replace with actual job ID from response)
curl http://localhost:3000/status/1
```

That's it! 🎉 Your first browser automation task is running.

## 🛠 Installation

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd playwright-runner

# Start with Docker Compose
docker compose up
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Start Redis server
docker run --name playwright-redis -p 6379:6379 -d redis:7.2

# Run in development mode
npm run dev
```

### Option 3: Production Build

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 📖 Usage

### HTTP API (Simple & Recommended)

The easiest way to use Playwright Runner is through the HTTP API:

```bash
# Check service health
curl http://localhost:3000/health

# Submit a task
curl -X POST http://localhost:3000/submit \
  -H "Content-Type: application/json" \
  -d @task.json

# Check job status
curl http://localhost:3000/status/{jobId}
```

### Task Definition

Create a JSON file defining your automation steps:

```json
{
  "steps": [
    {"action": "goto", "url": "https://example.com"},
    {"action": "waitForSelector", "selector": "h1"},
    {"action": "click", "selector": "button#submit"},
    {"action": "fill", "selector": "input[name='email']", "value": "test@example.com"},
    {"action": "screenshot", "path": "result.png"}
  ],
  "browser": "chromium",
  "timeout": 30000
}
```

### Supported Actions

| Action | Description | Parameters |
|--------|-------------|------------|
| `goto` | Navigate to URL | `url`, `timeout?` |
| `click` | Click element | `selector`, `timeout?` |
| `fill` | Fill input field | `selector`, `value`, `timeout?` |
| `waitForSelector` | Wait for element | `selector`, `state?`, `timeout?` |
| `screenshot` | Take screenshot | `path?`, `fullPage?` |
| `type` | Type text | `selector`, `text`, `delay?` |
| `select` | Select option | `selector`, `value` |
| `hover` | Hover over element | `selector`, `timeout?` |

### Programmatic Usage (Advanced)

For programmatic access, you can interact directly with the Redis queue:

```javascript
const { Queue } = require('bullmq');

const queue = new Queue('playwright-jobs', {
  connection: { host: 'localhost', port: 6379 }
});

// Submit task
const job = await queue.add('browser-task', {
  steps: [
    { action: 'goto', url: 'https://example.com' },
    { action: 'screenshot', path: 'screenshot.png' }
  ],
  browser: 'chromium',
  timeout: 15000
});

console.log(`Job submitted: ${job.id}`);
```

## 🔌 API Reference

### Health Check

**GET** `/health`

Returns the service health status and system metrics.

```json
{
  "status": "healthy",
  "timestamp": 1700000000000,
  "queue": {
    "name": "playwright-jobs",
    "isConnected": true,
    "pendingJobs": 0
  },
  "worker": {
    "isRunning": true,
    "lastActive": 1700000000000
  }
}
```

### Submit Task

**POST** `/submit`

Submit a new automation task to the queue.

**Request Body:**
```json
{
  "steps": [
    {"action": "goto", "url": "https://example.com"}
  ],
  "browser": "chromium",
  "timeout": 15000
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "1",
  "message": "Task submitted successfully",
  "timestamp": 1703123456789
}
```

### Check Status

**GET** `/status/:jobId`

Check the status of a submitted job.

**Response:**
```json
{
  "id": "1",
  "status": "completed",
  "progress": 100,
  "result": {
    "success": true,
    "screenshots": ["screenshot.png"],
    "executionTime": 2500
  },
  "createdAt": 1703123456789,
  "completedAt": 1703123459289
}
```

## ⚙️ Configuration

Configuration is managed through environment variables and can be customized via `.env` file:

```env
# Application Settings
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Queue Settings
QUEUE_NAME=playwright-jobs
QUEUE_TIMEOUT=30000
QUEUE_ATTEMPTS=3

# Browser Configuration
BROWSER_HEADLESS=true
BROWSER_TIMEOUT=30000
```

### Configuration Structure

```typescript
interface Config {
  env: string;
  port: number;
  logLevel: string;
  queue: {
    name: string;
    redis: {
      host: string;
      port: number;
      password?: string;
    };
    defaultJobOptions: {
      attempts: number;
      removeOnComplete: { age: number };
      removeOnFail: { age: number };
      timeout: number;
    };
  };
  browser: {
    headless: boolean;
    defaultViewport: { width: number; height: number };
    args: string[];
    timeout: number;
  };
}
```

## 🏗 Architecture

Playwright Runner follows a producer-consumer architecture with clear separation of concerns:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│    HTTP     │───▶│   Queue     │
│ (curl/app)  │    │   Server    │    │ (BullMQ)    │
└─────────────┘    └─────────────┘    └─────────────┘
                                             │
                                             ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Browser    │◀───│   Runner    │◀───│  Consumer   │
│(Playwright) │    │   Engine    │    │   Worker    │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Key Components

- **HTTP Server**: Express.js server handling API requests
- **Queue System**: BullMQ with Redis for job persistence
- **Consumer Worker**: Processes jobs from the queue
- **Runner Engine**: Executes Playwright automation steps
- **Browser Manager**: Manages Playwright browser instances
- **Logger**: Winston-based structured logging
- **Health Monitor**: System health and metrics collection

### Data Flow

1. **Task Submission**: Client submits task via HTTP API
2. **Validation**: Task parameters are validated
3. **Queuing**: Valid tasks are added to Redis queue
4. **Processing**: Worker picks up job from queue
5. **Execution**: Runner creates browser and executes steps
6. **Completion**: Results are stored and client notified

## 🔧 Development

### Development Setup

```bash
# Install dependencies
npm install

# Start Redis
docker run --name redis -p 6379:6379 -d redis:7.2

# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

### Project Structure

```
src/
├── config/          # Configuration management
│   ├── browser.ts   # Browser configuration
│   ├── queue.ts     # Queue configuration
│   └── index.ts     # Main config loader
├── health/          # Health check server
│   └── server.ts    # Express health endpoint
├── logger/          # Logging system
│   └── index.ts     # Winston logger setup
├── queue/           # Queue management
│   ├── consumer.ts  # Job consumer logic
│   ├── producer.ts  # Job producer logic
│   └── index.ts     # Queue initialization
├── runner/          # Task execution
│   ├── browser.ts   # Browser lifecycle
│   ├── steps.ts     # Step execution engine
│   └── index.ts     # Main runner logic
├── types/           # TypeScript definitions
│   └── index.ts     # Shared types
├── utils/           # Utility functions
│   ├── filename.ts  # File naming utilities
│   ├── shutdown.ts  # Graceful shutdown
│   └── validation.ts# Input validation
└── index.ts         # Application entry point
```

### Adding New Actions

To add a new automation action:

1. **Define the action type** in `src/types/index.ts`:
```typescript
export interface NewAction {
  action: 'newAction';
  parameter: string;
  timeout?: number;
}
```

2. **Add to the union type**:
```typescript
export type AutomationStep = GotoAction | ClickAction | NewAction | ...;
```

3. **Implement the action** in `src/runner/steps.ts`:
```typescript
async function executeNewAction(page: Page, step: NewAction): Promise<void> {
  // Implementation here
}
```

4. **Add to the step executor**:
```typescript
export async function executeStep(page: Page, step: AutomationStep): Promise<void> {
  switch (step.action) {
    case 'newAction':
      return executeNewAction(page, step);
    // ... other cases
  }
}
```

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- queue.test.ts
```

### Test Structure

```
tests/
├── unit/
│   ├── queue.test.ts     # Queue functionality tests
│   └── runner.test.ts    # Runner engine tests
└── integration/
    └── job-flow.test.ts  # End-to-end job flow tests
```

### Writing Tests

Tests use Jest with mocking for external dependencies:

```typescript
// Example test
describe('Queue Producer', () => {
  it('should submit valid tasks', async () => {
    const task = {
      steps: [{ action: 'goto', url: 'https://example.com' }],
      browser: 'chromium',
      timeout: 15000
    };
    
    const result = await submitTask(task);
    expect(result).toHaveProperty('jobId');
  });
});
```

## 🚀 Deployment

### Docker Deployment

The recommended deployment method is using Docker:

```bash
# Build production image
docker build -t playwright-runner .

# Run with Docker Compose
docker compose up -d

# Check logs
docker compose logs -f
```

### Environment Variables

Set these environment variables for production:

```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### Scaling

For high-throughput scenarios:

1. **Horizontal Scaling**: Run multiple instances
2. **Load Balancing**: Use nginx or similar
3. **Redis Scaling**: Use Redis Cluster
4. **Monitoring**: Implement health checks

Example `docker-compose.prod.yml`:

```yaml
version: '3.8'
services:
  app:
    image: playwright-runner:latest
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
    depends_on:
      - redis
    
  redis:
    image: redis:7.2
    volumes:
      - redis_data:/data
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    depends_on:
      - app

volumes:
  redis_data:
```

## 📝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Use conventional commit messages
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [example-usage.md](example-usage.md) for detailed usage examples
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join project discussions for questions and ideas

## 🔗 Related Projects

- [Playwright](https://playwright.dev/) - Cross-browser automation library
- [BullMQ](https://docs.bullmq.io/) - Premium queue package for Redis
- [Redis](https://redis.io/) - In-memory data structure store

---

Happy automating! 🎭
