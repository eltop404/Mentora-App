
import express from 'express';
import Database from 'better-sqlite3';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';

let webpush: any;
let vapidKeys = { publicKey: '', privateKey: '' };
try {
    webpush = require('web-push');
    const vapidFile = './vapid.json';
    if (fs.existsSync(vapidFile)) {
        vapidKeys = JSON.parse(fs.readFileSync(vapidFile, 'utf8'));
    } else {
        vapidKeys = webpush.generateVAPIDKeys();
        fs.writeFileSync(vapidFile, JSON.stringify(vapidKeys));
    }
    webpush.setVapidDetails('mailto:admin@pulse.com', vapidKeys.publicKey, vapidKeys.privateKey);
    console.log('[WebPush] Active and Ready.');
} catch (e) {
    console.warn('[WebPush] Offline notifications disabled. Install with: npm install web-push');
}

const pushSubscriptions: Record<string, any> = {};

const sendOfflinePush = (userId: string, payload: any) => {
    const sub = pushSubscriptions[userId];
    if (sub && webpush) {
        webpush.sendNotification(sub, JSON.stringify(payload)).catch((e: any) => console.log('[WebPush] Error:', e));
    }
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
const db = new Database('nt_database.db');

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
app.use(express.json({ limit: '50mb' }));

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS nt_data (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

// Helper to get/set JSON data
const getData = (key: string) => {
    const row = db.prepare('SELECT value FROM nt_data WHERE key = ?').get(key);
    return row ? JSON.parse(row.value) : null;
};

const setData = (key: string, value: any) => {
    db.prepare('INSERT OR REPLACE INTO nt_data (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
    notifyClients(key);
};

// SSE Setup
let clients: any[] = [];
const notifyClients = (key: string) => {
    const message = JSON.stringify({ type: 'update', key });
    clients.forEach(c => c.res.write(`data: ${message}\n\n`));
};

app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const id = Date.now();
    clients.push({ id, res });

    req.on('close', () => {
        clients = clients.filter(c => c.id !== id);
    });
});

// Generic API Endpoints
app.get('/api/data/:key', (req, res) => {
    const data = getData(req.params.key);
    res.json(data || []);
});

app.post('/api/data/:key', (req, res) => {
    setData(req.params.key, req.body);
    res.json({ success: true });
});

app.get('/api/all', (req, res) => {
    const rows = db.prepare('SELECT * FROM nt_data').all();
    const data: any = {};
    rows.forEach((r: any) => {
        data[r.key] = JSON.parse(r.value);
    });
    res.json(data);
});

// Admin Login check (optional, matching frontend)
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admen' && password === '01270500409') {
        res.json({ success: true, token: 'fake-admin-token' });
    } else {
        res.status(401).json({ success: false });
    }
});

const PORT = 4001;

// --- Socket.io Signaling Server for WebRTC ---
const onlineUsers = new Map<string, string>(); // map userId -> socketId

