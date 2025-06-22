import React, { useState, useRef } from "react"
import GoogleDocButton from "./GoogleDocButton.js"

const DG_KEY = process.env.REACT_APP_DEEPGRAM_API_KEY;
const OPENAI_KEY = process.env.REACT_APP_OPENAI_API;

export default function LiveTranscriber({ onBack }) {
  const [isRecording, setIsRecording] = useState(false)
  const [micStatus, setMicStatus] = useState('')
  const [transcript, setTranscript] = useState('')
  const [chunkNotes, setChunkNotes] = useState([]) // Array of {section, content}
  const [quizData, setQuizData] = useState([]) // Store all quiz questions
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [noteFile, setNoteFile] = useState('') // Store .txt content
  const [quizFile, setQuizFile] = useState('') // Store .json content
  const [docJson, setDocJson] = useState([]) // Store beautified JSON for Google Doc
  const [view, setView] = useState('transcript') // 'transcript' or 'notes'
  const wordBufferRef = useRef([])
  const mediaRecorderRef = useRef(null)
  const socketRef = useRef(null)

  // Helper: call OpenAI for notes (for .txt), quiz JSON, and Google Doc JSON
  async function getNotesForChunk(text, allNotes, fullTranscript) {
    setIsSummarizing(true)

    // Prompt for .txt file (clean, for site display)
    const txtPrompt = `
You are an expert note-taker. Given the following transcript chunk, generate a grammatically correct and accurate plain text summary for a React site. Use clear section headers (surrounded by ===), bullet points (start with "- "), and keep formatting simple (no markdown, no bold, no asterisks). Separate sections with a blank line. Do not include the transcript.

Transcript chunk:
"""${text}"""

Notes:
`
    // Prompt for quiz JSON (one true answer)
    const quizPrompt = `
Given the following transcript chunk, generate a quiz question in this JSON format:
{"q": "question text", "a": ["answer1": true/false, "answer2": true/false, "answer3": true/false, "answer4": true/false]}
Only output valid JSON, no explanation. Only one answer should be true.

Transcript chunk:
"""${text}"""
`
    // Prompt for Google Doc JSON (beautified, concise, for Google Docs)
    const docPrompt = `
You are an expert academic note-taker. Given the following transcript chunk, create a JSON array of sections for visually pleasing, concise, and beautifully organized Google Docs notes. Each section should have a "section" (string, the section header) and "content" (string, can include bullet points, bold using **double asterisks**, and spacing for readability). Use clear section headers, bullet points, bold for key terms, and spacing for readability. Make the formatting as visually pleasing as possible for Google Docs.

Format:
[
  {"section": "Section Title", "content": "Your formatted notes for this section."},
  ...
]

Transcript chunk:
"""${text}"""

Notes JSON:
`
    // Get .txt notes
    const txtRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY.replace(/"/g, "")}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an expert at summarizing and note-taking." },
          { role: "user", content: txtPrompt }
        ],
        max_tokens: 400,
        temperature: 0.3
      })
    })
    const txtData = await txtRes.json()
    let txtSummary = ""
    if (txtData.choices && txtData.choices[0] && txtData.choices[0].message) {
      txtSummary = txtData.choices[0].message.content.trim()
    }

    // Get quiz JSON
    const quizRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY.replace(/"/g, "")}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an expert at creating quizzes." },
          { role: "user", content: quizPrompt }
        ],
        max_tokens: 200,
        temperature: 0.3
      })
    })
    const quizDataRaw = await quizRes.json()
    let quizObj = null
    if (quizDataRaw.choices && quizDataRaw.choices[0] && quizDataRaw.choices[0].message) {
      try {
        quizObj = JSON.parse(
          quizDataRaw.choices[0].message.content
            .replace(/```json|```/g, "")
            .replace(/[\n\r]+/g, "")
        )
      } catch (e) {
        quizObj = null
      }
    }

    // Get Google Doc JSON
    const docRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY.replace(/"/g, "")}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an expert at summarizing and note-taking." },
          { role: "user", content: docPrompt }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    })
    const docData = await docRes.json()
    let docArr = []
    if (docData.choices && docData.choices[0] && docData.choices[0].message) {
      try {
        docArr = JSON.parse(
          docData.choices[0].message.content
            .replace(/```json|```/g, "")
            .replace(/[\n\r]+/g, "")
        )
      } catch (e) {
        docArr = []
      }
    }

    setIsSummarizing(false)
    setChunkNotes(prevNotes => {
      // For .txt file, use the header/title from the summary itself (first line or section header)
      // If txtSummary contains a header, use it; otherwise, just append as-is
      let headerMatch = txtSummary.match(/^===\s*(.*?)\s*===/);
      let header = headerMatch ? headerMatch[1] : "Summary";
      let body = txtSummary.replace(/^===.*?===\s*/s, ""); // Remove header if present
      const formatted = `\n${header}\n${body.trim()}`;
      const updatedTxt = prevNotes.length === 0 ? formatted.trim() : prevNotes.join('\n\n') + '\n\n' + formatted.trim();
      setNoteFile(updatedTxt);
      return [...prevNotes, formatted.trim()];
    });

    setDocJson(prevDoc => {
      const updatedDoc = [...prevDoc, ...docArr];
      return updatedDoc;
    });

    if (quizObj) {
      setQuizData(prevQuiz => {
        const updatedQuiz = [...prevQuiz, quizObj]
        setQuizFile(JSON.stringify(updatedQuiz, null, 2))
        return updatedQuiz
      })
    }
  }

  const handleStartRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setMicStatus('Microphone access granted! Starting transcription...')
        setIsRecording(true)
        setTranscript('')
        setChunkNotes([])
        setQuizData([])
        setNoteFile('')
        setQuizFile('')
        setDocJson([])
        wordBufferRef.current = []

        const mediaRecorder = new window.MediaRecorder(stream, { mimeType: 'audio/webm' })
        mediaRecorderRef.current = mediaRecorder

        // --- NOTE: This will fail in browser, see previous messages for backend proxy solution ---
        const socket = new window.WebSocket(
          'wss://api.deepgram.com/v1/listen',
          ['token', DG_KEY]
        )
        socketRef.current = socket

        socket.onopen = () => {
          mediaRecorder.addEventListener('dataavailable', event => {
            if (socket.readyState === 1) {
              socket.send(event.data)
            }
          })
          mediaRecorder.start(1000)
        }

        socket.onmessage = (message) => {
          const received = JSON.parse(message.data)
          const newTranscript = received.channel?.alternatives?.[0]?.transcript
          if (newTranscript) {
            setTranscript(prev => {
              const updated = prev + ' ' + newTranscript
              // Buffer logic
              const words = newTranscript.trim().split(/\s+/)
              wordBufferRef.current = wordBufferRef.current.concat(words)
              // Every time buffer reaches 100 words, get notes and quiz, then clear those 100 words from buffer
              while (wordBufferRef.current.length >= 100 && !isSummarizing) {
                const chunk = wordBufferRef.current.slice(0, 100).join(' ')
                getNotesForChunk(chunk, chunkNotes, updated)
                wordBufferRef.current = wordBufferRef.current.slice(100)
              }
              return updated
            })
          }
        }

        socket.onclose = () => setIsRecording(false)
        socket.onerror = () => setIsRecording(false)
      } catch (err) {
        setMicStatus('Microphone access denied.')
      }
    } else {
      setIsRecording(false)
      setMicStatus('Recording stopped.')
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
      if (socketRef.current && socketRef.current.readyState === 1) {
        socketRef.current.close()
      }
    }
  }

  // Download .txt file
  const handleDownloadTxt = () => {
    const blob = new Blob([noteFile], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "notes.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  // Download .json file
  const handleDownloadJson = () => {
    const blob = new Blob([quizFile], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "quiz.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{
      maxWidth: 500,
      margin: "60px auto",
      padding: 32,
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 2px 16px rgba(0,0,0,0.07)"
    }}>
      <button
        onClick={onBack}
        style={{
          marginBottom: 20,
          padding: "12px 32px",
          background: "#3498db",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: "1rem",
          fontWeight: 500,
          cursor: "pointer",
          transition: "background 0.2s"
        }}
        onMouseOver={e => (e.currentTarget.style.background = "#2176bd")}
        onMouseOut={e => (e.currentTarget.style.background = "#3498db")}
      >
        ← Back to Dashboard
      </button>
      <h1 style={{ textAlign: "center", marginBottom: 32 }}>Live Transcriber</h1>
      <button
        onClick={handleStartRecording}
        style={{
          display: "block",
          margin: "0 auto 20px auto",
          padding: "12px 32px",
          fontSize: "1.1rem",
          background: isRecording ? "#e74c3c" : "#2ecc71",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer"
        }}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      {/* NavBar Slider */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        margin: "20px 0"
      }}>
        <button
          onClick={() => setView('transcript')}
          style={{
            padding: "8px 24px",
            borderRadius: "20px 0 0 20px",
            border: "1px solid #3498db",
            background: view === 'transcript' ? "#3498db" : "#fff",
            color: view === 'transcript' ? "#fff" : "#3498db",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Live Transcription
        </button>
        <button
          onClick={() => setView('notes')}
          style={{
            padding: "8px 24px",
            borderRadius: "0 20px 20px 0",
            border: "1px solid #3498db",
            borderLeft: "none",
            background: view === 'notes' ? "#3498db" : "#fff",
            color: view === 'notes' ? "#fff" : "#3498db",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Live Notes
        </button>
      </div>
      {micStatus && <div style={{ marginBottom: 20, textAlign: "center" }}>{micStatus}</div>}
      {isSummarizing && (
        <div style={{ marginBottom: 16, color: "#888", textAlign: "center" }}>
          Generating notes and quiz...
        </div>
      )}
      {/* Show either transcript or notes based on view */}
      {view === 'transcript' && transcript && (
        <div style={{
          background: "#f4f4f4",
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
          minHeight: 40,
          fontFamily: "monospace"
        }}>
          <strong>Live Transcript:</strong>
          <div style={{ whiteSpace: "pre-wrap" }}>{transcript}</div>
        </div>
      )}
      {view === 'notes' && chunkNotes.length > 0 && (
        <div style={{
          background: "#f9f9f9",
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
          minHeight: 40,
          fontFamily: "monospace"
        }}>
          <strong>Live Notes:</strong>
          {chunkNotes.map((notes, idx) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              <div style={{ whiteSpace: "pre-wrap" }}>{notes}</div>
            </div>
          ))}
        </div>
      )}
      {/* Show download and Google Doc buttons only after recording stops */}
      {!isRecording && (noteFile || quizFile) && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          {noteFile && (
            <button
              onClick={handleDownloadTxt}
              style={{
                padding: "10px 24px",
                background: "#2ecc71",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: "1rem",
                cursor: "pointer",
                marginRight: 10
              }}
            >
              Download Notes (.txt)
            </button>
          )}
          {quizFile && (
            <button
              onClick={handleDownloadJson}
              style={{
                padding: "10px 24px",
                background: "#f39c12",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: "1rem",
                cursor: "pointer"
              }}
            >
              Download Quiz (.json)
            </button>
          )}
          {docJson.length > 0 && (
            <GoogleDocButton
              notesJson={docJson}
              buttonText="Send Notes to Google Docs"
              style={{
                background: "linear-gradient(90deg, #3498db 0%, #2176bd 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: "1rem",
                fontWeight: 600,
                padding: "12px 32px",
                margin: "0 10px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(52,152,219,0.15)"
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}