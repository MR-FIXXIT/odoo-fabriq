import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../lib/api";
import Logo from "../../components/Logo.png";
import NameImage from "../../components/nameimage.jpeg";

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithTokens, user, authLoading } = useAuth();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // If already authenticated, redirect to home
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [authLoading, user, navigate]);

  const onSubmit = async (data) => {
    setServerError("");
    try {
      const payload = {
        username: data.loginId,
        loginid: data.loginId,
        password: data.password,
      };

      // POST to login endpoint; allow cookies in case server sets HttpOnly cookies
      const res = await api.post("/account/token/", payload, { withCredentials: true });
      const body = res?.data ?? {};
      const access = body.access ?? body.token ?? body.access_token ?? null;
      const refresh = body.refresh ?? body.refresh_token ?? null;

      console.log("Login API response:", res?.status, body);

      if (res.status >= 200 && res.status < 300) {
        if (access) {
          // server returned tokens in JSON -> store them
          loginWithTokens({ access, refresh });
          navigate("/");
          return;
        }
        // No tokens in JSON -> maybe server set HttpOnly cookies. Reload user from server.
        try {
          await reloadUser();
        } catch (e) {
          console.warn("reloadUser after cookie login failed", e);
        }
        navigate("/");
        return;
      }

      console.warn("Unexpected login status:", res.status, body);
      setServerError(`Unexpected status ${res.status}`);
    } catch (err) {
      const errBody = err?.response?.data;
      const status = err?.response?.status;
      console.error("Login API error:", { status, errBody, message: err?.message });

      let msg = "Login failed.";
      if (!err?.response) {
        msg = "Can't reach the server. Please check your connection or CORS settings.";
      } else if (status === 400 || status === 401) {
        if (typeof errBody === "string") msg = errBody;
        else if (errBody?.detail) msg = String(errBody.detail);
        else if (errBody?.message) msg = String(errBody.message);
        else {
          // aggregate known keys
          msg = (errBody && typeof errBody === 'object') ? JSON.stringify(errBody) : 'Invalid credentials';
        }
      } else {
        if (typeof errBody === "string") msg = errBody;
        else if (errBody) msg = JSON.stringify(errBody);
        else if (err?.message) msg = err.message;
      }
      setServerError(msg);
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

          {serverError && <div style={{ color: '#b00020', padding: 8, borderRadius: 6, background: '#fff4f4' }}>{serverError}</div>}

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
