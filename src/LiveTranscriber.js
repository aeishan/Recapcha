import React, { useState, useRef } from "react"

const DG_KEY = process.env.REACT_APP_DEEPGRAM_API_KEY || "e54cf5e6857717121afcb119452f8bbb0a12fccb"

export default function LiveTranscriber({ onBack }) {
  const [isRecording, setIsRecording] = useState(false)
  const [micStatus, setMicStatus] = useState('')
  const [transcript, setTranscript] = useState('')
  const mediaRecorderRef = useRef(null)
  const socketRef = useRef(null)

  const handleStartRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setMicStatus('Microphone access granted! Starting transcription...')
        setIsRecording(true)
        setTranscript('')

        const mediaRecorder = new window.MediaRecorder(stream, { mimeType: 'audio/webm' })
        mediaRecorderRef.current = mediaRecorder

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
            setTranscript(prev => prev + ' ' + newTranscript)
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

  return (
    <div style={{
      maxWidth: 500,
      margin: "60px auto",
      padding: 32,
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 2px 16px rgba(0,0,0,0.07)"
    }}>
      <button onClick={onBack} style={{ marginBottom: 20 }}>← Back to Dashboard</button>
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
      {micStatus && <div style={{ marginBottom: 20, textAlign: "center" }}>{micStatus}</div>}
      {transcript && (
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
    </div>
  )
}