import { useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

export default function Home() {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const navigate = useNavigate();

  const hostGame = () => {
    if (!name) return alert("Enter name");

    socket.emit("hostGame", { name, maxPlayers }, ({ roomId, room }) => {
      navigate(`/room/${roomId}`, { state: { name, room } });
    });
  };

  const joinGame = () => {
    socket.emit("joinGame", { roomId: room, name }, (success) => {
      if (success) navigate(`/room/${room}`, { state: { name } });
      else alert("Invalid room");
    });
  };

  return (
    <div className="home-container">

      <h1>⚓ BattleGrid</h1>

      <div className="card">
        <input
          placeholder="Enter Name"
          onChange={e => setName(e.target.value)}
        />

        <label>Players (2-8)</label>
        <input
          type="number"
          min="2"
          max="8"
          value={maxPlayers}
          onChange={e => setMaxPlayers(e.target.value)}
        />

        <button onClick={hostGame}>Host Game</button>
      </div>

      <div className="card">
        <input
          placeholder="Room Code"
          onChange={e => setRoom(e.target.value)}
        />

        <button onClick={joinGame}>Join Game</button>
      </div>

    </div>
  );
}