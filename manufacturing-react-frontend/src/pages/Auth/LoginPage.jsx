import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../lib/api";
import Logo from "../../components/Logo.png";
import NameImage from "../../components/nameimage.jpeg";

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginRemote } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      // Build a payload that works for typical backends (DRF SimpleJWT expects `username`,
      // while your API may use `loginid`). Extra fields are typically ignored server-side.
      const payload = {
        username: data.loginId,
        loginid: data.loginId,
        password: data.password,
      };
      const res = await api.post("/account/token/", payload);
      const body = res?.data ?? {};
      const access = body.access ?? body.token ?? body.access_token;
      const refresh = body.refresh ?? body.refresh_token;
      console.log("Login API success:", { status: res.status, body });

      // Treat any 2xx as success
      if (res.status >= 200 && res.status < 300) {
        if (access || refresh) {
          console.log("Login token received:", { access, refresh });
        } else {
          console.log("Login successful (tokens may be in HttpOnly cookies). Body:", body);
        }
        // Mark user as authenticated in context and navigate
        loginRemote(data.loginId);
        navigate("/");
        return;
      }

      console.warn("Unexpected login status:", res.status, body);
    } catch (err) {
      const errBody = err?.response?.data;
      const status = err?.response?.status;
      console.error("Login API error:", { status, errBody, message: err?.message });

      // Show a more specific message instead of always saying "Invalid credentials"
      let msg = "Login failed.";
      if (!err?.response) {
        // Network/CORS/connection error
        msg = "Can't reach the server. Please check your connection or CORS settings.";
      } else if (status === 400 || status === 401) {
        // Likely invalid credentials
        if (typeof errBody === "string") msg = errBody;
        else if (errBody?.detail) msg = String(errBody.detail);
        else if (errBody?.message) msg = String(errBody.message);
        else msg = "Invalid credentials";
      } else {
        // Other server errors
        if (typeof errBody === "string") msg = errBody;
        else if (errBody) msg = JSON.stringify(errBody);
        else if (err?.message) msg = err.message;
      }
      alert(msg);
    }
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
        <img src={Logo} alt="App Logo" style={{height: 64, width: 64}} />
        <img src={NameImage} alt="App Logo" style={{height: 32, width: 128, marginTop: 8}} />

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
