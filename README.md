# System Health Monitoring Platform

A comprehensive, automated system health monitoring solution built with Node.js, Express, and MongoDB.

## 🎯 Features

- **Real-time Monitoring**: Tracks CPU, memory, disk, and network metrics
- **Parallel Processing**: Uses Node.js child processes for efficient data collection
- **Smart Alerting**: Hierarchical alert system with cooldown periods to prevent alert fatigue
- **Time-Series Data**: MongoDB with TTL indexes for automatic data cleanup
- **RESTful API**: Complete API for metrics collection and alert management
- **Custom Health Checks**: Shell scripts for application-specific monitoring
- **Scalable Architecture**: Production-ready design

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/system-health-monitor
METRICS_COLLECTION_INTERVAL=30000
METRICS_RETENTION_DAYS=7
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=90
```

### 3. Start MongoDB

Make sure MongoDB is running:

```bash
# On Ubuntu/Debian
sudo systemctl start mongod

# On macOS with Homebrew
brew services start mongodb-community

# Or run directly
mongod --dbpath /path/to/data
```

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### Health & Status

#### GET `/api/health`
Check if the API is running

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-02-05T10:30:00Z",
  "uptime": 3600,
  "mongodb": "connected"
}
```

#### GET `/api/dashboard`
Get complete dashboard overview

**Response:**
```json
{
  "success": true,
  "data": {
    "current": { /* current metrics */ },
    "alerts": {
      "active": 2,
      "critical": 1,
      "warning": 1,
      "list": [ /* alert objects */ ]
    },
    "statistics": {
      "totalMetricsStored": 5000,
      "lastCollection": "2024-02-05T10:30:00Z",
      "uptime": 3600
    }
  }
}
```

### Metrics

#### GET `/api/metrics/current`
Get current system metrics

**Response:**
```json
{
  "success": true,
  "data": {
    "hostname": "server-01",
    "timestamp": "2024-02-05T10:30:00Z",
    "cpu": {
      "usage": 45.2,
      "cores": 8,
      "model": "Intel Core i7",
      "speed": 3.6
    },
    "memory": {
      "total": 16777216000,
      "used": 8388608000,
      "free": 8388608000,
      "usagePercentage": 50.0
    },
    "disk": [ /* disk info */ ],
    "network": { /* network stats */ },
    "uptime": 86400,
    "loadAverage": {
      "one": 1.5,
      "five": 1.2,
      "fifteen": 0.8
    }
  }
}
```

#### GET `/api/metrics/history`
Get historical metrics

**Query Parameters:**
- `hostname` (optional): Filter by hostname
- `hours` (default: 24): Number of hours to look back
- `limit` (default: 1000): Maximum results

**Example:**
```
GET /api/metrics/history?hours=12&limit=500
```

#### GET `/api/metrics/aggregated`
Get aggregated metrics (averages over time)

**Query Parameters:**
- `hostname` (optional): Filter by hostname
- `hours` (default: 1): Time period

**Example:**
```
GET /api/metrics/aggregated?hours=24
```

#### POST `/api/metrics/collect`
Manually trigger metrics collection

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": { /* collected metrics */ },
    "alertsTriggered": 1,
    "alerts": [ /* triggered alerts */ ]
  }
}
```

### Alerts

#### GET `/api/alerts/active`
Get all active alerts

**Query Parameters:**
- `hostname` (optional): Filter by hostname

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "abc123",
      "hostname": "server-01",
      "alertType": "CPU",
      "severity": "WARNING",
      "message": "CPU usage is high: 85%",
      "value": 85,
      "threshold": 80,
      "status": "ACTIVE",
      "triggeredAt": "2024-02-05T10:00:00Z"
    }
  ]
}
```

#### GET `/api/alerts/history`
Get alert history

**Query Parameters:**
- `hostname` (optional): Filter by hostname
- `limit` (default: 100): Maximum results

#### POST `/api/alerts/:id/acknowledge`
Acknowledge an alert

**Request Body:**
```json
{
  "acknowledgedBy": "admin@example.com"
}
```

## 🔧 Architecture

### Component Overview

```
┌─────────────────────────────────────────────────┐
│                 Express API Server               │
│                  (REST Endpoints)                │
└────────────┬────────────────────────┬────────────┘
             │                        │
             ▼                        ▼
    ┌────────────────┐      ┌────────────────────┐
    │ Metrics        │      │ Alert Manager      │
    │ Collector      │      │ (Hierarchical      │
    │ (Child Process)│      │  Alerting)         │
    └────────┬───────┘      └─────────┬──────────┘
             │                        │
             ▼                        ▼
    ┌────────────────────────────────────────────┐
    │          MongoDB Database                   │
    │   - Metrics Collection (TTL Index)          │
    │   - Alerts Collection                       │
    └────────────────────────────────────────────┘
```

