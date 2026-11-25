const rooms = {};

function createRoom(roomId, host, maxPlayers) {
  rooms[roomId] = {
    players: [{
      id: host.id,
      name: host.name,
      ships: [],
      attacks: [], // ✅ track attacks ON THIS PLAYER
      color: null,
      alive: true,
      ready: false
    }],
    maxPlayers,
    turnIndex: 0,
    started: false
  };
}

function joinRoom(roomId, player) {
  const room = rooms[roomId];
  if (!room || room.players.length >= room.maxPlayers) return false;

  room.players.push({
    id: player.id,
    name: player.name,
    ships: [],
    attacks: [], // ✅ IMPORTANT
    color: null,
    alive: true,
    ready: false
  });

  return true;
}

function selectColor(roomId, playerId, color) {
  const room = rooms[roomId];
  if (room.players.some(p => p.color === color)) return false;

  const player = room.players.find(p => p.id === playerId);
  player.color = color;
  return true;
}

function placeShips(roomId, playerId, ships) {
  const player = rooms[roomId].players.find(p => p.id === playerId);
  player.ships = ships;
  player.ready = true;
}

function attack(roomId, attackerId, targetId, x, y) {
  const room = rooms[roomId];
  if (!room) return;

  const attacker = room.players.find(p => p.id === attackerId);
  const target = room.players.find(p => p.id === targetId);

  // ❌ invalid cases
  if (!attacker || !target) return;
  if (!target.alive) return { error: "Player already dead" }; // ✅ FIX 3
  if (attackerId === targetId) return { error: "Cannot attack yourself" };

  // turn check
  if (room.players[room.turnIndex].id !== attackerId) {
    return { error: "Not your turn" };
  }

  // ❌ prevent attacking same cell again
  const alreadyAttacked = target.attacks.some(a => a.x === x && a.y === y);
  if (alreadyAttacked) {
    return { error: "Already attacked" }; // ✅ FIX 1
  }

  let hit = false;

  // ✅ CORRECT hit logic (ONLY ONE BLOCK)
  target.ships.forEach(ship => {
    ship.positions.forEach(pos => {
      if (pos.x === x && pos.y === y && !pos.hit) {
        pos.hit = true;
        hit = true;
      }
    });
  });

  // ✅ store attack result
  target.attacks.push({ x, y, hit });

  // ✅ check if player dead
  const dead = target.ships.every(s =>
    s.positions.every(p => p.hit)
  );

  if (dead) target.alive = false;

  // ✅ next alive player turn
  do {
    room.turnIndex = (room.turnIndex + 1) % room.players.length;
  } while (!room.players[room.turnIndex].alive);

  return { hit };
}

module.exports = {
  rooms,
  createRoom,
  joinRoom,
  selectColor,
  placeShips,
  attack
};