# Playwright Runner - User Guide

This guide shows you how to use the Playwright Runner as an end user to automate browser tasks.

## What is Playwright Runner?

Playwright Runner is a service that executes browser automation tasks using a queue-based system. You submit tasks to a Redis queue, and the service processes them using Playwright to control real browsers.

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Basic understanding of JSON format

### 1. Start the Service

```bash
# Navigate to the project directory
cd playwright-runner

# Start the service with Redis
docker compose -f docker-compose.dev.yml up
```

The service will start on port 3000 with Redis on port 6379.

### 2. Submit Your First Task

```bash
# Submit a simple task using curl
curl -X POST http://localhost:3000/submit \
  -H "Content-Type: application/json" \
  -d '{
    "steps": [
      {"action": "goto", "url": "https://example.com"},
      {"action": "screenshot", "path": "my-first-screenshot.png"}
    ],
    "browser": "chromium",
    "timeout": 15000
  }'
```

That's it! You'll get a response with a job ID, and you can check the status:

```bash
# Check job status (replace 1 with your job ID)
curl http://localhost:3000/status/1
```

## HTTP API (New! 🚀)

You can now submit tasks using simple HTTP requests with curl! This is the easiest way to use Playwright Runner.

### Available Endpoints

- `GET /health` - Check service health
- `POST /submit` - Submit automation task
- `GET /status/:jobId` - Check job status

### Quick curl Examples

```bash
# Check if service is running
curl http://localhost:3000/health

# Submit a simple task
curl -X POST http://localhost:3000/submit \
  -H "Content-Type: application/json" \
  -d '{
    "steps": [
      {"action": "goto", "url": "https://example.com"},
      {"action": "screenshot", "path": "test.png"}
    ],
    "browser": "chromium",
    "timeout": 15000
  }'

# Check job status (replace 1 with actual job ID)
curl http://localhost:3000/status/1
```

### Windows PowerShell Examples

```powershell
# Submit task using PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/submit" -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"steps":[{"action":"goto","url":"https://example.com"},{"action":"screenshot","path":"test.png"}],"browser":"chromium","timeout":15000}'

# Check health
curl http://localhost:3000/health
```

For more detailed curl examples, see [`examples/curl/curl-examples.md`](examples/curl/curl-examples.md).

## Alternative Methods

If you prefer programmatic access or need more control, you can also use:



```bash
# Simple example
curl -X POST http://localhost:3000/submit \
  -H "Content-Type: application/json" \
  -d '{
    "steps": [
      {"action": "goto", "url": "https://example.com"},
      {"action": "waitForSelector", "selector": "h1"},
      {"action": "screenshot", "path": "example-screenshot.png"}
    ],
    "browser": "chromium",
    "timeout": 30000
  }'
```

Response:
```json
{
  "success": true,
  "jobId": "1",
  "message": "Task submitted successfully",
  "timestamp": 1703123456789
}
```

Check status:
```bash
curl http://localhost:3000/status/1
```

#### Option B: Using Node.js

Create a simple script `examples/scripts/submit-task.js`:

```javascript
const { Queue } = require('bullmq');
const fs = require('fs');

async function submitTask() {
  // Connect to the Redis queue
  const queue = new Queue('playwright-jobs', {
    connection: {
      host: 'localhost',
      port: 6379
    }
  });

  try {
    // Read your task
    const task = JSON.parse(fs.readFileSync('my-task.json', 'utf-8'));
    
    // Submit the task
    const job = await queue.add('browser-task', task);
    
    console.log(`Task submitted successfully! Job ID: ${job.id}`);
    
    // Wait for completion (optional)
    const result = await job.waitUntilFinished(queue.events, 60000);
    console.log('Task completed:', result);
    
  } catch (error) {
    console.error('Error submitting task:', error);
  } finally {
    await queue.close();
  }
}

submitTask();
```

Run it:
```bash
npm install bullmq ioredis
node examples/scripts/submit-task.js
```

## Available Actions

### 1. Navigation
```json
{"action": "goto", "url": "https://example.com", "timeout": 10000}
```

### 2. Wait for Elements
```json
{"action": "waitForSelector", "selector": ".my-element", "state": "visible", "timeout": 5000}
```

### 3. Click Elements
```json
{"action": "click", "selector": "button#submit", "timeout": 3000}
```

### 4. Fill Forms
```json
{"action": "fill", "selector": "input[name='username']", "value": "myusername"}
```

### 5. Take Screenshots

**Basic screenshot (auto-generated unique filename in target/ directory):**
```json
{"action": "screenshot", "fullPage": true}
```
Result: `target/screenshot-20250831-144048-a996489f.png`

**Screenshot with fixed filename (auto-converted to unique in target/ directory):**
```json
{"action": "screenshot", "path": "example-screenshot.png", "fullPage": true}
```
Result: `target/example-screenshot-20250831-144003-a3b4f6e7.png`

**Screenshot with custom filename (preserved filename in target/ directory):**
```json
{"action": "screenshot", "path": "my-custom-report-2025.png", "fullPage": false}
```
Result: `target/my-custom-report-2025.png`

## 📁 Organized Examples

