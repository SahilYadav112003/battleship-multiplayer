import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import GameRoom from "./pages/GameRoom";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:id" element={<GameRoom />} />
      </Routes>
    </BrowserRouter>
  );
}