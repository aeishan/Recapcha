import React, { useState } from "react";

function IndividualQuiz({ quiz, onBack }) {
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  if (!quiz || !quiz.questions) {
    return (
      <div style={{ textAlign: "center", margin: 32 }}>
        <p>Quiz not found.</p>
        <button onClick={onBack}>Back to Quizzes</button>
      </div>
    );
  }

  const handleOptionChange = (qIdx, option) => {
    setUserAnswers((prev) => ({
      ...prev,
      [qIdx]: option,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let correct = 0;
    quiz.questions.forEach((q, idx) => {
      const selected = userAnswers[idx];
      if (selected && q.a[selected] === true) {
        correct += 1;
      }
    });
    setScore(correct);
    setSubmitted(true);
  };

  const getScoreColor = () => {
    const percentage = (score / quiz.questions.length) * 100;
    if (percentage >= 80) return "#27ae60";
    if (percentage >= 60) return "#f39c12";
    return "#e74c3c";
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px" }}>
      <div style={{ marginBottom: 30 }}>
        <button
          onClick={onBack}
          style={{
            background: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            cursor: "pointer",
            marginBottom: 20
          }}
        >
          ← Back to Quizzes
        </button>
        <h1 style={{ color: "#1a2a4f", marginBottom: 8 }}>{quiz.title}</h1>
        <p style={{ color: "#666", fontSize: "0.9rem" }}>
          Created: {new Date(quiz.createdAt).toLocaleDateString()}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
          padding: 32,
        }}
      >
        {quiz.questions.map((q, idx) => (
          <div key={idx} style={{ marginBottom: 28, borderBottom: "1px solid #eee", paddingBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 15, fontSize: "1.1rem", color: "#333" }}>
              {idx + 1}. {q.q}
            </div>
            <div>
              {Object.keys(q.a).map((option) => (
                <label
                  key={option}
                  style={{
                    display: "block",
                    background: submitted && userAnswers[idx] === option
                      ? q.a[option] ? "#d4edda" : "#f8d7da"
                      : "#f8fafc",
                    borderRadius: 8,
                    padding: "12px 16px",
                    marginBottom: 10,
                    cursor: submitted ? "default" : "pointer",
                    border: submitted && userAnswers[idx] === option
                      ? q.a[option] ? "2px solid #27ae60" : "2px solid #e74c3c"
                      : "1px solid #e0e0e0",
                    transition: "all 0.2s ease"
                  }}
                >
                  <input
                    type="radio"
                    name={`question-${idx}`}
                    value={option}
                    checked={userAnswers[idx] === option}
                    onChange={() => handleOptionChange(idx, option)}
                    disabled={submitted}
                    style={{ marginRight: 12 }}
                  />
                  <span style={{ fontSize: "1rem" }}>{option}</span>
                  {submitted && userAnswers[idx] === option && (
                    <span style={{ marginLeft: 10, fontWeight: 600, fontSize: "1.1rem" }}>
                      {q.a[option] ? "✅" : "❌"}
                    </span>
                  )}
                  {submitted && q.a[option] && userAnswers[idx] !== option && (
                    <span style={{ 
                      marginLeft: 10, 
                      fontWeight: 600, 
                      color: "#27ae60",
                      fontSize: "0.9rem"
                    }}>
                      (Correct answer)
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}

        {!submitted && (
          <button
            type="submit"
            style={{
              width: "100%",
              background: "#1a2a4f",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "16px 0",
              fontWeight: 600,
              fontSize: 18,
              cursor: "pointer",
              marginTop: 20,
            }}
          >
            Submit Quiz
          </button>
        )}
      </form>

      {submitted && (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 32,
            marginTop: 24,
            textAlign: "center",
            boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
          }}
        >
          <h2 style={{ color: getScoreColor(), marginBottom: 16, fontSize: "2rem" }}>
            Your Score: {score} / {quiz.questions.length}
          </h2>
          <div style={{ 
            fontSize: "1.2rem", 
            color: getScoreColor(),
            fontWeight: 600,
            marginBottom: 16
          }}>
            {Math.round((score / quiz.questions.length) * 100)}%
          </div>
          <p style={{ color: "#666", fontSize: "1rem" }}>
            {score === quiz.questions.length ? "Perfect! 🎉" :
             score >= quiz.questions.length * 0.8 ? "Great job! 👏" :
             score >= quiz.questions.length * 0.6 ? "Good work! 👍" :
             "Keep studying! 📚"}
          </p>
        </div>
      )}
    </div>
  );
}

export default IndividualQuiz;