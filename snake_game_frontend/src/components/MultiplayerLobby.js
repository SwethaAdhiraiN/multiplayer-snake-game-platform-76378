import React, { useState, useEffect } from "react";

// Dummy/mock API for multiplayer lobby (replace with backend integration)
const demoRooms = [
  {
    roomId: "a1b2",
    players: [{ name: "Alex", avatar: "🟢" }, { name: "QuickJoe", avatar: "🟡" }],
    playing: false
  },
  {
    roomId: "p4c6",
    players: [{ name: "Cleo", avatar: "🐍" }],
    playing: false
  }
];

/**
 * PUBLIC_INTERFACE
 * MultiplayerLobby - Select or join multiplayer game rooms, show available rooms/players.
 * Props:
 *   user: current username
 *   onJoin: func(roomId)
 */
function MultiplayerLobby({ user, onJoin, onCreateRoom }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState("");

  useEffect(() => {
    // Placeholder for fetching active rooms from backend
    setTimeout(() => {
      setRooms(demoRooms);
      setLoading(false);
    }, 150);
  }, []);

  return (
    <div className="panel-section" style={{ marginBottom: 12 }}>
      <h2 className="panel-title" style={{ fontSize: "1.1rem" }}>Multiplayer Lobby</h2>
      {loading && <div style={{ color: "#888", fontSize: 13 }}>Loading rooms...</div>}
      {!loading && (
        <>
          <ul className="lobby-list">
            {rooms.length === 0 && (
              <li style={{ color: "#999", fontSize: 15 }}>No rooms available.</li>
            )}
            {rooms.map(room => (
              <li key={room.roomId}>
                <span className="lobby-avatar">{room.players[0]?.avatar || "🕹️"}</span>
                <span className="lobby-name">{room.roomId}</span>
                <span style={{ marginLeft: 10, fontSize: 13, color: "#666" }}>
                  {room.players.length} player{room.players.length > 1 ? "s" : ""}
                </span>
                <button
                  className="button primary"
                  style={{ marginLeft: 10, fontSize: 14, padding: "3px 12px" }}
                  onClick={() => onJoin(room.roomId)}
                  type="button"
                  disabled={room.playing}
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
