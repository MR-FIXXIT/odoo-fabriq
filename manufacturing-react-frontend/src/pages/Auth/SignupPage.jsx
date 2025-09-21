import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../../lib/api";
import Logo from "../../components/Logo.png";
import NameImage from "../../components/nameimage.jpeg";

export default function SignupPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm();
  const [serverError, setServerError] = React.useState("");

  const onSubmit = async (data) => {
    setServerError("");
    try {
      // Map to API payload shape
      const payload = {
        loginid: data.loginId,
        email: data.email,
        password: data.password,
        password2: data.confirmPassword,
        role: "owner",
      };
      const res = await api.post("/account/register/", payload, { withCredentials: false });
      console.log("Signup API success:", { status: res.status, body: res?.data });
      alert("Signup successful!");
      navigate("/login");
    } catch (err) {
      const status = err?.response?.status;
      const respData = err?.response?.data;
      console.error("Signup API error:", { status, data: respData, message: err?.message });

      let msg = "Signup failed. Please try again.";
      if (typeof respData === "string") {
        msg = respData;
      } else if (respData) {
        if (respData.message) msg = respData.message;
        else if (respData.detail) msg = respData.detail;
        else if (typeof respData === "object") {
          const keys = Object.keys(respData);
          if (keys.length) {
            // Set field-specific errors when possible
            keys.forEach((k) => {
              const formKey = k === 'loginid' ? 'loginId' : (k === 'password2' ? 'confirmPassword' : k);
              const val = respData[k];
              const fieldMsg = Array.isArray(val) ? String(val[0]) : (typeof val === 'string' ? val : JSON.stringify(val));
              if (['loginId','email','password','confirmPassword'].includes(formKey)) {
                setError(formKey, { type: 'server', message: fieldMsg });
              }
            });
            const first = respData[keys[0]];
            if (Array.isArray(first) && first.length) msg = String(first[0]);
            else if (typeof first === "string") msg = first;
            else msg = JSON.stringify(respData);
          }
        }
      } else if (err?.message) {
        msg = err.message;
      }
      setServerError(msg);
      // Keep the alert for visibility, but the form now shows inline errors too
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
          <img src={NameImage} alt="App Name" style={{height: 32, width: 128, marginTop: 8}} />
        </div>
        {serverError && (
          <div style={{
            background: '#FEE2E2',
            color: '#991B1B',
            border: '1px solid #FCA5A5',
            padding: '8px 12px',
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 13,
          }}>
            {serverError}
          </div>
        )}
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
