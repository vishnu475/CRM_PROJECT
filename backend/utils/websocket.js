import { WebSocketServer, WebSocket } from 'ws';

let wss = null;

export function initWebSocketServer(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('📡 Real-time HR Dashboard client connected via WebSocket');
    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'WebSocket connection active' }));

    ws.on('close', () => {
      console.log('📡 HR Dashboard client disconnected');
    });
  });

  return wss;
}

export function broadcastAttendanceEvent(eventData) {
  if (!wss) return;
  const payload = JSON.stringify({
    type: 'ATTENDANCE_EVENT',
    data: eventData,
    timestamp: new Date().toISOString()
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
