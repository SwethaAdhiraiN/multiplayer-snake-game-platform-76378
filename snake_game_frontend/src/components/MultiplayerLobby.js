import React, { useState, useEffect } from "react";

/*
 * MultiplayerLobby - fetches and displays multiplayer rooms in real time via backend API.
 */

/**
 * PUBLIC_INTERFACE
 * MultiplayerLobby - Select or join multiplayer game rooms, show available rooms/players via backend API.
 * Props:
 *   user: current username
 *   onJoin: func(roomId)
 *   onCreateRoom: func(roomName)
 */
function MultiplayerLobby({ user, onJoin, onCreateRoom }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState("");
  const [error, setError] = useState("");
  const API_BASE = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000/api";

  // Fetch rooms from backend on mount and every 3 seconds
  useEffect(() => {
    let isMounted = true;
    let intervalId = null;
    async function fetchRooms() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/multiplayer/rooms`);
        if (!res.ok) throw new Error("Failed to load rooms");
        const data = await res.json();
        if (isMounted) {
          setRooms(data);
          setLoading(false);
        }
      } catch (e) {
        setError("Could not fetch rooms.");
        setRooms([]);
        setLoading(false);
      }
    }
    fetchRooms();
    intervalId = setInterval(fetchRooms, 3200);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
    // eslint-disable-next-line
  }, []);

  return (
    <div className="panel-section" style={{ marginBottom: 12 }}>
      <h2 className="panel-title" style={{ fontSize: "1.1rem" }}>Multiplayer Lobby</h2>
      {loading && <div style={{ color: "#888", fontSize: 13 }}>Loading rooms...</div>}
      {error && <div style={{ color: "#c00", fontSize: 13 }}>{error}</div>}
      {!loading && !error && (
        <>
          <ul className="lobby-list">
            {rooms.length === 0 && (
              <li style={{ color: "#999", fontSize: 15 }}>No rooms available.</li>
            )}
            {rooms.map(room => (
              <li key={room.roomId}>
                <span className="lobby-avatar" title={room.players[0] || "player"} role="img">
                  {/* Avatar is just emoji circle or user initial */}
                  {room.players[0]?.[0] ?
                    (room.players[0][0].toUpperCase() === user[0].toUpperCase() ? "🟢" : "🟡")
                    : "🕹️"}
                </span>
                <span className="lobby-name">{room.roomId}</span>
                <span style={{ marginLeft: 10, fontSize: 13, color: "#666" }}>
                  {room.players.length} player{room.players.length > 1 ? "s" : ""}
                </span>
                <button
                  className="button primary"
                  style={{ marginLeft: 10, fontSize: 14, padding: "3px 12px" }}
                  onClick={() => onJoin(room.roomId)}
                  type="button"
                  disabled={room.playing || room.players.length >= 2 || room.players.includes(user)}
                  title={room.playing ? "Game started" : room.players.length >= 2 ? "Full" : ""}
                >
                  Join
                </button>
              </li>
            ))}
          </ul>
          <form
            style={{ marginTop: 8, marginBottom: 2, display: "flex", gap: "0.6em" }}
            onSubmit={e => {
              e.preventDefault();
              if (newRoomName.trim()) {
                onCreateRoom(newRoomName.trim());
                setNewRoomName("");
              }
            }}
          >
            <input
              className="input"
              style={{ width: 120, fontSize: 14 }}
              placeholder="Room name"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              maxLength={20}
            />
            <button className="button accent" type="submit" style={{ fontSize: 14 }}>
              Create
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default MultiplayerLobby;
