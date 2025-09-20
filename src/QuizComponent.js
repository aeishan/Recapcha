import React, { useState } from "react";

function QuizComponent({ quizData, onSubmit }) {
  console.log("=== QUIZ COMPONENT RENDERED ===");
  console.log("QuizData received:", JSON.stringify(quizData, null, 2));
  console.log("QuizData length:", quizData?.length || 0);
  console.log("QuizData type:", typeof quizData);
  console.log("Is array:", Array.isArray(quizData));

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  // Validate quiz data
  if (!quizData || !Array.isArray(quizData) || quizData.length === 0) {
    console.error("❌ Invalid quiz data provided to QuizComponent");
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 48,
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 24 }}>❌</div>
        <p style={{ fontSize: "1.1rem", color: "#e74c3c" }}>
          No quiz questions available
        </p>
        <p style={{ fontSize: "0.9rem", color: "#666", marginTop: 8 }}>
          Quiz data: {JSON.stringify(quizData)}
        </p>
      </div>
    );
  }

  // Log each question for debugging
  quizData.forEach((question, index) => {
    console.log(`=== QUESTION ${index} ===`);
    console.log("Question object:", JSON.stringify(question, null, 2));
    console.log("Question text (q):", question.q);
    console.log("Answers (a):", question.a);
    console.log("Answers type:", typeof question.a);

    if (question.a && typeof question.a === "object") {
      Object.entries(question.a).forEach(([key, value]) => {
        console.log(`  Answer "${key}": ${value} (type: ${typeof value})`);
      });
    }
  });

  const currentQuestionData = quizData[currentQuestion];
  console.log("=== CURRENT QUESTION DATA ===");
  console.log("Current question index:", currentQuestion);
  console.log(
    "Current question data:",
    JSON.stringify(currentQuestionData, null, 2)
  );

  const handleAnswerSelect = (answerKey) => {
    console.log("Answer selected:", answerKey);
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: answerKey,
    });
  };

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate score
      let correctAnswers = 0;
      quizData.forEach((question, index) => {
        const selectedAnswer = selectedAnswers[index];
        console.log(`Checking question ${index}: selected="${selectedAnswer}", correct answer check:`, question.a);
        
        if (selectedAnswer && question.a && question.a[selectedAnswer] === true) {
          correctAnswers++;
          console.log(`Question ${index}: CORRECT`);
        } else {
          console.log(`Question ${index}: INCORRECT`);
        }
      });

      const finalScore = (correctAnswers / quizData.length) * 100;
      console.log(`Final score: ${correctAnswers}/${quizData.length} = ${finalScore}%`);
      setScore(finalScore);
      setShowResults(true);

      if (onSubmit) {
        onSubmit(finalScore);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
  };

  if (showResults) {
    const correctAnswers = Math.round((score / 100) * quizData.length);

    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 48,
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          border: "1px solid #e5e7eb",
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 24 }}>
          {score >= 70 ? "🎉" : score >= 50 ? "👍" : "📚"}
        </div>
        <h2
          style={{
            fontSize: "2rem",
            color: "#1a2a4f",
            marginBottom: 16,
          }}
        >
          Quiz Complete!
        </h2>
        <p
          style={{
            fontSize: "1.5rem",
            color: score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444",
            fontWeight: "600",
            marginBottom: 16,
          }}
        >
          Score: {Math.round(score)}%
        </p>
        <p
          style={{
            fontSize: "1.1rem",
            color: "#666",
            marginBottom: 32,
          }}
        >
          You got {correctAnswers} out of {quizData.length} questions correct
        </p>

        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button
            onClick={resetQuiz}
            style={{
              background: "#1a2a4f",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 24px",
              fontSize: "1rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestionData) {
    console.error("❌ No current question data available");
    return (
      <div style={{ textAlign: "center", padding: 20 }}>
        <p>Error: Question data not found</p>
        <p>Current question index: {currentQuestion}</p>
        <p>Total questions: {quizData.length}</p>
      </div>
    );
  }

  const answers = currentQuestionData.a || {};
  const answerKeys = Object.keys(answers);

  console.log("=== RENDERING QUESTION ===");
  console.log("Question text:", currentQuestionData.q);
  console.log("Answers object:", answers);
  console.log("Answer keys:", answerKeys);
  console.log("Answer keys length:", answerKeys.length);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 32,
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        border: "1px solid #e5e7eb",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      {/* Progress bar */}
      <div
        style={{
          background: "#f3f4f6",
          height: 8,
          borderRadius: 4,
          marginBottom: 32,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "#1a2a4f",
            height: "100%",
            width: `${((currentQuestion + 1) / quizData.length) * 100}%`,
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* Question counter */}
      <p
        style={{
          fontSize: "0.9rem",
          color: "#666",
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        Question {currentQuestion + 1} of {quizData.length}
      </p>

      {/* Question */}
      <h2
        style={{
          fontSize: "1.5rem",
          color: "#1a2a4f",
          marginBottom: 32,
          lineHeight: 1.4,
        }}
      >
        {currentQuestionData.q}
      </h2>

      {/* Answer options */}
      <div style={{ marginBottom: 32 }}>
        {answerKeys.length > 0 ? (
          answerKeys.map((answerKey, index) => {
            const isSelected = selectedAnswers[currentQuestion] === answerKey;
            
            console.log(`Rendering answer ${index}: "${answerKey}" (selected: ${isSelected})`);

            return (
              <button
                key={`${currentQuestion}-${answerKey}-${index}`} // More unique key
                onClick={() => handleAnswerSelect(answerKey)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "16px 20px",
                  marginBottom: 12,
                  border: `2px solid ${isSelected ? "#1a2a4f" : "#e5e7eb"}`,
                  borderRadius: 12,
                  background: isSelected ? "#f8fafc" : "#fff",
                  color: isSelected ? "#1a2a4f" : "#374151",
                  fontSize: "1rem",
                  fontWeight: isSelected ? "600" : "400",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.target.style.borderColor = "#9ca3af";
                    e.target.style.background = "#f9fafb";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.background = "#fff";
                  }
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: isSelected ? "#1a2a4f" : "#e5e7eb",
                    color: isSelected ? "#fff" : "#9ca3af",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    lineHeight: "24px",
                    textAlign: "center",
                    marginRight: 12,
                  }}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                {answerKey}
              </button>
            );
          })
        ) : (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: "#ef4444",
              background: "#fef2f2",
              borderRadius: 8,
              border: "1px solid #fecaca",
            }}
          >
            <p>❌ No answer options available for this question</p>
            <p style={{ fontSize: "0.9rem", marginTop: 8 }}>
              Raw question data: {JSON.stringify(currentQuestionData, null, 2)}
            </p>
            <p style={{ fontSize: "0.9rem", marginTop: 8 }}>
              Answers object: {JSON.stringify(answers, null, 2)}
            </p>
            <p style={{ fontSize: "0.9rem", marginTop: 8 }}>
              Answer keys: {JSON.stringify(answerKeys, null, 2)}
            </p>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          style={{
            background: currentQuestion === 0 ? "#f3f4f6" : "rgba(26, 42, 79, 0.1)",
            color: currentQuestion === 0 ? "#9ca3af" : "#1a2a4f",
            border: "none",
            borderRadius: 8,
            padding: "12px 20px",
            fontSize: "1rem",
            fontWeight: 500,
            cursor: currentQuestion === 0 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={!selectedAnswers[currentQuestion]}
          style={{
            background: !selectedAnswers[currentQuestion] ? "#f3f4f6" : "#1a2a4f",
            color: !selectedAnswers[currentQuestion] ? "#9ca3af" : "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 20px",
            fontSize: "1rem",
            fontWeight: 500,
            cursor: !selectedAnswers[currentQuestion] ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {currentQuestion === quizData.length - 1 ? "Finish Quiz" : "Next"}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default QuizComponent;