### Key Components

1. **Metrics Collector** (`src/collectors/metricsCollector.js`)
   - Uses child processes for parallel metric collection
   - Non-blocking system monitoring
   - Collects CPU, memory, disk, network, and process stats

2. **Metrics Worker** (`src/collectors/metricsWorker.js`)
   - Dedicated worker process for system information gathering
   - Uses `systeminformation` library for accurate metrics

3. **Alert Manager** (`src/utils/alertManager.js`)
   - Monitors metrics against configurable thresholds
   - Implements alert cooldown to prevent spam
   - Hierarchical severity levels (INFO, WARNING, CRITICAL)
   - Auto-resolves alerts when metrics return to normal

4. **MongoDB Models**
   - **Metric Model**: TTL-indexed time-series data
   - **Alert Model**: Alert tracking with status management

5. **Express API Server** (`src/api/server.js`)
   - RESTful API endpoints
   - Scheduled metrics collection using cron
   - Real-time and historical data access

## 📊 Monitoring Schedule

By default, the system:
- Collects metrics every **30 seconds** (configurable via `METRICS_COLLECTION_INTERVAL`)
- Retains metrics for **7 days** (configurable via `METRICS_RETENTION_DAYS`)
- Checks alerts every collection cycle
- Enforces **5-minute cooldown** between duplicate alerts (configurable via `ALERT_COOLDOWN_MINUTES`)

## 🔔 Alert Thresholds

Default thresholds (configurable in `.env`):
- **CPU**: 80% (WARNING), 95% (CRITICAL)
- **Memory**: 85% (WARNING), 95% (CRITICAL)
- **Disk**: 90% (WARNING), 98% (CRITICAL)

## 🛠️ Custom Health Checks

Run the custom health check script:

```bash
./src/scripts/health-check.sh
```

This script checks:
- Port availability (MongoDB, API)
- Disk space usage
- System load average
- Memory usage

## 📝 Project Structure

```
system-health-monitor/
├── src/
│   ├── api/
│   │   └── server.js           # Express API server
│   ├── collectors/
│   │   ├── metricsCollector.js # Main collector
│   │   └── metricsWorker.js    # Worker process
│   ├── models/
│   │   ├── Metric.js           # Metric schema
│   │   └── Alert.js            # Alert schema
│   ├── utils/
│   │   └── alertManager.js     # Alert management
│   └── scripts/
│       └── health-check.sh     # Custom checks
├── config/                      # Configuration files
├── logs/                        # Log files
├── .env.example                 # Environment template
├── package.json
└── README.md
```

## 🔒 Security Considerations

- Ensure MongoDB is properly secured with authentication
- Use environment variables for sensitive configuration
- Implement API authentication for production (not included in this version)
- Restrict network access to monitoring endpoints
- Regularly update dependencies

## 🚀 Production Deployment

### Using PM2 (Recommended)

```bash
npm install -g pm2

# Start application
pm2 start src/api/server.js --name "health-monitor"

# Enable auto-restart on system boot
pm2 startup
pm2 save

# Monitor logs
pm2 logs health-monitor

# Monitor status
pm2 status
```

### Using Docker (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t health-monitor .
docker run -p 3000:3000 --env-file .env health-monitor
```

## 📈 Extending the Platform

### Adding Custom Metrics

Edit `src/collectors/metricsWorker.js` and add your custom data collection logic.

### Adding Custom Alerts

Edit `src/utils/alertManager.js` and add new alert conditions in the `checkMetrics` method.

### Integrating Notifications

Add notification services (email, Slack, PagerDuty) in the `createOrUpdateAlert` method:

```javascript
// Example: Send Slack notification
const sendSlackAlert = async (alert) => {
  // Implement Slack webhook integration
};
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB is running: `sudo systemctl status mongod`
- Check connection string in `.env`

### High CPU Usage
- Adjust `METRICS_COLLECTION_INTERVAL` to reduce frequency
- Check for memory leaks in long-running processes

### Missing Metrics
- Ensure proper permissions for system information access
- Check logs for errors: `tail -f logs/app.log`

## 📚 Additional Resources

- [Node.js Documentation](https://nodejs.org/docs)
- [Express.js Guide](https://expressjs.com/guide)
- [MongoDB Manual](https://docs.mongodb.com/manual)
- [systeminformation Documentation](https://systeminformation.io)

## 📄 License

MIT License - feel free to use this project for learning and production purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

---

**Built with ❤️ for reliable system monitoring**
