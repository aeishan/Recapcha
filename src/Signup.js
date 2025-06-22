import React, { useState } from "react"
import './App.css'

function Signup({ onBackToLogin, onSignupSuccess }) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  // Email validation function
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
  
    // ✅ Validate email format
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
  
    // ✅ Validate password match
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
  
    // ✅ Validate password length
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }
  
    setIsLoading(true);
  
    try {
      const response = await fetch('http://localhost:5050/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
  
      const data = await response.json();
      console.log("Signup successful:", data);
  
      setIsLoading(false);
      alert("Account created successfully! Please sign in.");
      onBackToLogin(); // 👈 Navigate back to login screen
    } catch (error) {
      console.error("Signup error:", error);
      setEmailError(error.message); // You could adjust this based on error type
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* Logo/Brand Section */}
        <div className="brand-section">
          <div className="logo-container">
            <div className="logo-icon">🏢</div>
          </div>
          <h1 className="brand-title">Create Account</h1>
          <p className="brand-subtitle">Join us today and start your journey</p>
        </div>

        <div className="login-card">
          <div className="card-header">
            <h2 className="card-title">Sign Up</h2>
            <p className="card-description">Fill in your information to create an account</p>
          </div>

          <div className="card-content">
            <form onSubmit={handleSubmit} className="login-form">
              {/* First Name & Last Name Row */}
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="firstName" className="form-label">
                    First Name
                  </label>
                  <div className="input-container">
                    <span className="input-icon">👤</span>
                    <input
                      id="firstName"
                      type="text"
                      placeholder="Enter your first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="lastName" className="form-label">
                    Last Name
                  </label>
                  <div className="input-container">
                    <span className="input-icon">👤</span>
                    <input
                      id="lastName"
                      type="text"
                      placeholder="Enter your last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
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
                  <p style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="input-container">
                  <span className="input-icon">🔒</span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
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

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <div className="input-container">
                  <span className="input-icon">🔒</span>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input password-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="password-toggle"
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {passwordError && (
                  <p style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>
                    {passwordError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`submit-button ${isLoading ? 'loading' : ''}`}
              >
                {isLoading ? (
                  <div className="loading-content">
                    <div className="spinner"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <div className="signup-section">
              <p className="signup-text">
                Already have an account?{" "}
                <button
                  type="button"
                  className="signup-link"
                  onClick={onBackToLogin}
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="footer">
          <p className="footer-copyright">© 2024 Your Company. All rights reserved.</p>
          <div className="footer-links">
            <button className="footer-link">Privacy Policy</button>
            <button className="footer-link">Terms of Service</button>
            <button className="footer-link">Support</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup