// const si = require('systeminformation');
// const os = require('os');

// // Worker process for collecting system metrics
// process.on('message', async (msg) => {
//   if (msg.command === 'collect') {
//     try {
//       // Collect all metrics in parallel
//       const [cpu, mem, disk, network, processes] = await Promise.all([
//         si.currentLoad(),
//         si.mem(),
//         si.fsSize(),
//         si.networkStats(),
//         si.processes()
//       ]);

//       const loadAvg = os.loadavg();

//       const metrics = {
//         cpu: {
//           usage: parseFloat(cpu.currentLoad.toFixed(2)),
//           cores: cpu.cpus.length,
//           model: cpu.cpus[0]?.model || 'Unknown',
//           speed: cpu.cpus[0]?.speed || 0
//         },
//         memory: {
//           total: mem.total,
//           used: mem.used,
//           free: mem.free,
//           usagePercentage: parseFloat(((mem.used / mem.total) * 100).toFixed(2))
//         },
//         disk: disk.map(d => ({
//           filesystem: d.fs,
//           size: d.size,
//           used: d.used,
//           available: d.available,
//           usagePercentage: parseFloat(d.use.toFixed(2)),
//           mountpoint: d.mount
//         })),
//         network: {
//           bytesIn: network[0]?.rx_bytes || 0,
//           bytesOut: network[0]?.tx_bytes || 0,
//           packetsIn: network[0]?.rx_packets || 0,
//           packetsOut: network[0]?.tx_packets || 0
//         },
//         uptime: os.uptime(),
//         loadAverage: {
//           one: parseFloat(loadAvg[0].toFixed(2)),
//           five: parseFloat(loadAvg[1].toFixed(2)),
//           fifteen: parseFloat(loadAvg[2].toFixed(2))
//         },
//         processes: {
//           total: processes.all,
//           running: processes.running,
//           blocked: processes.blocked
//         }
//       };

//       process.send(metrics);
//     } catch (error) {
//       process.send({ error: error.message });
//     }
//   }
// });
const si = require('systeminformation');
const os = require('os');


process.on('message', async (msg) => {
  if (msg.command === 'collect') {
    try {
      console.log("👷 Worker started collecting...");

      
      const cpu = await si.currentLoad();
      const mem = await si.mem();

      const metrics = {
        cpu: {
          usage: parseFloat(cpu.currentLoad.toFixed(2)),
          cores: cpu.cpus.length,
          model: cpu.cpus[0]?.model || "Unknown",
          speed: cpu.cpus[0]?.speed || 0
        },

        memory: {
          total: mem.total,
          used: mem.used,
          free: mem.free,
          usagePercentage: parseFloat(((mem.used / mem.total) * 100).toFixed(2))
        },

        uptime: os.uptime(),

        
        disk: [],
        network: {},
        processes: {}
      };

      console.log("✅ Worker sending metrics");

      process.send(metrics);

    } catch (error) {
      console.log("❌ Worker error:", error.message);

      process.send({
        error: error.message
      });
    }
  }
});
