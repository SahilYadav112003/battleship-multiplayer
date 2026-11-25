const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const {
  rooms,
  createRoom,
  joinRoom,
  selectColor,
  placeShips,
  attack
} = require("./gameManager");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

function generateRoomId() {
  return Math.random().toString(36).substring(2, 7);
}

io.on("connection", socket => {

  socket.on("hostGame", ({ name, maxPlayers }, cb) => {
    const roomId = generateRoomId();
    createRoom(roomId, { id: socket.id, name }, maxPlayers);
    socket.join(roomId);
    cb({ roomId, room: rooms[roomId] });
  });

  socket.on("joinGame", ({ roomId, name }, cb) => {
    const success = joinRoom(roomId, { id: socket.id, name });

    if (success) {
      socket.join(roomId);
      io.to(roomId).emit("updateRoom", rooms[roomId]);
    }

    cb(success);
  });

  socket.on("selectColor", ({ roomId, color }) => {
    if (selectColor(roomId, socket.id, color)) {
      io.to(roomId).emit("updateRoom", rooms[roomId]);
    }
  });

  socket.on("placeShips", ({ roomId, ships }) => {
    placeShips(roomId, socket.id, ships);
    io.to(roomId).emit("updateRoom", rooms[roomId]);
  });

  socket.on("startGame", (roomId) => {
    const room = rooms[roomId];
    const ready = room.players.every(p => p.ready && p.color);

    if (!ready) return;

    room.started = true;
    io.to(roomId).emit("gameStarted", room);
  });

  // ✅ FIXED ATTACK HANDLER
  socket.on("attack", ({ roomId, targetId, x, y }) => {
    const room = rooms[roomId];
    if (!room || !room.started) return;

    const attacker = room.players[room.turnIndex];

    // ❌ not your turn
    if (attacker.id !== socket.id) return;

    // ❌ cannot attack yourself
    if (attacker.id === targetId) return;

    const target = room.players.find(p => p.id === targetId);
    if (!target || !target.alive) return;

    // ❌ prevent duplicate attack
    if (!target.attacks) target.attacks = [];
    if (target.attacks.some(a => a.x === x && a.y === y)) return;

    const result = attack(roomId, socket.id, targetId, x, y);

    io.to(roomId).emit("gameUpdate", rooms[roomId], result);
  });

});

server.listen(5000, () => console.log("Server running on 5000"));