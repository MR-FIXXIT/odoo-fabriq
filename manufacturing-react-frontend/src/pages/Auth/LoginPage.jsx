import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    // Example authentication logic
    const success = login(data.loginId, data.password);
    if (success) navigate("/");
    else alert("Invalid credentials");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f5f7fa",
      padding: 16
    }}>
     

      <div style={{
        width: "100%",
        maxWidth: 400,
        background: "#fff",
        padding: 32,
        borderRadius: 12,
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.06)"}
      >
         <div style={{textAlign: "center", marginBottom: 32}}>
        <img src="src\components\Logo.png" alt="App Logo" style={{height: 64, width: 64}} />
        <img src="src\components\nameimage.jpeg" alt="App Logo" style={{height: 32, width: 128, marginTop: 8}} />
        
      </div>
        <form onSubmit={handleSubmit(onSubmit)} style={{display: "flex", flexDirection: "column", gap: 16}}>
          <input
            type="text"
            placeholder="Login Id"
            {...register("loginId", { required: "Login Id required" })}
            style={inputStyle}
          />
          {errors.loginId && <span style={errorStyle}>{errors.loginId.message}</span>}

          <input
            type="password"
            placeholder="Password"
            {...register("password", { required: "Password required" })}
            style={inputStyle}
          />
          {errors.password && <span style={errorStyle}>{errors.password.message}</span>}

          <button type="submit" style={buttonStyle}>SIGN IN</button>

          <div style={{display: "flex", justifyContent: "space-between", fontSize: 14}}>
            <Link to="/forgot-password" style={linkStyle}>Forget Password?</Link>
            <Link to="/signup" style={linkStyle}>Sign Up</Link>
          </div>
        </form>
      </div>
      {/* Footer */}
      <footer className="auth-footer" style={{position: "absolute", bottom: 16, textAlign: "center", width: "100%", fontSize: 12, color: "#000"}}>
        &copy; {new Date().getFullYear()} Fabriq. All rights reserved.
      </footer>
    </div>
  );
}

const inputStyle = {
  padding: 12,
  borderRadius: 8,
  border: "1px solid #cbd5e0",
  outline: "none",
  fontSize: 14,
};

const buttonStyle = {
  padding: 12,
  borderRadius: 8,
  backgroundColor: "#1e40af",
  color: "#fff",
  fontWeight: "bold",
  border: "none",
  cursor: "pointer",
};

const errorStyle = {color: "#dc2626", fontSize: 12};
const linkStyle = {color: "#3b82f6", textDecoration: "none"};
