import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import CourseModel from "./CourseModel.js";
import QuizModel from "./QuizModel.js";
import { useNavigate } from "react-router-dom";
import { gapi } from "gapi-script";
import GoogleDocButton from "./GoogleDocButton.js";

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const SCOPES =
  "https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file";

function Dashboard({ user, onLogout, onShowQuiz, onShowTranscriber }) {
  const [isRecording, setIsRecording] = useState(false);
  const [showCourseModel, setShowCourseModel] = useState(false);
  const [showQuizModel, setShowQuizModel] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [recordingTimer, setRecordingTimer] = useState(0);

  const tokenClient = useRef(null);
  const accessToken = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function start() {
      gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [
          "https://docs.googleapis.com/$discovery/rest?version=v1",
        ],
      });
    }
    gapi.load("client", start);

    // Wait for GIS script to load
    const interval = setInterval(() => {
      if (
        window.google &&
        window.google.accounts &&
        window.google.accounts.oauth2
      ) {
        tokenClient.current = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (tokenResponse) => {
            accessToken.current = tokenResponse.access_token;
            gapi.client.setToken({ access_token: accessToken.current });
          },
        });
        clearInterval(interval);
      }
    }, 100);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  // Now safe to access user fields
  const fullName = `${user.firstName} ${user.lastName}`;
  const firstName = user.firstName;

  const handleStartRecording = () => {
    if (!isRecording) {
      setShowCourseModel(true);
    } else {
      // Stop recording
      setIsRecording(false);
      setRecordingTimer(0);
      setShowQuizModel(true);
    }
  };

  const handleCourseSelect = (courseId) => {
    setSelectedCourse(courseId);
    setIsRecording(true);
    setShowCourseModel(false);

    // Start timer simulation
    const timer = setInterval(() => {
      setRecordingTimer((prev) => prev + 1);
    }, 1000);

    // Auto stop after 10 seconds for demo (remove this in real app)
    setTimeout(() => {
      clearInterval(timer);
      if (isRecording) {
        setIsRecording(false);
        setRecordingTimer(0);
        setShowQuizModel(true);
      }
    }, 10000);
  };

  const handleTakeQuiz = () => {
    setShowQuizModel(false);
    onShowQuiz(selectedCourse);
  };

  const handleBackToDashboard = () => {
    setShowQuizModel(false);
    setSelectedCourse("");
  };

  const handleLogout = () => {
    console.log("Logging out...");
    onLogout(); // Call the logout function passed from App.js
    setTimeout(() => navigate("/"), 0); // Allow state update to complete
  };

  const getCourseName = (courseId) => {
    const courseNames = {
      calculus: "Calculus",
      "linear-algebra": "Linear Algebra",
      biology: "Biology",
      physics: "Physics",
      chemistry: "Chemistry",
      history: "History",
      music: "Music",
    };
    return courseNames[courseId] || courseId;
  };

  const realRecording = () => {
    navigate("/transcriber");
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const quickActions = [
    {
      title: "Start Live Transcription",
      description: "Begin recording and transcribing audio",
      icon: "🎤", // (Replace with FontAwesomeIcon if you wish)
      color: "green",
      action: onShowTranscriber, // This opens the LiveTranscriber page!
    },
    {
      title: "Take Quiz",
      description: "Test your knowledge with AI-generated questions",
      icon: "🧠",
      color: "purple",
      action: () => console.log("Navigate to Quiz"),
    }
  ];

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="dashboard-brand-section">
            <div className="dashboard-brand-logo">
              <span className="dashboard-brand-icon">R</span>
            </div>
            <h1 className="dashboard-brand-title">recapCHA</h1>
          </div>

          <div className="header-actions">
            {/* User Menu */}
            <div className="user-section">
              <div className="user-info">
                <p className="user-name">{fullName}</p>
                <p className="user-email">{user.email}</p>
              </div>
              <div className="user-avatar">
                <span>👤</span>
              </div>
              <button className="logout-button" onClick={onLogout}>
                🚪
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h2 className="welcome-title">Welcome back, {firstName}! 👋</h2>
          <p className="welcome-subtitle">
            Ready to continue your learning journey? Here's what's happening
            today.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h3 className="section-title">Quick Actions</h3>
          <div className="actions-grid">
            {quickActions.map((action, index) => (
              <div key={index} className="action-card" onClick={action.action}>
                <div className="action-content">
                  <div className={`action-icon ${action.color}`}>
                    <span>{action.icon}</span>
                  </div>
                  <div className="action-text">
                    <h4 className="action-title">{action.title}</h4>
                    <p className="action-description">{action.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Models */}
        <CourseModel
          isOpen={showCourseModel}
          onClose={() => setShowCourseModel(false)}
          onSelectCourse={handleCourseSelect}
        />

        <QuizModel
          isOpen={showQuizModel}
          onClose={handleBackToDashboard}
          onTakeQuiz={handleTakeQuiz}
          courseName={getCourseName(selectedCourse)}
        />
      </div>
    </div>
  );
}

export default Dashboard;
