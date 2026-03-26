const { fork } = require('child_process');
const path = require('path');
const os = require('os');

class MetricsCollector {
  constructor() {
    this.maxWorkers = os.cpus().length;
  }

  async collectMetrics() {
    return new Promise((resolve, reject) => {
      const workerPath = path.join(__dirname, 'metricsWorker.js');
      const worker = fork(workerPath);

      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          worker.kill();
          reject(new Error('Metrics collection timeout (worker took too long)'));
        }
      }, 15000); // 15 seconds timeout

      worker.on('message', (metrics) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          worker.kill();
          resolve(metrics);
        }
      });

      worker.on('error', (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          worker.kill();
          reject(error);
        }
      });

      worker.on('exit', (code) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          if (code !== 0) {
            reject(new Error(`Worker exited with code ${code}`));
          } else {
            reject(new Error('Worker exited before sending metrics'));
          }
        }
      });

      // Start metrics collection
      worker.send({ command: 'collect' });
    });
  }

  async collectAllMetrics() {
    try {
      const metrics = await this.collectMetrics();
      return {
        hostname: os.hostname(),
        timestamp: new Date(),
        ...metrics,
      };
    } catch (error) {
      console.error('Error collecting metrics:', error);
      throw error;
    }
  }
}

module.exports = new MetricsCollector();

