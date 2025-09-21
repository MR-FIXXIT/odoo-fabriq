import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../../lib/api";
import Logo from "../../components/Logo.png";
import NameImage from "../../components/nameimage.jpeg";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email }) => {
    setSending(true);
    try {
      // Send { email } to backend OTP request endpoint
      // Do not send cookies/credentials for this unauthenticated endpoint to avoid CSRF enforcement issues
      await api.post("/account/otp-request/", { email }, { withCredentials: false, headers: { 'Content-Type': 'application/json' } });
      alert("If an account exists for this email, an OTP or reset link has been sent.");
      navigate("/password-reset/confirm", { state: { email } });
    } catch (err) {
      const errBody = err?.response?.data;
      const status = err?.response?.status;
      let msg = "Couldn't send request.";
      if (!err?.response) msg = "Can't reach the server. Please check your connection or CORS settings.";
      else if (status === 400 && (errBody?.email || errBody?.detail)) {
        msg = (Array.isArray(errBody.email) ? errBody.email[0] : errBody.email) || String(errBody.detail);
      } else if (typeof errBody === "string") msg = errBody;
      else if (errBody) msg = JSON.stringify(errBody);
      alert(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f5f7fa",
      padding: 16,
    }}>
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          padding: 32,
          borderRadius: 12,
          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)")}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.06)")}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src={Logo} alt="App Logo" style={{ height: 64, width: 64 }} />
          <img src={NameImage} alt="App Name" style={{ height: 32, width: 128, marginTop: 8 }} />
        </div>
        <h2 style={{ textAlign: "center", marginBottom: 8 }}>Forgot Password</h2>
        <p style={{ textAlign: "center", marginBottom: 24, color: "#475569" }}>
          Enter the email address linked to your account and we'll send you a reset link.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            type="email"
            placeholder="Email address"
            autoComplete="email"
            {...register("email", {
              required: "Email is required",
              pattern: { value: /[^@\s]+@[^@\s]+\.[^@\s]+/, message: "Enter a valid email" },
            })}
            style={inputStyle}
          />
          {errors.email && <span style={errorStyle}>{errors.email.message}</span>}

          <button type="submit" style={buttonStyle} disabled={sending}>
            {sending ? "Sending..." : "Send reset link"}
          </button>

          <div style={{ textAlign: "center", fontSize: 14 }}>
            <Link to="/login" style={linkStyle}>Back to Sign In</Link>
          </div>
        </form>
      </div>

      <footer className="auth-footer" style={{ position: "absolute", bottom: 16, textAlign: "center", width: "100%", fontSize: 12, color: "#000" }}>
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

const errorStyle = { color: "#dc2626", fontSize: 12 };
const linkStyle = { color: "#3b82f6", textDecoration: "none" };
