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

  const { register, handleSubmit, formState: { errors }, setError } = useForm({
    defaultValues: { email: presetEmail }
  });

  const onSubmit = async ({ email, otp, password, confirmPassword }) => {
    if (password !== confirmPassword) {
      setError("confirmPassword", { type: "validate", message: "Passwords do not match" });
      return;
    }

    setSubmitting(true);
    try {
      // Use backend-expected field names
      const payload = { email, new_password: password, re_new_password: confirmPassword, otp };
      console.log("Reset confirm payload keys:", Object.keys(payload));
      await api.post("/password-reset/confirm", payload);
      alert("Password has been reset successfully. You can now sign in.");
      navigate("/login");
    } catch (err) {
      console.error("Reset confirm error:", {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      const errBody = err?.response?.data;
      const status = err?.response?.status;
      let msg = "Password reset failed.";
      if (!err?.response) msg = "Can't reach the server. Please check your connection or CORS settings.";
      else if (status === 400) {
        if (typeof errBody === "string") msg = errBody;
        else if (errBody?.detail) msg = String(errBody.detail);
        else if (errBody?.message) msg = String(errBody.message);
        else if (errBody?.email) msg = Array.isArray(errBody.email) ? errBody.email[0] : String(errBody.email);
        else if (errBody?.otp) msg = Array.isArray(errBody.otp) ? errBody.otp[0] : String(errBody.otp);
        else if (errBody?.new_password) msg = Array.isArray(errBody.new_password) ? errBody.new_password[0] : String(errBody.new_password);
        else if (errBody?.re_new_password) msg = Array.isArray(errBody.re_new_password) ? errBody.re_new_password[0] : String(errBody.re_new_password);
      } else if (typeof errBody === "string") msg = errBody;
      else if (errBody) msg = JSON.stringify(errBody);
      alert(msg);
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
