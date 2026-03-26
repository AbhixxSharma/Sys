const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  hostname: {
    type: String,
    required: true,
    index: true
  },
  alertType: {
    type: String,
    enum: ['CPU', 'MEMORY', 'DISK', 'NETWORK', 'CUSTOM'],
    required: true
  },
  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'CRITICAL'],
    default: 'WARNING'
  },
  message: {
    type: String,
    required: true
  },
  value: Number,
  threshold: Number,
  status: {
    type: String,
    enum: ['ACTIVE', 'RESOLVED', 'ACKNOWLEDGED'],
    default: 'ACTIVE'
  },
  triggeredAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date,
  acknowledgedAt: Date,
  acknowledgedBy: String,
  lastNotifiedAt: Date
}, {
  timestamps: true
});

// Index for finding active alerts
alertSchema.index({ hostname: 1, status: 1, alertType: 1 });

// Method to check if alert is in cooldown period
alertSchema.methods.isInCooldown = function() {
  if (!this.lastNotifiedAt) return false;
  
  const cooldownMinutes = parseInt(process.env.ALERT_COOLDOWN_MINUTES) || 5;
  const cooldownMs = cooldownMinutes * 60 * 1000;
  const timeSinceLastNotification = Date.now() - this.lastNotifiedAt.getTime();
  
  return timeSinceLastNotification < cooldownMs;
};

module.exports = mongoose.model('Alert', alertSchema);
