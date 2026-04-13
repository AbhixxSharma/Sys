require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

const metricsCollector = require('../collectors/metricsCollector');
const alertManager = require('../utils/alertManager');
const Metric = require('../models/Metric');
const Alert = require('../models/Alert');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/system-health-monitor', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log(' MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Get current system metrics
app.get('/api/metrics/current', async (req, res) => {
  try {
    const metrics = await metricsCollector.collectAllMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get historical metrics
app.get('/api/metrics/history', async (req, res) => {
  try {
    const { hostname, hours = 24, limit = 1000 } = req.query;
    
    const query = {};
    if (hostname) query.hostname = hostname;
    
    const startTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    query.timestamp = { $gte: startTime };

    const metrics = await Metric.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: metrics.length,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get aggregated metrics (averages over time)
app.get('/api/metrics/aggregated', async (req, res) => {
  try {
    const { hostname, hours = 1 } = req.query;
    
    const startTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    const matchQuery = { timestamp: { $gte: startTime } };
    if (hostname) matchQuery.hostname = hostname;

    const aggregated = await Metric.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          avgCpuUsage: { $avg: '$cpu.usage' },
          maxCpuUsage: { $max: '$cpu.usage' },
          avgMemoryUsage: { $avg: '$memory.usagePercentage' },
          maxMemoryUsage: { $max: '$memory.usagePercentage' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      period: `Last ${hours} hour(s)`,
      data: aggregated[0] || {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/alerts/active', async (req, res) => {
  try {
    const { hostname } = req.query;
    const alerts = await alertManager.getActiveAlerts(hostname);
    
    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/alerts/history', async (req, res) => {
  try {
    const { hostname, limit = 100 } = req.query;
    const alerts = await alertManager.getAlertHistory(hostname, parseInt(limit));
    
    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Acknowledge an alert
app.post('/api/alerts/:id/acknowledge', async (req, res) => {
  try {
    const { acknowledgedBy } = req.body;
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy || 'Unknown';
    await alert.save();

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get system overview/dashboard data
app.get('/api/dashboard', async (req, res) => {
  try {
    const currentMetrics = await metricsCollector.collectAllMetrics();
    const activeAlerts = await alertManager.getActiveAlerts();
    
    // Get latest stored metric
    const latestMetric = await Metric.findOne().sort({ timestamp: -1 });
    
    // Count total metrics
    const totalMetrics = await Metric.countDocuments();

    res.json({
      success: true,
      data: {
        current: currentMetrics,
        alerts: {
          active: activeAlerts.length,
          critical: activeAlerts.filter(a => a.severity === 'CRITICAL').length,
          warning: activeAlerts.filter(a => a.severity === 'WARNING').length,
          list: activeAlerts
        },
        statistics: {
          totalMetricsStored: totalMetrics,
          lastCollection: latestMetric?.timestamp,
          uptime: process.uptime()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manual trigger for metrics collection
app.post('/api/metrics/collect', async (req, res) => {
  try {
    const metrics = await metricsCollector.collectAllMetrics();
    
    // Save to database
    const metricDoc = new Metric(metrics);
    await metricDoc.save();
    
    // Check for alerts
    const alerts = await alertManager.checkMetrics(metrics);

    res.json({
      success: true,
      data: {
        metrics,
        alertsTriggered: alerts.length,
        alerts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// Collect metrics every 30 seconds (or based on env variable)
const collectionInterval = parseInt(process.env.METRICS_COLLECTION_INTERVAL) || 30000;
const cronExpression = `*/${Math.floor(collectionInterval / 1000)} * * * * *`;

cron.schedule(cronExpression, async () => {
  try {
    console.log(`Collecting metrics at ${new Date().toISOString()}`);
    
    const metrics = await metricsCollector.collectAllMetrics();
    s
    // Save to database
    const metricDoc = new Metric(metrics);
    await metricDoc.save();
    
    // Check for alerts
    await alertManager.checkMetrics(metrics);
  } catch (error) {
    console.error('Error in scheduled metrics collection:', error);
  }
});

console.log(`⏰ Scheduled metrics collection every ${collectionInterval / 1000} seconds`);

// ==================== ERROR HANDLING ====================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║  System Health Monitoring Platform             ║
║  Server running on port ${PORT}                    ║
║  Environment: ${process.env.NODE_ENV || 'development'}                    ║
╚════════════════════════════════════════════════╝
  `);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard\n`);
});

module.exports = app;
