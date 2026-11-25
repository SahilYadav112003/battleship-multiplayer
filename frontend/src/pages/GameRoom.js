
import { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import socket from "../socket";
import Grid from "../components/Grid";

export default function GameRoom() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [room, setRoom] = useState(location.state?.room || null);

  const [selectedShip, setSelectedShip] = useState(null);
  const [orientation, setOrientation] = useState("horizontal");
  const [ships, setShips] = useState([]);
  const [hoverCells, setHoverCells] = useState([]);

  useEffect(() => {
    socket.on("updateRoom", setRoom);
    socket.on("gameStarted", setRoom);
    socket.on("gameUpdate", (r) => setRoom(r));

    socket.on("roomClosed", () => {
      alert("Room no longer exists");
      navigate("/");
    });

    return () => socket.off();
  }, [navigate]);

  if (!room) return <div>Loading...</div>;
  if (!room.players || !room.players.length) return <div>Loading players...</div>;

  const me = room.players.find(p => p.id === socket.id) || null;
  const isMyTurn = room.players[room.turnIndex]?.id === socket.id;

  // ================= SHIP PLACEMENT =================
  function placeShip(x, y) {
    if (!selectedShip || !me) return;

    if (ships.some(s => s.size === selectedShip)) return;

    let positions = [];

    for (let i = 0; i < selectedShip; i++) {
      let nx = orientation === "vertical" ? x + i : x;
      let ny = orientation === "horizontal" ? y + i : y;

      if (nx >= 4 || ny >= 5) return;

      if (ships.some(s =>
        s.positions.some(p => p.x === nx && p.y === ny)
      )) return;

      positions.push({ x: nx, y: ny, hit: false });
    }

    setShips(prev => [...prev, { size: selectedShip, positions }]);
    setSelectedShip(null);
  }

  function handleHover(x, y) {
    if (!selectedShip) return setHoverCells([]);

    let preview = [];

    for (let i = 0; i < selectedShip; i++) {
      let nx = orientation === "vertical" ? x + i : x;
      let ny = orientation === "horizontal" ? y + i : y;

      if (nx >= 4 || ny >= 5) return setHoverCells([]);

      preview.push(`${nx}-${ny}`);
    }

    setHoverCells(preview);
  }

  function sendShips() {
    if (ships.length !== 3) return alert("Place all ships");
    socket.emit("placeShips", { roomId: id, ships });
  }

  // ================= ATTACK =================
  function attack(targetId, x, y) {
    if (!isMyTurn) return;

    // Prevent self attack
    if (targetId === socket.id) return;

    socket.emit("attack", { roomId: id, targetId, x, y });
  }

  const isHost = room.players[0]?.id === socket.id;
  const allReady = room.players.every(p => p.ready && p.color);

  const alive = room.players.filter(p => p.alive);
  if (alive.length === 1 && room.started) {
    return <div className="win-screen">🏆 {alive[0].name} Wins!</div>;
  }

  return (
    <div className="game-container">

      <div className="top-bar">
        <h2>Room: {id}</h2>
        <button className="exit-btn" onClick={() => navigate("/")}>
          Exit
        </button>
      </div>

      {room.started && (
        <div className="turn">
          {isMyTurn ? "🔥 Your Turn" : "⏳ Waiting"}
        </div>
      )}

      {/* COLOR PICKER */}
      {me && !me.color && (
        <div className="color-section">
          <h3>Select Color</h3>

          <div className="color-grid">
            {["red", "blue", "green", "yellow", "purple", "orange", "cyan", "pink"].map(c => {
              const takenBy = room.players.find(p => p.color === c);
              const taken = !!takenBy;

              return (
                <div
                  key={c}
                  className={`color-box ${taken ? "disabled" : ""}`}
                  style={{
                    background: c,
                    opacity: taken ? 0.35 : 1,
                    border: taken ? "2px solid #444" : "2px solid transparent"
                  }}
                  title={taken ? `Taken by ${takenBy.name}` : "Available"}
                  onClick={() => {
                    if (!taken && me && !me.color) {
                      socket.emit("selectColor", { roomId: id, color: c });
                    }
                  }}
                />
              );
            })}
          </div>

          <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>
            Greyed colors are already taken
          </p>
        </div>
      )}

      {/* SHIP PLACEMENT */}
      {!room.started && me && me.color && !me.ready && (
        <div className="placement-section">
          <h3>Place Ships</h3>

          <div className="ship-controls">
            {[3, 2, 1].map(size => {
              const placed = ships.some(s => s.size === size);
              if (placed) return null;

              return (
                <button
                  key={size}
                  className={`ship-btn ${selectedShip === size ? "active" : ""}`}
                  onClick={() => setSelectedShip(size)}
                >
                  {size} Block Ship
                </button>
              );
            })}

            <button
              className="rotate-btn"
              onClick={() =>
                setOrientation(o => o === "horizontal" ? "vertical" : "horizontal")
              }
            >
              Rotate
            </button>
          </div>

          <Grid
            ships={ships}
            showShips={true}
            color={me.color}
            onClick={placeShip}
            onHover={handleHover}
            hoverCells={hoverCells}
          />

          <button className="confirm-btn" onClick={sendShips}>
            Confirm Ships
          </button>
        </div>
      )}

      {/* START */}
      {isHost && !room.started && (
        <button
          disabled={!allReady}
          onClick={() => socket.emit("startGame", id)}
        >
          Start Game
        </button>
      )}

      {/* GAME */}
      {room.started && (
        <div className="players-grid">
          {room.players.map(p => (
            <div
              key={p.id}
              className={`player-card ${
                room.players[room.turnIndex]?.id === p.id ? "active" : ""
              }`}
            >
              <h4 style={{ color: p.color }}>{p.name}</h4>

              <Grid
                ships={p.ships}
                showShips={p.id === socket.id}
                revealShips={
                  p.ships.filter(s => s.positions.every(pos => pos.hit))
                }
                color={p.color}
                attacks={p.attacks || []}
                onClick={(x, y) => attack(p.id, x, y)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
