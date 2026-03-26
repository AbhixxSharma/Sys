# Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Environment
```bash
cp .env.example .env
```

The default settings work out of the box!

### Step 3: Start MongoDB
```bash
# Make sure MongoDB is running
# On Ubuntu/Debian:
sudo systemctl start mongod

# On macOS:
brew services start mongodb-community

# Or using Docker:
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 4: Start the Server
```bash
npm start
```

You should see:
```
╔════════════════════════════════════════════════╗
║  System Health Monitoring Platform             ║
║  Server running on port 3000                   ║
║  Environment: development                      ║
╚════════════════════════════════════════════════╝
📡 API Base URL: http://localhost:3000/api
🏥 Health Check: http://localhost:3000/api/health
📊 Dashboard: http://localhost:3000/api/dashboard
```

### Step 5: View the Dashboard

Open `dashboard.html` in your browser or visit the API endpoints:

**API Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Current Metrics:**
```bash
curl http://localhost:3000/api/metrics/current
```

**Dashboard Data:**
```bash
curl http://localhost:3000/api/dashboard
```

**Visual Dashboard:**
Open `dashboard.html` in your browser (make sure to allow CORS or use a local server)

## 📊 Testing the System

### 1. Trigger Manual Metrics Collection
```bash
curl -X POST http://localhost:3000/api/metrics/collect
```

### 2. View Historical Metrics
```bash
curl http://localhost:3000/api/metrics/history?hours=1
```

### 3. Check Active Alerts
```bash
curl http://localhost:3000/api/alerts/active
```

### 4. Run Custom Health Check
```bash
./src/scripts/health-check.sh
```

## 🎯 What Happens Next?

1. **Automatic Collection**: The system collects metrics every 30 seconds
2. **Alert Monitoring**: Alerts trigger when thresholds are exceeded
3. **Data Storage**: Metrics are stored in MongoDB for 7 days (auto-cleanup)
4. **Auto-Refresh**: Dashboard updates every 30 seconds

## 🔧 Configuration Tips

### Change Collection Interval
Edit `.env`:
```env
METRICS_COLLECTION_INTERVAL=60000  # Collect every 60 seconds
```

### Adjust Alert Thresholds
Edit `.env`:
```env
CPU_THRESHOLD=70        # Alert when CPU > 70%
MEMORY_THRESHOLD=80     # Alert when Memory > 80%
DISK_THRESHOLD=85       # Alert when Disk > 85%
```

### Change Data Retention
Edit `.env`:
```env
METRICS_RETENTION_DAYS=30  # Keep data for 30 days
```

## 🎨 Using the Web Dashboard

1. Open `dashboard.html` in your browser
2. The dashboard auto-refreshes every 30 seconds
3. Click "Refresh" button for manual update
4. Color-coded alerts: 🟢 Healthy | 🟡 Warning | 🔴 Critical

## 📱 API Examples

### Get Aggregated Metrics (Last 24 Hours)
```bash
curl "http://localhost:3000/api/metrics/aggregated?hours=24"
```

### Acknowledge an Alert
```bash
curl -X POST http://localhost:3000/api/alerts/ALERT_ID/acknowledge \
  -H "Content-Type: application/json" \
  -d '{"acknowledgedBy": "admin@example.com"}'
```

## 🐛 Troubleshooting

**Problem**: "MongoDB connection error"
- **Solution**: Make sure MongoDB is running: `sudo systemctl status mongod`

**Problem**: "Port 3000 already in use"
- **Solution**: Change PORT in `.env` file or kill the process using port 3000

**Problem**: Dashboard shows "Error loading"
- **Solution**: Check if API server is running and CORS is enabled

**Problem**: No metrics being collected
- **Solution**: Check logs and ensure sufficient permissions for system info access

## ✅ Success Checklist

- [ ] MongoDB is running
- [ ] Dependencies installed (`npm install`)
- [ ] Server started (`npm start`)
- [ ] API health check passes
- [ ] Metrics are being collected (check `/api/metrics/current`)
- [ ] Dashboard displays data

## 🎓 Next Steps

1. Explore all API endpoints in the README
2. Customize alert thresholds for your needs
3. Add custom health checks to `health-check.sh`
4. Set up production deployment with PM2
5. Integrate notification services (Slack, email, etc.)

---

**Need Help?** Check the full README.md for detailed documentation.