All examples are now organized in the `examples/` directory:

- **`examples/tasks/`** - JSON task definition files
- **`examples/curl/`** - cURL documentation and examples  
- **`examples/scripts/`** - Helper scripts for automation

See [`examples/README.md`](examples/README.md) for a complete overview.

## Real-World Examples

### Example 1: Login and Screenshot
```json
{
  "steps": [
    {"action": "goto", "url": "https://example.com/login"},
    {"action": "fill", "selector": "input[name='email']", "value": "user@example.com"},
    {"action": "fill", "selector": "input[name='password']", "value": "mypassword"},
    {"action": "click", "selector": "button[type='submit']"},
    {"action": "waitForSelector", "selector": ".dashboard"},
    {"action": "screenshot", "path": "dashboard.png"}
  ],
  "browser": "chromium",
  "timeout": 60000
}
```

### Example 2: Web Scraping
```json
{
  "steps": [
    {"action": "goto", "url": "https://news.ycombinator.com"},
    {"action": "waitForSelector", "selector": ".titlelink"},
    {"action": "screenshot", "path": "hackernews.png", "fullPage": true}
  ],
  "browser": "firefox",
  "timeout": 15000
}
```

### Example 3: Form Testing
```json
{
  "steps": [
    {"action": "goto", "url": "https://httpbin.org/forms/post"},
    {"action": "fill", "selector": "input[name='custname']", "value": "John Doe"},
    {"action": "fill", "selector": "input[name='custtel']", "value": "555-1234"},
    {"action": "fill", "selector": "input[name='custemail']", "value": "john@example.com"},
    {"action": "click", "selector": "input[type='submit']"},
    {"action": "waitForSelector", "selector": "pre"},
    {"action": "screenshot", "path": "form-result.png"}
  ],
  "browser": "webkit",
  "timeout": 30000
}
```

## Configuration Options

### Browser Types
- `chromium` (default) - Google Chrome/Chromium
- `firefox` - Mozilla Firefox
- `webkit` - Safari WebKit

### Timeout Settings
- Global timeout: Set at task level (applies to entire task)
- Step timeout: Set per action (overrides global timeout for that step)

### Screenshot Options
- `path`: Where to save the screenshot (optional, saved in `target/` directory)
- `fullPage`: Capture entire page (default: false)

**Automatic Unique Filename Generation & Target Directory:**
All screenshots are automatically saved to the `target/` directory with unique filenames:

- **No path specified**: Generates `target/screenshot-YYYYMMDD-HHMMSS-randomhex.png`
- **Common fixed names** (like `example-screenshot.png`, `test-screenshot.png`): Automatically converted to unique names like `target/example-screenshot-YYYYMMDD-HHMMSS-randomhex.png`
- **Custom filenames**: Preserved filename but still saved in `target/` directory as `target/your-custom-name.png`

The `target/` directory is automatically created if it doesn't exist.

Example logs showing automatic filename generation:
```
info: Screenshot captured {
  "originalPath": "example-screenshot.png",
  "path": "target/example-screenshot-20250831-144003-a3b4f6e7.png",
  "size": 25026
}
```

## Advanced Usage

### Using with Python
```python
import redis
import json
import uuid

def submit_playwright_task(task_data):
    r = redis.Redis(host='localhost', port=6379, db=0)
    
    job_id = str(uuid.uuid4())
    job_data = {
        'id': job_id,
        'name': 'browser-task',
        'data': task_data,
        'opts': {}
    }
    
    r.lpush('bull:playwright-jobs:waiting', json.dumps(job_data))
    print(f"Task submitted with ID: {job_id}")
    return job_id

# Example usage
task = {
    "steps": [
        {"action": "goto", "url": "https://example.com"},
        {"action": "screenshot", "path": "python-screenshot.png"}
    ],
    "browser": "chromium",
    "timeout": 15000
}

submit_playwright_task(task)
```

### Monitoring Tasks

Check the service logs to monitor task execution:
```bash
docker logs playwright-runner-runner-1 -f
```

You'll see output like:
```
Received job for processing { jobId: '123', attempts: 0 }
Starting task execution { browser: 'chromium', stepsCount: 3 }
Executing step 1 { action: 'goto' }
Completed step 1 { action: 'goto' }
Task execution completed successfully
```

## Error Handling

Common issues and solutions:

1. **Invalid selector**: Make sure CSS selectors are correct
2. **Timeout errors**: Increase timeout values or check if elements exist
3. **Navigation failed**: Verify URLs are accessible
4. **Browser launch failed**: Ensure Docker has enough resources

## Tips for Success

1. **Use specific selectors**: Prefer IDs and unique classes over generic selectors
2. **Add wait conditions**: Always wait for elements before interacting
3. **Set reasonable timeouts**: Balance between speed and reliability
4. **Test incrementally**: Start with simple tasks and build complexity
5. **Monitor logs**: Watch service logs to debug issues

## Production Considerations

For production use:
1. Use authentication for Redis
2. Set up proper monitoring
3. Handle failures gracefully
4. Scale workers based on load
5. Use environment-specific configurations

This guide gives you everything you need to start automating browser tasks with Playwright Runner!