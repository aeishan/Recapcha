import React, { useState } from "react"
import './App.css'

function Dashboard({ onLogout }) {
  const [isRecording, setIsRecording] = useState(false)
  const [user] = useState({ name: "John Doe", email: "john@example.com" })

  const handleStartRecording = () => {
    setIsRecording(!isRecording)
    console.log(isRecording ? "Stopping recording..." : "Starting recording...")
  }

  const handleLogout = () => {
    console.log("Logging out...")
    onLogout() // Call the logout function passed from App.js
  }

  const stats = [
    { title: "Total Sessions", value: "24", icon: "⏰", trend: "+12%" },
    { title: "Flashcards Created", value: "156", icon: "📄", trend: "+8%" },
    { title: "Quizzes Completed", value: "18", icon: "🧠", trend: "+15%" },
    { title: "Study Time", value: "42h", icon: "📈", trend: "+23%" },
  ]

  const quickActions = [
    {
      title: "Start Live Transcription",
      description: "Begin recording and transcribing audio",
      icon: "🎤",
      color: "green",
      action: () => console.log("Navigate to Live Transcription"),
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
  ]

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
            {/* Quick Record Button */}
            <button
              onClick={handleStartRecording}
              className={`record-button ${isRecording ? 'recording' : ''}`}
            >
              <span className="record-icon">
                {isRecording ? "⏸️" : "▶️"}
              </span>
              {isRecording ? "Stop Recording" : "Quick Record"}
            </button>

            {/* User Menu */}
            <div className="user-section">
              <div className="user-info">
                <p className="user-name">{user.name}</p>
                <p className="user-email">{user.email}</p>
              </div>
              <div className="user-avatar">
                <span>👤</span>
              </div>
              <button className="logout-button" onClick={handleLogout}>
                🚪
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h2 className="welcome-title">Welcome back, {user.name.split(" ")[0]}! 👋</h2>
          <p className="welcome-subtitle">Ready to continue your learning journey? Here's what's happening today.</p>
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
          </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-section">
          <div className="activity-card">
            <div className="card-header">
              <h3 className="card-title">Recent Sessions</h3>
              <p className="card-description">Your latest transcription sessions</p>
            </div>
            <div className="card-content">
              <div className="sessions-list">
                {[
                  { title: "Biology Lecture - Chapter 5", time: "2 hours ago", duration: "45 min" },
                  { title: "History Notes Review", time: "1 day ago", duration: "32 min" },
                  { title: "Math Problem Solving", time: "2 days ago", duration: "28 min" },
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
              <p className="card-description">Your learning achievements this week</p>
            </div>
            <div className="card-content">
              <div className="progress-list">
                <div className="progress-item">
                  <div className="progress-info">
                    <span className="progress-label">Flashcards Reviewed</span>
                    <span className="progress-value">24/30</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill blue" style={{ width: "80%" }}></div>
                  </div>
                </div>

                <div className="progress-item">
                  <div className="progress-info">
                    <span className="progress-label">Quiz Accuracy</span>
                    <span className="progress-value">87%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill green" style={{ width: "87%" }}></div>
                  </div>
                </div>

                <div className="progress-item">
                  <div className="progress-info">
                    <span className="progress-label">Study Streak</span>
                    <span className="progress-value">7 days 🔥</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill orange" style={{ width: "70%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard