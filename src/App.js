import "./App.css";
import React, { useState } from "react";
import Dashboard from "./Dashboard.js";
import Signup from "./Signup.js";
import LoginPage from "./Login.js";
import QuizPage from "./QuizPage.js";
import { Routes, Route } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import LiveTranscriber from "./LiveTranscriber.js";

function App() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSignup, setShowSignup] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCourse, setQuizCourse] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showTranscriber, setShowTranscriber] = useState(false);

  // Email validation function
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError(""); // Clear previous errors

    // Check if email is valid format
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    // Simulate API call

    try {
      const response = await fetch("http://localhost:5050/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      console.log("Login successful:", data);
      setIsLoggedIn(true);
      setIsLoading(false);
      setCurrentUser(data);

      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed: " + error.message);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setShowSignup(false);
    setShowQuiz(false);
    setQuizCourse("");
    setEmail("");
    setPassword("");
    setRememberMe(false);
    setEmailError(""); // Clear email error on logout
    console.log("User logged out");
  };

  const handleShowSignup = () => {
    navigate("/signup");
  };

  const handleBackToLogin = () => {
    navigate("/");
  };

  const handleShowQuiz = (course) => {
    navigate("/quiz");
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  // 4. Otherwise, show login form
  return (
    <Routes>
      {!isLoggedIn ? (
        <>
          <Route
            path="/"
            element={
              <LoginPage
                email={email}
                password={password}
                setEmail={setEmail}
                setPassword={setPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                rememberMe={rememberMe}
                setRememberMe={setRememberMe}
                handleSubmit={handleSubmit}
                emailError={emailError}
                isLoading={isLoading}
                handleShowSignup={handleShowSignup}
                setCurrentUser={setCurrentUser}
                setIsLoggedIn={setIsLoggedIn}
              />
            }
          />
          <Route
            path="/signup"
            element={<Signup onBackToLogin={handleBackToLogin} />}
          />
        </>
      ) : (
        <>
          <Route
            path="/dashboard"
            element={
              <Dashboard
                user={currentUser}
                onLogout={handleLogout}
                onShowQuiz={handleShowQuiz}
              />
            }
          />
          <Route
            path="/quiz"
            element={<QuizPage onBackToDashboard={handleBackToDashboard} />}
          />
          <Route
            path="/transcriber"
            element={<LiveTranscriber onBack={() => navigate("/dashboard")} />}
          />
        </>
      )}
    </Routes>
  );
}

export default App;
