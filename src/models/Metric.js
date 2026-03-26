const mongoose = require('mongoose');

const metricSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
    expires: process.env.METRICS_RETENTION_DAYS * 24 * 60 * 60 || 604800 // 7 days default
  },
  hostname: {
    type: String,
    required: true,
    index: true
  },
  cpu: {
    usage: Number,
    cores: Number,
    model: String,
    speed: Number
  },
  memory: {
    total: Number,
    used: Number,
    free: Number,
    usagePercentage: Number
  },
  disk: [{
    filesystem: String,
    size: Number,
    used: Number,
    available: Number,
    usagePercentage: Number,
    mountpoint: String
  }],
  network: {
    bytesIn: Number,
    bytesOut: Number,
    packetsIn: Number,
    packetsOut: Number
  },
  uptime: Number,
  loadAverage: {
    one: Number,
    five: Number,
    fifteen: Number
  },
  processes: {
    total: Number,
    running: Number,
    blocked: Number
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
metricSchema.index({ hostname: 1, timestamp: -1 });

module.exports = mongoose.model('Metric', metricSchema);
