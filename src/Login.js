import React from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = ({
  email,
  password,
  setEmail,
  setPassword,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  handleSubmit,
  emailError,
  isLoading,
  handleShowSignup,
  setCurrentUser,
  setIsLoggedIn
}) => {

    const navigate = useNavigate();

    // Dev login handler (only for login page)
  const handleDevLogin = () => {
    setCurrentUser({
      firstName: 'Dev',
      lastName: 'User',
      email: 'dev@localhost',
      _id: 'dev123',
      googleClientId: process.env.REACT_APP_GOOGLE_CLIENT_ID // from .env
    });
    setIsLoggedIn(true);
    navigate("/dashboard"); // Redirect to dashboard
  };
  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* Logo/Brand Section */}
        <div className="brand-section">
          <div className="logo-container">
            <div className="logo-icon">🏢</div>
          </div>
          <h1 className="brand-title">Welcome Back</h1>
          <p className="brand-subtitle">Sign in to your account to continue</p>
        </div>

        <div className="login-card">
          <div className="card-header">
            <h2 className="card-title">Sign In</h2>
            <p className="card-description">
              Enter your credentials to access your account
            </p>
          </div>

          <div className="card-content">
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <div className="input-container">
                  <span className="input-icon">📧</span>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
                {emailError && (
                  <p
                    style={{ color: "red", fontSize: "14px", marginTop: "5px" }}
                  >
                    {emailError}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="input-container">
                  <span className="input-icon">🔒</span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input password-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <div className="checkbox-container">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="form-checkbox"
                  />
                  <label htmlFor="remember" className="checkbox-label">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    alert("Password reset functionality would be implemented here")
                  }
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`submit-button ${isLoading ? "loading" : ""}`}
              >
                {isLoading ? (
                  <div className="loading-content">
                    <div className="spinner"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
            {/* Dev Login Button: only on login page, bypasses to dashboard */}
            <button
              type="button"
              style={{ marginTop: '10px', background: '#eee', color: '#333', border: '1px solid #ccc' }}
              onClick={handleDevLogin}
            >
              Dev Login (Bypass to Dashboard)
            </button>

            <div className="signup-section">
              <p className="signup-text">
                Don't have an account?{" "}
                <button
                  type="button"
                  className="signup-link"
                  onClick={handleShowSignup}
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="footer">
          <p className="footer-copyright">
            © 2024 Your Company. All rights reserved.
          </p>
          <div className="footer-links">
            <button className="footer-link">Privacy Policy</button>
            <button className="footer-link">Terms of Service</button>
            <button className="footer-link">Support</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;