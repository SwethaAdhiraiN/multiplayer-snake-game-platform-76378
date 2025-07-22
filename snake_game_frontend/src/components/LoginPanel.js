import React, { useState } from "react";

/**
 * PUBLIC_INTERFACE
 * LoginPanel - UI for user to input their nickname/login.
 * @param {Object} props - { onLogin }
 */
function LoginPanel({ onLogin }) {
  const [input, setInput] = useState("");
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (input.trim()) onLogin(input.trim());
      }}
      className="user-login-form"
    >
      <input
        className="input"
        type="text"
        placeholder="Name or nickname"
        maxLength={16}
        value={input}
        autoFocus
        onChange={e => setInput(e.target.value)}
        style={{ width: "80%", marginBottom: 8 }}
      />
      <button className="button accent" type="submit">
        Enter
      </button>
    </form>
  );
}

export default LoginPanel;
