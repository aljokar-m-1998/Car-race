const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

let players = {};
let turn = 0;
let positions = {};

io.on('connection', (socket) => {
    console.log('🎮 لاعب دخل:', socket.id);
    players[socket.id] = { id: socket.id };
    positions[socket.id] = 0;

    socket.emit('init', { id: socket.id, positions });

    socket.on('rollDice', () => {
        if (Object.keys(players)[turn] !== socket.id) return;
        let dice = Math.floor(Math.random() * 6) + 1;
        positions[socket.id] += dice;

        const snakes = { 16: 6, 48: 30, 64: 60, 79: 19, 93: 68 };
        const ladders = { 3: 22, 8: 26, 20: 29, 41: 59, 50: 67 };

        if (snakes[positions[socket.id]]) positions[socket.id] = snakes[positions[socket.id]];
        if (ladders[positions[socket.id]]) positions[socket.id] = ladders[positions[socket.id]];

        io.emit('update', { positions, dice, current: socket.id });
        turn = (turn + 1) % Object.keys(players).length;
    });

    socket.on('disconnect', () => {
        console.log('❌ لاعب خرج:', socket.id);
        delete players[socket.id];
        delete positions[socket.id];
    });
});

server.listen(PORT, () => console.log("🚀 Server running on http://localhost:" + PORT));
