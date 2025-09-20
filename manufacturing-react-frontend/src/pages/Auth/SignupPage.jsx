import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    const success = signup(data.loginId, data.email, data.password);
    if (success) {
      alert("Signup successful!");
      navigate("/login");
    } else {
      alert("Signup failed. User may already exist.");
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
        <img src="src\components\Logo.png" alt="App Logo" style={{height: 64, width: 64}} />
        <img src="src\components\nameimage.jpeg" alt="App Logo" style={{height: 32, width: 128, marginTop: 8}} />

      </div>
        <form onSubmit={handleSubmit(onSubmit)} style={{display: "flex", flexDirection: "column", gap: 16}}>
          <input
            type="text"
            placeholder="Login Id"
            {...register("loginId", {
              required: "Login Id required",
              minLength: { value: 6, message: "Min 6 chars" },
              maxLength: { value: 12, message: "Max 12 chars" },
            })}
            style={inputStyle}
          />
          {errors.loginId && <span style={errorStyle}>{errors.loginId.message}</span>}

          <input
            type="email"
            placeholder="Email"
            {...register("email", {
              required: "Email required",
              pattern: { value: /^\S+@\S+$/i, message: "Invalid email" }
            })}
            style={inputStyle}
          />
          {errors.email && <span style={errorStyle}>{errors.email.message}</span>}

          <input
            type="password"
            placeholder="Password"
            {...register("password", {
              required: "Password required",
              minLength: { value: 8, message: "Min 8 chars" },
              validate: {
                hasUpper: (v) => /[A-Z]/.test(v) || "Must contain uppercase letter",
                hasLower: (v) => /[a-z]/.test(v) || "Must contain lowercase letter",
                hasSpecial: (v) => /[!@#$%^&*]/.test(v) || "Must contain special char",
                notSameAsLogin: (v) => v !== watch("loginId") || "Cannot be same as login id",
              },
            })}
            style={inputStyle}
          />
          {errors.password && <span style={errorStyle}>{errors.password.message}</span>}

          <input
            type="password"
            placeholder="Re-enter Password"
            {...register("confirmPassword", {
              validate: (value) =>
                value === watch("password") || "Passwords do not match",
            })}
            style={inputStyle}
          />
          {errors.confirmPassword && <span style={errorStyle}>{errors.confirmPassword.message}</span>}

          <button type="submit" style={buttonStyle}>SIGN UP</button>

          <div style={{textAlign: "center", fontSize: 14}}>
            Already have an account? <Link to="/login" style={linkStyle}>Login</Link>
          </div>
        </form>
      </div>
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
  backgroundColor: "#059669",
  color: "#fff",
  fontWeight: "bold",
  border: "none",
  cursor: "pointer",
};

const errorStyle = {color: "#dc2626", fontSize: 12};
const linkStyle = {color: "#3b82f6", textDecoration: "none"};
