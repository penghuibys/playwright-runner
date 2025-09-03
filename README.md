# Playwright Runner

A secure, scalable browser automation engine built on Playwright. Execute browser automation tasks through a queue-based architecture with Redis persistence and structured logging.

## 🚀 Key Features

- **Queue-based Architecture**: Asynchronous task processing using BullMQ and Redis
- **HTTP API**: Simple REST endpoints for task submission and status checking
- **Browser Automation**: Powered by Playwright for reliable cross-browser automation
- **Observability**: Structured logging and health monitoring
- **Docker Support**: Containerized deployment with horizontal scaling
- **Type Safety**: Full TypeScript implementation

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

### 1. Start the Service

```bash
git clone <repository-url>
cd playwright-runner

# Start with Docker Compose (recommended)
docker compose up
```

### 2. Submit a Task

```bash
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

### 3. Check Status

```bash
# Replace {jobId} with the ID from the submit response
curl http://localhost:3000/status/{jobId}
```

## 📖 Usage

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

### Example Task

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

**GET** `/health` - Returns service status

### Submit Task

**POST** `/submit` - Submit automation task

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

**GET** `/status/:jobId` - Get job status and results

**Response:**
```json
{
  "id": "1",
  "status": "completed",
  "progress": 100,
  "result": {
    "status": "completed",
    "stepsExecuted": 2,
    "duration": 2500
  }
}
```

## ⚙️ Configuration

Configure via environment variables:

```env
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Browser
BROWSER_HEADLESS=true
BROWSER_TIMEOUT=30000
```

## 🏗 Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│    HTTP     │───▶│   Queue     │
│             │    │   Server    │    │ (BullMQ)    │
└─────────────┘    └─────────────┘    └─────────────┘
                                             │
                                             ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Browser    │◀───│   Runner    │◀───│  Consumer   │
│(Playwright) │    │   Engine    │    │   Worker    │
└─────────────┘    └─────────────┘    └─────────────┘
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

## 🔧 Development

```bash
# Install dependencies
npm install

# Start Redis
docker run --name redis -p 6379:6379 -d redis:7.2

# Run in development mode
npm run dev

# Run tests
npm test
```

## 🚀 Deployment

### Production with Docker

```bash
# Build and run
docker build -t playwright-runner .
docker compose up -d
```

### Scaling

For high-throughput scenarios, run multiple instances with load balancing.

## 📚 Documentation

- **Detailed Examples**: See [`example-usage.md`](example-usage.md) for comprehensive usage guide
- **cURL Examples**: See [`examples/curl/`](examples/curl/) for HTTP API examples
- **Scripts**: See [`examples/scripts/`](examples/scripts/) for automation scripts

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

🎭 **Ready to automate?** Check out [`example-usage.md`](example-usage.md) for detailed examples and use cases.
---

Happy automating! 🎭