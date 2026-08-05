import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/roomRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Futuristic Cyber-Tech Visual Endpoint
app.get('/', (_req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LINKD // CYBER CORE SYSTEM</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #030712;
      color: #00ffcc;
      font-family: 'Courier New', Courier, monospace;
      overflow: hidden;
      height: 100vh;
      width: 100vw;
    }
    canvas {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
    }
    .grid-overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(rgba(0,255,204,0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,255,204,0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      z-index: 2;
      pointer-events: none;
    }
    .hud-container {
      position: relative;
      z-index: 3;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      padding: 30px;
      pointer-events: none;
      box-shadow: inset 0 0 100px rgba(0, 255, 204, 0.15);
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #00ffcc;
      padding-bottom: 15px;
      background: rgba(3, 7, 18, 0.6);
      backdrop-filter: blur(5px);
    }
    .title {
      font-size: 24px;
      letter-spacing: 4px;
      text-shadow: 0 0 10px #00ffcc, 0 0 20px #00ffcc;
      animation: pulse 2s infinite alternate;
    }
    .status-badge {
      border: 1px solid #00ffcc;
      padding: 5px 15px;
      font-size: 14px;
      background: rgba(0, 255, 204, 0.1);
      box-shadow: 0 0 15px rgba(0, 255, 204, 0.3);
    }
    .main-hud {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cyber-card {
      background: rgba(3, 7, 18, 0.75);
      border: 1px solid rgba(0, 255, 204, 0.4);
      padding: 20px;
      width: 320px;
      box-shadow: 0 0 25px rgba(0, 255, 204, 0.1);
      position: relative;
    }
    .cyber-card::before {
      content: '';
      position: absolute;
      top: -5px; left: -5px; width: 10px; height: 10px;
      border-top: 2px solid #00ffcc; border-left: 2px solid #00ffcc;
    }
    .cyber-card::after {
      content: '';
      position: absolute;
      bottom: -5px; right: -5px; width: 10px; height: 10px;
      border-bottom: 2px solid #00ffcc; border-right: 2px solid #00ffcc;
    }
    .center-reticle {
      width: 250px;
      height: 250px;
      border: 2px dashed rgba(0, 255, 204, 0.4);
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: spin 20s linear infinite;
      position: relative;
    }
    .center-reticle::before {
      content: '';
      position: absolute;
      width: 280px; height: 280px;
      border: 1px solid rgba(255, 0, 102, 0.5);
      border-radius: 50%;
      border-top-color: transparent;
      animation: spinReverse 10s linear infinite;
    }
    .core-text {
      text-align: center;
      animation: none;
    }
    footer {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      border-top: 1px solid rgba(0, 255, 204, 0.3);
      padding-top: 10px;
      background: rgba(3, 7, 18, 0.6);
    }
    .log-stream {
      font-size: 12px;
      color: rgba(0, 255, 204, 0.7);
      line-height: 1.6;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    @keyframes spinReverse { 100% { transform: rotate(-360deg); } }
    @keyframes pulse { from { opacity: 0.7; } to { opacity: 1; } }
    .scanline {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 4px;
      background: rgba(0, 255, 204, 0.4);
      opacity: 0.6;
      animation: scan 4s linear infinite;
      z-index: 4;
      pointer-events: none;
    }
    @keyframes scan {
      0% { top: 0; }
      100% { top: 100vh; }
    }
  </style>
</head>
<body>
  <div class="grid-overlay"></div>
  <div class="scanline"></div>
  <canvas id="canvas"></canvas>

  <div class="hud-container">
    <header>
      <div class="title">LINKD // PROTOCOL v4.0.9</div>
      <div class="status-badge">SYSTEM STATUS: ONLINE</div>
    </header>

    <div class="main-hud">
      <div class="cyber-card">
        <h3>[ TELEMETRY ]</h3>
        <br>
        <div class="log-stream">
          <div>> MEMORY: 64.2% ALLOCATED</div>
          <div>> CPU TEMP: 38°C CORE_0</div>
          <div>> ENCRYPTION: AES-256-GCM</div>
          <div>> LATENCY: 12ms TO NODE-X</div>
          <div>> FIREWALL: ACTIVE [PORT 5000]</div>
        </div>
      </div>

      <div class="center-reticle">
        <div class="core-text">
          <div style="font-size: 18px; font-weight: bold; color: #ff0066; text-shadow: 0 0 10px #ff0066;">CORE ONLINE</div>
          <div style="font-size: 11px; margin-top: 5px;">NEURAL LINK: 99.8%</div>
        </div>
      </div>

      <div class="cyber-card">
        <h3>[ ACTIVE LOGS ]</h3>
        <br>
        <div class="log-stream" id="live-logs">
          <div>> Initializing core matrix...</div>
          <div>> Authentication module loaded</div>
          <div>> Socket stream connected</div>
        </div>
      </div>
    </div>

    <footer>
      <div>LOC: 23.8103° N, 90.4125° E</div>
      <div id="timestamp">TIMESTAMP: --</div>
      <div>SECURITY CLEARANCE: LEVEL-5</div>
    </footer>
  </div>

  <script>
    // Matrix Rain Visual Effect
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });

    const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    function drawMatrix() {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00ffcc';
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    setInterval(drawMatrix, 33);

    // Live UI updates
    setInterval(() => {
      document.getElementById('timestamp').innerText = 'TIMESTAMP: ' + new Date().toISOString();
    }, 1000);

    const logMessages = [
      '> Packet inspection passed',
      '> Encrypted handshake verified',
      '> Routing table re-aligned',
      '> Garbage collection completed',
      '> System diagnostic: OK'
    ];

    setInterval(() => {
      const logs = document.getElementById('live-logs');
      const newLog = document.createElement('div');
      newLog.innerText = logMessages[Math.floor(Math.random() * logMessages.length)];
      logs.appendChild(newLog);
      if (logs.children.length > 5) logs.removeChild(logs.firstChild);
    }, 3000);
  </script>
</body>
</html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Central Error Handler
app.use(errorHandler);

export default app;
