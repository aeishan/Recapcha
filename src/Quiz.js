import React, { useState, useEffect, useCallback } from "react"
import { useNavigate, useLocation, useParams } from "react-router-dom"
import QuizComponent from "./QuizComponent.js"
import "./App.css"

function Quiz({ user, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { quizId } = useParams()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [generatedQuiz, setGeneratedQuiz] = useState(null)
  const [error, setError] = useState("")

  const fetchQuizzes = useCallback(async () => {
    setLoading(true)
    try {
      console.log('=== FETCHING QUIZZES ===');
      console.log('Fetching quizzes for user:', user.email);
      
      const response = await fetch(`http://localhost:5050/api/quiz/user/${user.email}`)
      console.log('=== FETCH RESPONSE ===');
      console.log('Fetch response status:', response.status);
      console.log('Fetch response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json()
        console.log('=== FETCHED QUIZ DATA ===');
        console.log('Fetched quizzes data:', JSON.stringify(data, null, 2));
        console.log('Data type:', typeof data);
        console.log('Is array:', Array.isArray(data));
        console.log('Data length:', data.length);
        
        if (Array.isArray(data)) {
          data.forEach((quiz, index) => {
            console.log(`=== FRONTEND QUIZ ${index} ===`);
            console.log(`Quiz ${index}:`, JSON.stringify(quiz, null, 2));
            console.log(`- UUID: ${quiz.uuid}`);
            console.log(`- Title: ${quiz.title}`);
            console.log(`- Questions count: ${quiz.questions?.length || 0}`);
            console.log(`- Created: ${quiz.createdAt}`);
            
            if (quiz.questions && Array.isArray(quiz.questions)) {
              quiz.questions.forEach((question, qIndex) => {
                console.log(`  Frontend Question ${qIndex}:`, JSON.stringify(question, null, 2));
              });
            }
          });
        }
        
        setQuizzes(data)
        setError("")
      } else {
        const errorData = await response.json()
        console.error('❌ Failed to load quizzes:', errorData);
        setError("Failed to load quizzes")
      }
    } catch (err) {
      console.error('❌ Error loading quizzes:', err)
      setError("Error loading quizzes")
    } finally {
      setLoading(false)
    }
  }, [user.email])

  const fetchIndividualQuiz = useCallback(async (uuid) => {
    setLoading(true)
    try {
      console.log('=== FETCHING INDIVIDUAL QUIZ ===');
      console.log('Quiz UUID:', uuid);
      
      const response = await fetch(`http://localhost:5050/api/quiz/quiz/${uuid}`)
      console.log('Individual quiz response status:', response.status);
      
      if (response.ok) {
        const quizData = await response.json()
        console.log('=== INDIVIDUAL QUIZ DATA ===');
        console.log('Individual quiz data:', JSON.stringify(quizData, null, 2));
        console.log('Questions count:', quizData.questions?.length || 0);
        
        if (quizData.userEmail !== user.email) {
          console.error('❌ Access denied: Quiz belongs to different user');
          setError("Access denied: This quiz doesn't belong to you")
          return
        }
        
        console.log('✅ Quiz ownership verified, setting selected quiz');
        setSelectedQuiz(quizData)
      } else {
        const errorData = await response.json()
        console.error('❌ Failed to fetch individual quiz:', errorData);
        setError("Quiz not found")
      }
    } catch (err) {
      console.error('❌ Error loading individual quiz:', err)
      setError("Error loading quiz")
    } finally {
      setLoading(false)
    }
  }, [user.email])

  useEffect(() => {
    if (!user) {
      navigate("/")
      return
    }

    if (quizId) {
      console.log('=== LOADING INDIVIDUAL QUIZ ===');
      console.log('Quiz ID from URL:', quizId);
      fetchIndividualQuiz(quizId)
    } else {
      console.log('=== LOADING ALL QUIZZES ===');
      fetchQuizzes()
    }
    
    if (location.state?.generatedQuiz && !quizId) {
      console.log('=== USING GENERATED QUIZ FROM STATE ===');
      setGeneratedQuiz(location.state.generatedQuiz)
    }
  }, [user, location.state, quizId, navigate, fetchIndividualQuiz, fetchQuizzes])

  if (!user) {
    navigate("/")
    return null
  }

  // Show individual quiz if loaded
  if (selectedQuiz) {
    console.log('=== RENDERING INDIVIDUAL QUIZ ===');
    console.log('Selected quiz:', JSON.stringify(selectedQuiz, null, 2));
    
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="dashboard-brand-section">
              <div className="dashboard-brand-logo">
                <span className="dashboard-brand-icon">R</span>
                <div className="brand-glow"></div>
              </div>
              <div className="brand-text">
                <h1 className="dashboard-brand-title">recapCHA</h1>
                <p className="dashboard-brand-subtitle">AI Learning Assistant</p>
              </div>
            </div>

            <div className="header-actions">
              <button 
                className="back-button" 
                onClick={() => {
                  setSelectedQuiz(null)
                  navigate("/quiz")
                }}
                style={{
                  background: "rgba(26, 42, 79, 0.1)",
                  color: "#1a2a4f",
                  border: "1px solid rgba(26, 42, 79, 0.2)",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  marginRight: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
                Back to Saved Quizzes
              </button>

              <div className="user-section">
                <div className="user-info">
                  <p className="user-name">{user.firstName} {user.lastName}</p>
                  <p className="user-email">{user.email}</p>
                </div>
                <div className="user-avatar">
                  <span className="avatar-text">{user.firstName.charAt(0).toUpperCase()}</span>
                  <div className="avatar-status"></div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <div style={{ padding: "20px" }}>
            <h2 style={{ textAlign: "center", color: "#1a2a4f", marginBottom: "20px" }}>
              📝 {selectedQuiz.title}
            </h2>
            <p style={{ textAlign: "center", color: "#666", marginBottom: "30px" }}>
              {selectedQuiz.questions?.length || 0} questions • Created: {new Date(selectedQuiz.createdAt).toLocaleDateString()}
            </p>
            <QuizComponent 
              quizData={selectedQuiz.questions || []}
              onSubmit={(score) => {
                console.log('Quiz completed with score:', score);
                // Don't redirect automatically
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Show generated quiz if available (fallback)
  if (generatedQuiz) {
    console.log('=== RENDERING GENERATED QUIZ ===');
    console.log('Generated quiz:', JSON.stringify(generatedQuiz, null, 2));
    
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="dashboard-brand-section">
              <div className="dashboard-brand-logo">
                <span className="dashboard-brand-icon">R</span>
                <div className="brand-glow"></div>
              </div>
              <div className="brand-text">
                <h1 className="dashboard-brand-title">recapCHA</h1>
                <p className="dashboard-brand-subtitle">AI Learning Assistant</p>
              </div>
            </div>

            <div className="header-actions">
              <button 
                className="back-button" 
                onClick={() => setGeneratedQuiz(null)}
                style={{
                  background: "rgba(26, 42, 79, 0.1)",
                  color: "#1a2a4f",
                  border: "1px solid rgba(26, 42, 79, 0.2)",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  marginRight: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
                Back to Saved Quizzes
              </button>

              <div className="user-section">
                <div className="user-info">
                  <p className="user-name">{user.firstName} {user.lastName}</p>
                  <p className="user-email">{user.email}</p>
                </div>
                <div className="user-avatar">
                  <span className="avatar-text">{user.firstName.charAt(0).toUpperCase()}</span>
                  <div className="avatar-status"></div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <div style={{ padding: "20px" }}>
            <h2 style={{ textAlign: "center", color: "#1a2a4f", marginBottom: "20px" }}>
              🎉 Your Fresh Quiz is Ready!
            </h2>
            <p style={{ textAlign: "center", color: "#666", marginBottom: "30px" }}>
              Generated from your recent recording session
            </p>
            <QuizComponent 
              quizData={generatedQuiz}
              onSubmit={(score) => {
                console.log('Quiz completed with score:', score);
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  const firstName = user.firstName
  const fullName = `${user.firstName} ${user.lastName}`

  const handleBackToDashboard = () => {
    navigate("/dashboard")
  }

  const handleQuizClick = (quiz) => {
    console.log('Quiz clicked:', quiz.uuid);
    // Navigate to protected quiz route
    navigate(`/quiz/${quiz.uuid}`)
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="dashboard-brand-section">
            <div className="dashboard-brand-logo">
              <span className="dashboard-brand-icon">R</span>
              <div className="brand-glow"></div>
            </div>
            <div className="brand-text">
              <h1 className="dashboard-brand-title">recapCHA</h1>
              <p className="dashboard-brand-subtitle">AI Learning Assistant</p>
            </div>
          </div>

          <div className="header-actions">
            <button 
              className="back-button" 
              onClick={handleBackToDashboard}
              style={{
                background: "rgba(26, 42, 79, 0.1)",
                color: "#1a2a4f",
                border: "1px solid rgba(26, 42, 79, 0.2)",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "0.9rem",
                fontWeight: "500",
                cursor: "pointer",
                marginRight: "16px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>

            <button 
              onClick={fetchQuizzes}
              style={{
                background: "#1a2a4f",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "0.9rem",
                fontWeight: "500",
                cursor: "pointer",
                marginRight: "16px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
              Refresh
            </button>

            <div className="user-section">
              <div className="user-info">
                <p className="user-name">{fullName}</p>
                <p className="user-email">{user.email}</p>
              </div>
              <div className="user-avatar">
                <span className="avatar-text">{firstName.charAt(0).toUpperCase()}</span>
                <div className="avatar-status"></div>
              </div>
              <button className="logout-button" onClick={onLogout} title="Logout">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16,17 21,12 16,7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="quiz-section" style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>
          <div className="quiz-header" style={{ textAlign: "center", marginBottom: 48 }}>
            <h1 style={{ fontSize: "2.5rem", color: "#1a2a4f", marginBottom: 16 }}>
              📝 Your Saved Quizzes
            </h1>
            <p style={{ fontSize: "1.2rem", color: "#666" }}>
              {quizzes.length > 0 ? `You have ${quizzes.length} quiz${quizzes.length !== 1 ? 'es' : ''} available (sorted by most recent)` : 'No quizzes available yet'}
            </p>
          </div>

          {loading ? (
            <div style={{
              background: "#fff",
              borderRadius: 16,
              padding: 48,
              textAlign: "center",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              border: "1px solid #e5e7eb"
            }}>
              <div style={{ fontSize: 48, marginBottom: 24 }}>⏳</div>
              <p style={{ fontSize: "1.1rem", color: "#666" }}>Loading your quizzes...</p>
            </div>
          ) : error ? (
            <div style={{
              background: "#fff",
              borderRadius: 16,
              padding: 48,
              textAlign: "center",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              border: "1px solid #e5e7eb"
            }}>
              <div style={{ fontSize: 48, marginBottom: 24 }}>❌</div>
              <p style={{ fontSize: "1.1rem", color: "#e74c3c" }}>{error}</p>
              <button 
                onClick={fetchQuizzes}
                style={{
                  background: "#1a2a4f",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 24px",
                  fontSize: "1rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  marginTop: "16px"
                }}
              >
                Try Again
              </button>
            </div>
          ) : quizzes.length === 0 ? (
            <div style={{
              background: "#fff",
              borderRadius: 16,
              padding: 48,
              textAlign: "center",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              border: "1px solid #e5e7eb"
            }}>
              <div style={{ fontSize: 64, marginBottom: 24 }}>📝</div>
              <p style={{ fontSize: "1.1rem", color: "#666", marginBottom: 24 }}>
                No saved quizzes available yet
              </p>
              <p style={{ fontSize: "1rem", color: "#999", marginBottom: 32 }}>
                Start a live transcription session to generate quizzes from your lectures
              </p>
              <button
                onClick={() => navigate("/transcriber")}
                style={{
                  background: "#1a2a4f",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 24px",
                  fontSize: "1rem",
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                Start Recording
              </button>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
              gap: 24,
              marginTop: 32
            }}>
              {quizzes.map((quiz, index) => {
                console.log(`=== RENDERING QUIZ ${index} ===`);
                console.log('Quiz to render:', JSON.stringify(quiz, null, 2));
                console.log('Questions count:', quiz.questions?.length || 0);
                
                return (
                  <div
                    key={quiz.uuid || index}
                    style={{
                      background: "#fff",
                      borderRadius: 16,
                      padding: 24,
                      boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                      border: "1px solid #e5e7eb",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onClick={() => handleQuizClick(quiz)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)"
                      e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.12)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0px)"
                      e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)"
                    }}
                  >
                    <div style={{ marginBottom: 16 }}>
                      <h3 style={{ 
                        fontSize: "1.3rem", 
                        color: "#1a2a4f", 
                        marginBottom: 8,
                        fontWeight: 600
                      }}>
                        {quiz.title}
                      </h3>
                      <p style={{ 
                        color: "#666", 
                        fontSize: "0.9rem",
                        marginBottom: 12
                      }}>
                        Created: {new Date(quiz.createdAt).toLocaleDateString()} at {new Date(quiz.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      marginBottom: 16
                    }}>
                      <span style={{
                        background: "#f0f9ff",
                        color: "#1e40af",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: "0.9rem",
                        fontWeight: 500
                      }}>
                        {quiz.questions?.length || 0} question{(quiz.questions?.length || 0) !== 1 ? 's' : ''}
                      </span>
                      
                      <span style={{
                        background: "#f3f4f6",
                        color: "#6b7280",
                        padding: "4px 8px",
                        borderRadius: 12,
                        fontSize: "0.8rem",
                        fontFamily: "monospace"
                      }}>
                        {quiz.uuid?.substring(0, 8)}...
                      </span>
                    </div>

                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      color: "#1a2a4f"
                    }}>
                      <span style={{ fontWeight: 500 }}>Take Quiz</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 17L17 7" />
                        <path d="M7 7h10v10" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Quiz