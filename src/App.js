import React, { useState } from "react"
import './App.css'
import Dashboard from './Dashboard.js';
import Signup from './Signup.js';
import QuizPage from './QuizPage.js';
import LiveTranscriber from './LiveTranscriber.js'


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [showSignup, setShowSignup] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizCourse, setQuizCourse] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [showTranscriber, setShowTranscriber] = useState(false)
 
  // Email validation function
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEmailError("") // Clear previous errors
    
    // Check if email is valid format
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address')
      return
    }
    
    setIsLoading(true)

    // Simulate API call
    // await new Promise((resolve) => setTimeout(resolve, 1500))

    try{
      const response = await fetch('http://localhost:5050/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Login failed')
      }

      const data = await response.json()
      console.log("Login successful:", data)
      setIsLoggedIn(true)
      setIsLoading(false)
      setCurrentUser( data )

    } catch (error) {
      console.error("Login error:", error)
      alert("Login failed: " + error.message)
      setIsLoading(false)
    }


    // console.log("Login attempt:", { email, password, rememberMe })
    
    // setIsLoading(false)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentUser(null)
    setShowSignup(false)
    setShowQuiz(false)
    setQuizCourse("")
    setEmail("")
    setPassword("")
    setRememberMe(false)
    setEmailError("") // Clear email error on logout
    console.log("User logged out")
  }

  const handleShowSignup = () => {
    setShowSignup(true)
    setEmailError("") // Clear any login errors
  }

  const handleBackToLogin = () => {
    setShowSignup(false)
    setEmailError("") // Clear any signup errors
  }


  const handleShowQuiz = (course) => {
    setQuizCourse(course)
    setShowQuiz(true)
  }

  const handleBackToDashboard = () => {
    setShowQuiz(false)
    setQuizCourse("")
  }

  // If showing quiz, show quiz page
  if (showQuiz && quizCourse) {
    return <QuizPage course={quizCourse} onBackToDashboard={handleBackToDashboard} />
  }
    
  // 1. If showing transcriber, show it first
  if (showTranscriber) {
    return <LiveTranscriber onBack={() => setShowTranscriber(false)} />
  }    

  // 2. If logged in, show dashboard
  if (isLoggedIn && currentUser) {
     return (
      <Dashboard
        user={currentUser}
        onShowTranscriber={() => setShowTranscriber(true)}
        onLogout={handleLogout}
      />
    )

  }

  // 3. If showing signup, show signup page
  if (showSignup) {
    return <Signup onBackToLogin={handleBackToLogin} />
  }

  // 4. Otherwise, show login form
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
            <p className="card-description">Enter your credentials to access your account</p>
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
                  <p style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>
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
                  onClick={() => alert("Password reset functionality would be implemented here")}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`submit-button ${isLoading ? 'loading' : ''}`}
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

export default App