io.on('connection', (socket) => {
    console.log(`[Socket] New connection attempt: ${socket.id}`);

    socket.on('register-user', (userId: string) => {
        onlineUsers.set(userId, socket.id);
        (socket as any).userId = userId;
        console.log(`[Socket] User registered: ${userId} -> Socket ID: ${socket.id}`);

        if (vapidKeys.publicKey) {
            socket.emit('vapid-public-key', vapidKeys.publicKey);
        }
    });

    socket.on('register-push', (sub: any) => {
        if ((socket as any).userId) {
            pushSubscriptions[(socket as any).userId] = sub;
            console.log(`[WebPush] Subscribed for offline notifications: ${(socket as any).userId}`);
        }
    });

    // === GROUP CALLING MESH SIGNALING ===
    socket.on('check-room', (roomId: string, callback: (exists: boolean) => void) => {
        const room = io.sockets.adapter.rooms.get(roomId);
        callback(!!room && room.size > 0);
    });

    socket.on('join-room', (roomId: string) => {
        socket.join(roomId);
        console.log(`[Socket] ${(socket as any).userId} joined room ${roomId}`);
        socket.to(roomId).emit('user-joined', { userId: (socket as any).userId, socketId: socket.id });
    });

    socket.on('leave-room', (roomId: string) => {
        socket.leave(roomId);
        console.log(`[Socket] ${(socket as any).userId} left room ${roomId}`);
        socket.to(roomId).emit('user-left', { userId: (socket as any).userId });
    });

    socket.on('invite-user', (data: { to: string, roomId: string, fromName: string, avatarUrl: string, isVideo: boolean }) => {
        console.log(`[Socket] Invite from ${(socket as any).userId} to ${data.to} for room ${data.roomId}`);
        const receiverSocketId = onlineUsers.get(data.to);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('invite-user', {
                to: data.to,
                from: (socket as any).userId,
                roomId: data.roomId,
                fromName: data.fromName,
                avatarUrl: data.avatarUrl,
                isVideo: data.isVideo
            });
        }

        if (!onlineUsers.has(data.to)) {
            console.log(`[Socket] Receiver ${data.to} OFFLINE, triggering WebPush...`);
            sendOfflinePush(data.to, {
                title: `مكالمة جماعية من ${data.fromName} 📞`,
                body: 'انقر للرد والمشاركة في المكالمة',
                icon: data.avatarUrl || '/pulse-logo.png',
                url: `/call/${data.roomId}`
            });
        }
    });

    socket.on('offer', (data: { to: string, offer: any, from: string }) => {
        const peerSocketId = onlineUsers.get(data.to);
        if (peerSocketId) io.to(peerSocketId).emit('offer', data);
    });

    socket.on('answer', (data: { to: string, answer: any, from: string }) => {
        const peerSocketId = onlineUsers.get(data.to);
        if (peerSocketId) io.to(peerSocketId).emit('answer', data);
    });
    // ====================================

    // Store pending calls to allow reconnecting users to fetch them when clicking push notifications
    const pendingCalls = new Map<string, any>();

    socket.on('call-user', (data) => {
        const receiverSocket = onlineUsers.get(data.to);

        console.log("📞 Sending call to:", data.to);
        console.log("📡 Receiver socket:", receiverSocket || "Not Connected");

        // Save to pending (expires in 20 seconds)
        pendingCalls.set(data.to, { ...data, timestamp: Date.now() });
        setTimeout(() => { if (pendingCalls.has(data.to)) pendingCalls.delete(data.to); }, 20000);

        if (receiverSocket) {
            io.to(receiverSocket).emit('incoming-call', {
                signal: data.signalData,
                from: data.from,
                fromName: data.fromName,
                avatarUrl: data.avatarUrl,
                isVideo: data.isVideo,
                callType: data.isVideo ? "video" : "audio",
                roomId: data.roomId
            });
            console.log("📩 Incoming call triggered");
        } else {
            console.log("❌ User not found in onlineUsers");
            socket.emit('call-failed', { reason: 'offline' });
        }

        // إرسال Push Notification كنسخة احتياطية فقط
        sendOfflinePush(data.to, {
            title: `مكالمة واردة من ${data.fromName} 📞`,
            body: 'انقر للرد على المكالمة',
            icon: data.avatarUrl || '/pulse-logo.png',
            url: `/?incomingCall=true`
        });
    });

    socket.on('check-active-call', (userId: string) => {
        const pending = pendingCalls.get(userId);
        if (pending && (Date.now() - pending.timestamp < 20000)) {
            socket.emit('incoming-call', {
                signal: pending.signalData,
                from: pending.from,
                fromName: pending.fromName,
                avatarUrl: pending.avatarUrl,
                isVideo: pending.isVideo,
                callType: pending.isVideo ? "video" : "audio",
                roomId: pending.roomId
            });
            console.log(`[Socket] Re-emitted pending call for ${userId}`);
        }
    });

    socket.on('accept-call', (data) => {
        pendingCalls.delete(data.to); // cleared because caller accepts
        // but wait, data.to is the caller! The receiver accepts. So it clears for the receiver?
        // Let's clear both just in case.
        pendingCalls.delete(data.from || '');

        console.log(`[Socket] Call accepted by receiver. Notifying caller ${data.to}`);
        const callerSocketId = onlineUsers.get(data.to);
        if (callerSocketId) io.to(callerSocketId).emit('call-accepted', data);
    });

    socket.on('reject-call', (data) => {
        pendingCalls.delete(data.from || '');
        console.log(`[Socket] Call rejected. Notifying caller ${data.to}`);
        const callerSocketId = onlineUsers.get(data.to);
        if (callerSocketId) io.to(callerSocketId).emit('call-rejected', data);
    });

    socket.on('end-call', (data) => {
        pendingCalls.delete(data.to);
        console.log(`[Socket] Call ended. Notifying peer ${data.to}`);
        const peerSocketId = onlineUsers.get(data.to);
        if (peerSocketId) io.to(peerSocketId).emit('call-ended', data);
    });

    socket.on('ice-candidate', (data) => {
        const peerSocketId = onlineUsers.get(data.to);
        if (peerSocketId) {
            io.to(peerSocketId).emit('ice-candidate', { candidate: data.candidate, from: data.from });
        }
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] Socket disconnected: ${socket.id}`);
        Array.from(socket.rooms).forEach(room => {
            if (room !== socket.id) socket.to(room).emit('user-left', { userId: (socket as any).userId });
        });

        const userId = (socket as any).userId;
        if (userId) {
            // ONLY DELETE IF THE CURRENTLY REGISTERED SOCKET IS THIS DISCONNECTING SOCKET
            if (onlineUsers.get(userId) === socket.id) {
                onlineUsers.delete(userId);
                console.log(`[Socket] Removed offline user: ${userId}`);
            } else {
                console.log(`[Socket] Ignored disconnect for ${userId} because they have a newer active socket.`);
            }
        }
    });
});

httpServer.listen(PORT, '127.0.0.1', () => {
    console.log(`Recovery Server running on http://127.0.0.1:${PORT}`);
});
