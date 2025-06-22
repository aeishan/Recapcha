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

  const stats = [
    { title: "Total Sessions", value: "24", icon: "⏰", trend: "+12%" },
    { title: "Flashcards Created", value: "156", icon: "📄", trend: "+8%" },
    { title: "Quizzes Completed", value: "18", icon: "🧠", trend: "+15%" },
    { title: "Study Time", value: "42h", icon: "📈", trend: "+23%" },
  ];

  const quickActions = [
    {
      title: "Start Live Transcription",
      description: "Begin recording and transcribing audio",
      icon: "🎤",
      color: "green",
      action: onShowTranscriber,
    },
    {
      title: "View Flashcards",
      description: "Review your generated flashcards",
      icon: "📚",
      color: "blue",
      action: () => console.log("Navigate to Flashcards"),
    },
    {
      title: "Take Quiz",
      description: "Test your knowledge with AI-generated questions",
      icon: "🧠",
      color: "purple",
      action: () => console.log("Navigate to Quiz"),
    },
    {
      title: "View Analytics",
      description: "Track your learning progress",
      icon: "📊",
      color: "orange",
      action: () => console.log("Navigate to Analytics"),
    },
  ];

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="dashboard-brand-section">
            <div className="dashboard-brand-logo">
              <span className="dashboard-brand-icon">ST</span>
            </div>
            <h1 className="dashboard-brand-title">Study Transcriber</h1>
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

        {/* Stats Cards */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-content">
                <div className="stat-info">
                  <p className="stat-label">{stat.title}</p>
                  <p className="stat-value">{stat.value}</p>
                  <p className="stat-trend">{stat.trend}</p>
                </div>
                <div className="stat-icon">
                  <span>{stat.icon}</span>
                </div>
              </div>
            </div>
          ))}
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
            {/* Google Doc Button as a separate component */}
            <GoogleDocButton />
            <button className="action-card" onClick={realRecording}>
              Start Live Transcription
            </button>{" "}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-section">
          <div className="activity-card">
            <div className="card-header">
              <h3 className="card-title">Recent Sessions</h3>
              <p className="card-description">
                Your latest transcription sessions
              </p>
            </div>
            <div className="card-content">
              <div className="sessions-list">
                {[
                  {
                    title: "Biology Lecture - Chapter 5",
                    time: "2 hours ago",
                    duration: "45 min",
                  },
                  {
                    title: "History Notes Review",
                    time: "1 day ago",
                    duration: "32 min",
                  },
                  {
                    title: "Math Problem Solving",
                    time: "2 days ago",
                    duration: "28 min",
                  },
                ].map((session, index) => (
                  <div key={index} className="session-item">
                    <div className="session-info">
                      <p className="session-title">{session.title}</p>
                      <p className="session-time">{session.time}</p>
                    </div>
                    <span className="session-duration">{session.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="activity-card">
            <div className="card-header">
              <h3 className="card-title">Study Progress</h3>
              <p className="card-description">
                Your learning achievements this week
              </p>
            </div>
            <div className="card-content">
              <div className="progress-list">
                <div className="progress-item">
                  <div className="progress-info">
                    <span className="progress-label">Flashcards Reviewed</span>
                    <span className="progress-value">24/30</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill blue"
                      style={{ width: "80%" }}
                    ></div>
                  </div>
                </div>

                <div className="progress-item">
                  <div className="progress-info">
                    <span className="progress-label">Quiz Accuracy</span>
                    <span className="progress-value">87%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill green"
                      style={{ width: "87%" }}
                    ></div>
                  </div>
                </div>

                <div className="progress-item">
                  <div className="progress-info">
                    <span className="progress-label">Study Streak</span>
                    <span className="progress-value">7 days 🔥</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill orange"
                      style={{ width: "70%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
  );
}

export default Dashboard;
