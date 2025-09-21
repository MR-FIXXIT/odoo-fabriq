import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../../lib/api";
import Logo from "../../components/Logo.png";
import NameImage from "../../components/nameimage.jpeg";

export default function ResetPasswordConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const presetEmail = useMemo(() => location?.state?.email || "", [location?.state?.email]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, formState: { errors }, setError, clearErrors } = useForm({
    defaultValues: { email: presetEmail }
  });

  const mapServerErrorsToForm = (errBody) => {
    if (!errBody || typeof errBody !== 'object') return null;
    // errBody may be { field: [msg, ...] } or { detail: '...' }
    const fieldMap = {
      new_password: 'password',
      re_new_password: 'confirmPassword',
      confirm_password: 'confirmPassword',
      password: 'password',
      otp: 'otp',
      email: 'email',
    };

    let aggregated = null;
    Object.entries(errBody).forEach(([key, val]) => {
      const targetField = fieldMap[key] || null;
      const message = Array.isArray(val) ? val.join(' ') : String(val);
      if (targetField) {
        setError(targetField, { type: 'server', message });
      } else {
        aggregated = aggregated ? `${aggregated} ${message}` : message;
      }
    });
    return aggregated;
  };

  const onSubmit = async ({ email, otp, password, confirmPassword }) => {
    clearErrors();
    setServerError("");

    if (password !== confirmPassword) {
      setError("confirmPassword", { type: "validate", message: "Passwords do not match" });
      return;
    }

    setSubmitting(true);
    try {
      // Use backend-expected field names
      const payload = { email, new_password: password, re_new_password: confirmPassword, otp };
      // POST to trailing-slash endpoint (Django APPEND_SLASH)
      // Do not send credentials (cookies) for this unauthenticated endpoint to avoid CSRF enforcement issues with corsheaders
      await api.post("/account/password-reset/confirm/", payload, { withCredentials: false, headers: { 'Content-Type': 'application/json' } });
      // On success navigate to login with a small success hint
      navigate("/login", { state: { resetSuccess: true } });
    } catch (err) {
      // Map server validation errors to form fields when possible
      const errBody = err?.response?.data;
      const status = err?.response?.status;
      if (status === 400 && errBody) {
        const agg = mapServerErrorsToForm(errBody);
        if (agg) setServerError(agg);
      } else if (!err?.response) {
        setServerError("Can't reach the server. Please check your connection or CORS settings.");
      } else {
        setServerError(errBody?.detail || errBody?.message || JSON.stringify(errBody));
      }
    } finally {
      setSubmitting(false);
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

        <h2 style={{ textAlign: "center", marginBottom: 8 }}>Reset Password</h2>
        <p style={{ textAlign: "center", marginBottom: 24, color: "#475569" }}>
          Enter the OTP sent to your email and choose a new password.
        </p>

        {serverError && (
          <div style={{ marginBottom: 12, padding: 10, background: "#fff4f4", border: "1px solid #ffd7d7", color: "#9b1c1c", borderRadius: 6 }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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

          <input
            type="text"
            placeholder="OTP"
            {...register("otp", { required: "OTP is required" })}
            style={inputStyle}
          />
          {errors.otp && <span style={errorStyle}>{errors.otp.message}</span>}

          <input
            type="password"
            placeholder="New password"
            autoComplete="new-password"
            {...register("password", { required: "Password is required", minLength: { value: 6, message: "At least 6 characters" } })}
            style={inputStyle}
          />
          {errors.password && <span style={errorStyle}>{errors.password.message}</span>}

          <input
            type="password"
            placeholder="Confirm new password"
            autoComplete="new-password"
            {...register("confirmPassword", { required: "Confirm your new password" })}
            style={inputStyle}
          />
          {errors.confirmPassword && <span style={errorStyle}>{errors.confirmPassword.message}</span>}

          <button type="submit" style={buttonStyle} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
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
