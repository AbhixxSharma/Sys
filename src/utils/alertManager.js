const Alert = require('../models/Alert');

class AlertManager {
  constructor() {
    this.thresholds = {
      cpu: parseInt(process.env.CPU_THRESHOLD) || 80,
      memory: parseInt(process.env.MEMORY_THRESHOLD) || 85,
      disk: parseInt(process.env.DISK_THRESHOLD) || 90
    };
  }

  // Check metrics against thresholds and create alerts
  async checkMetrics(metrics) {
    const alerts = [];

    // Check CPU usage
    if (metrics.cpu.usage > this.thresholds.cpu) {
      alerts.push(await this.createOrUpdateAlert({
        hostname: metrics.hostname,
        alertType: 'CPU',
        severity: metrics.cpu.usage > 95 ? 'CRITICAL' : 'WARNING',
        message: `CPU usage is high: ${metrics.cpu.usage}%`,
        value: metrics.cpu.usage,
        threshold: this.thresholds.cpu
      }));
    } else {
      await this.resolveAlert(metrics.hostname, 'CPU');
    }

    // Check Memory usage
    if (metrics.memory.usagePercentage > this.thresholds.memory) {
      alerts.push(await this.createOrUpdateAlert({
        hostname: metrics.hostname,
        alertType: 'MEMORY',
        severity: metrics.memory.usagePercentage > 95 ? 'CRITICAL' : 'WARNING',
        message: `Memory usage is high: ${metrics.memory.usagePercentage}%`,
        value: metrics.memory.usagePercentage,
        threshold: this.thresholds.memory
      }));
    } else {
      await this.resolveAlert(metrics.hostname, 'MEMORY');
    }

    // Check Disk usage
    for (const disk of metrics.disk) {
      if (disk.usagePercentage > this.thresholds.disk) {
        alerts.push(await this.createOrUpdateAlert({
          hostname: metrics.hostname,
          alertType: 'DISK',
          severity: disk.usagePercentage > 98 ? 'CRITICAL' : 'WARNING',
          message: `Disk usage is high on ${disk.mountpoint}: ${disk.usagePercentage}%`,
          value: disk.usagePercentage,
          threshold: this.thresholds.disk
        }));
      }
    }

    return alerts.filter(a => a !== null);
  }

  // Create alert or update existing one (prevents duplicates and alert fatigue)
  async createOrUpdateAlert(alertData) {
    try {
      // Check if there's an active alert of the same type
      const existingAlert = await Alert.findOne({
        hostname: alertData.hostname,
        alertType: alertData.alertType,
        status: 'ACTIVE'
      });

      if (existingAlert) {
        // Check if in cooldown period
        if (existingAlert.isInCooldown()) {
          return null; // Don't create duplicate notification
        }

        // Update last notification time
        existingAlert.lastNotifiedAt = new Date();
        existingAlert.value = alertData.value;
        existingAlert.severity = alertData.severity;
        await existingAlert.save();
        return existingAlert;
      }

      // Create new alert
      const newAlert = new Alert({
        ...alertData,
        lastNotifiedAt: new Date()
      });
      await newAlert.save();
      
      console.log(`🚨 ALERT: ${alertData.severity} - ${alertData.message}`);
      return newAlert;
    } catch (error) {
      console.error('Error creating/updating alert:', error);
      return null;
    }
  }

  // Resolve alert when metric returns to normal
  async resolveAlert(hostname, alertType) {
    try {
      const alert = await Alert.findOne({
        hostname,
        alertType,
        status: 'ACTIVE'
      });

      if (alert) {
        alert.status = 'RESOLVED';
        alert.resolvedAt = new Date();
        await alert.save();
        console.log(`✅ RESOLVED: ${alertType} alert for ${hostname}`);
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  }

  // Get all active alerts
  async getActiveAlerts(hostname = null) {
    const query = { status: 'ACTIVE' };
    if (hostname) query.hostname = hostname;
    
    return await Alert.find(query).sort({ triggeredAt: -1 });
  }

  // Get alert history
  async getAlertHistory(hostname = null, limit = 100) {
    const query = {};
    if (hostname) query.hostname = hostname;
    
    return await Alert.find(query)
      .sort({ triggeredAt: -1 })
      .limit(limit);
  }
}

module.exports = new AlertManager();
