// components/Poker/LoginModal.jsx

export default function LoginModal({
  loginForm,
  setLoginForm,
  loginError,
  onLogin,
  onRegister,
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.95)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "linear-gradient(145deg,#2a6e3a,#0a4122)",
          padding: "25px 35px",
          borderRadius: 50,
          textAlign: "center",
          color: "#ffefb9",
          boxShadow: "0 0 50px rgba(0,0,0,0.5)",
          border: "2px solid gold",
          minWidth: 320,
          maxWidth: "90%",
        }}
      >
        <h2 style={{ margin: "0 0 15px", fontSize: "1.8rem" }}>
          🎴 TEXAS HOLD'EM 🎴
        </h2>
        <p>Login para jogar:</p>

        <input
          value={loginForm.username}
          onChange={(e) =>
            setLoginForm((f) => ({ ...f, username: e.target.value }))
          }
          placeholder="Usuário"
          autoComplete="off"
          style={{
            padding: "10px 20px",
            fontSize: "1rem",
            borderRadius: 50,
            border: "none",
            textAlign: "center",
            fontWeight: "bold",
            marginBottom: 10,
            width: "100%",
            boxSizing: "border-box",
          }}
        />

        <input
          type="password"
          value={loginForm.password}
          onChange={(e) =>
            setLoginForm((f) => ({ ...f, password: e.target.value }))
          }
          onKeyDown={(e) => e.key === "Enter" && onLogin()}
          placeholder="Senha"
          style={{
            padding: "10px 20px",
            fontSize: "1rem",
            borderRadius: 50,
            border: "none",
            textAlign: "center",
            fontWeight: "bold",
            marginBottom: 15,
            width: "100%",
            boxSizing: "border-box",
          }}
        />

        <div>
          <button onClick={onLogin} style={btnStyle()}>
            ENTRAR
          </button>
          <button onClick={onRegister} style={btnStyle()}>
            CADASTRAR
          </button>
        </div>

        {loginError && (
          <div
            style={{
              color: loginError.startsWith("✅") ? "#88ff88" : "#ff8888",
              fontSize: "0.8rem",
              marginTop: 10,
            }}
          >
            {loginError}
          </div>
        )}
      </div>
    </div>
  );
}

function btnStyle() {
  return {
    background: "radial-gradient(#f7d97c,#d6a12e)",
    border: "none",
    fontWeight: "bold",
    fontSize: "0.9rem",
    padding: "8px 20px",
    borderRadius: 60,
    cursor: "pointer",
    boxShadow: "0 4px 0 #7a4c1a",
    color: "#2e241f",
    fontFamily: "inherit",
    margin: "5px 5px",
  };
}
