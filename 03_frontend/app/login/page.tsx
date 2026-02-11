"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function getApiBase(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:3001";
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3001";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const apiBase = getApiBase();

    try {
      const res = await fetch("https://demo.jarvisprime.io/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("Login failed");
      }

      const data = await res.json();
      const token = data.accessToken;

      if (!token) {
        throw new Error("No accessToken returned");
      }

      localStorage.setItem("jp_accessToken", token);
      router.push("/orders");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">JP</div>
          <h1>Sign in to Jarvis Prime</h1>
          <p>Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSignIn} className="login-form">
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=".............."
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="sign-in-btn" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
          {errorMsg && <p className="error-msg">{errorMsg}</p>}
        </form>

        <div className="login-footer">
          <span>Demo mode - any credentials accepted</span>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 96px);
          padding: 40px 20px;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 40px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          color: #fff;
          margin: 0 auto 20px;
        }

        .login-header h1 {
          font-size: 22px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 8px;
          letter-spacing: -0.3px;
        }

        .login-header p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-field label {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
        }

        .form-field input {
          height: 44px;
          padding: 0 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-size: 14px;
          color: #fff;
          transition: all 0.15s ease;
        }

        .form-field input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .form-field input:focus {
          outline: none;
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.08);
        }

        .sign-in-btn {
          height: 46px;
          margin-top: 8px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sign-in-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
        }

        .sign-in-btn:active {
          transform: translateY(0);
        }

        .sign-in-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .error-msg {
          font-size: 13px;
          color: #f87171;
          margin: 12px 0 0;
          padding: 0;
          line-height: 1.4;
        }

        .login-footer {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          text-align: center;
        }

        .login-footer span {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.35);
        }
      `}</style>
    </div>
  );
}
