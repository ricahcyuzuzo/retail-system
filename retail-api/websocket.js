const WebSocket = require('ws');
const AccessRequest = require('./models/AccessRequest');
const User = require('./models/User');

let wss;
const pendingRequests = new Map(); // key: requestId, value: ws

function setupWebSocket(server) {
  // TEST BROADCAST: Sends a message to all clients every 10 seconds
  setInterval(() => {
    if (wss && wss.clients) {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'broadcast', msg: 'Hello from server (test broadcast)' }));
        }
      });
    }
  }, 10000); // 10 seconds

  wss = new WebSocket.Server({ server });
  console.log('WebSocket server started');

  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected:', req && req.socket && req.socket.remoteAddress);
    ws.isAdmin = false;
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'admin_auth') {
            // Admin client authenticates
            const { token } = data;
            // Verify JWT and admin status
            const jwt = require('jsonwebtoken');
            let decoded;
            try {
              decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            } catch (e) {
              ws.send(JSON.stringify({ error: 'Invalid admin token' }));
              return;
            }
          const user = await User.findOne({ email: decoded.email });
          if (user && user.isAdmin) {
            ws.isAdmin = true;
            ws.adminEmail = user.email;
            ws.send(JSON.stringify({ type: 'admin_auth_success' }));
          } else {
            ws.send(JSON.stringify({ error: 'Not an admin' }));
          }
        } else if (data.type === 'request_access') {
          // Desktop app requests access
          const { userEmail } = data;
          const req = new AccessRequest({ userEmail });
          await req.save();
          pendingRequests.set(req._id.toString(), ws);
          // Broadcast to all admin clients
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client.isAdmin) {
              client.send(JSON.stringify({
                type: 'new_access_request',
                request: {
                  _id: req._id,
                  userEmail: req.userEmail,
                  requestedAt: req.requestedAt,
                  status: req.status
                }
              }));
            }
          });
        } else if (data.type === 'respond_access') {
          // Admin responds to access request
          const { requestId, approve, adminEmail } = data;
          const req = await AccessRequest.findById(requestId);
          if (!req || req.status !== 'pending') return;
          req.status = approve ? 'approved' : 'rejected';
          req.respondedAt = new Date();
          req.responderEmail = adminEmail;
          req.action = approve ? 'approved' : 'rejected';
          await req.save();
          if (approve) {
            // Enable user account
            await User.findOneAndUpdate({ email: req.userEmail }, { isActive: true });
          }
          // Notify desktop app if connection is open
          const wsClient = pendingRequests.get(requestId);
          if (wsClient && wsClient.readyState === WebSocket.OPEN) {
            wsClient.send(JSON.stringify({ type: 'access_response', approved: approve }));
          }
          pendingRequests.delete(requestId);
        }
      } catch (err) {
        ws.send(JSON.stringify({ error: 'Invalid message or server error.' }));
      }
    });
  });
}

module.exports = setupWebSocket;
