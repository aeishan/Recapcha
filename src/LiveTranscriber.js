"use client"

import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import GoogleDocButton from "./GoogleDocButton.js"

const OPENAI_KEY = process.env.REACT_APP_OPENAI_API
const DG_KEY = process.env.REACT_APP_DEEPGRAM_API_KEY

export default function LiveTranscriber({ user, onBack }) {
  console.log('=== LIVE TRANSCRIBER INITIALIZED ===');
  console.log('User prop received:', user);
  console.log('User email:', user?.email);

  const [isRecording, setIsRecording] = useState(false)
  const [micStatus, setMicStatus] = useState("")
  const [transcript, setTranscript] = useState("")
  const [chunkNotes, setChunkNotes] = useState([])
  const [quizData, setQuizData] = useState([])
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [noteFile, setNoteFile] = useState("")
  const [quizFile, setQuizFile] = useState("")
  const [docJson, setDocJson] = useState([])
  const [view, setView] = useState("transcript")
  const [isSavingQuiz, setIsSavingQuiz] = useState(false)
  const [recordingComplete, setRecordingComplete] = useState(false)
  const wordBufferRef = useRef([])
  const mediaRecorderRef = useRef(null)
  const socketRef = useRef(null)
  const navigate = useNavigate()

  // Check if user is available
  if (!user) {
    console.error('❌ No user provided to LiveTranscriber');
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Error: User not found. Please log in again.</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  async function getNotesForChunk(text, allNotes, fullTranscript) {
    console.log('=== GET NOTES FOR CHUNK CALLED ===');
    console.log('Text chunk length:', text.length);
    console.log('Text preview:', text.substring(0, 100) + '...');
    
    setIsSummarizing(true)

    const txtPrompt = `
You are an expert note-taker. Given the following transcript chunk, generate a grammatically correct and accurate plain text summary for a React site. Use clear section headers (surrounded by ===), bullet points (start with "- "), and keep formatting simple (no markdown, no bold, no asterisks). Separate sections with a blank line. Do not include the transcript.

Transcript chunk:
"""${text}"""

Notes:
`

    const quizPrompt = `
You are an expert quiz creator. Given the following transcript chunk, generate ONE multiple choice question in this EXACT JSON format:

{
  "q": "What is the main concept discussed in this segment?",
  "a": {
    "The first option": false,
    "The correct answer": true,
    "Another incorrect option": false,
    "The final incorrect option": false
  }
}

IMPORTANT REQUIREMENTS:
- Create exactly 4 answer options
- Only ONE answer should be "true", the rest must be "false"
- Make the question specific to the content discussed
- Use clear, descriptive answer text (not just A, B, C, D)
- Output ONLY valid JSON, no explanation or extra text
- Make sure the correct answer is actually correct based on the transcript
- Make incorrect answers plausible but wrong

Transcript chunk:
"""${text}"""

JSON:
`

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

    try {
      // Get .txt notes
      const txtRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY.replace(/"/g, "")}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are an expert at summarizing and note-taking." },
            { role: "user", content: txtPrompt },
          ],
          max_tokens: 400,
          temperature: 0.3,
        }),
      })
      const txtData = await txtRes.json()
      let txtSummary = ""
      if (txtData.choices && txtData.choices[0] && txtData.choices[0].message) {
        txtSummary = txtData.choices[0].message.content.trim()
      }

      // Get quiz JSON with improved settings
      console.log('🔄 Calling OpenAI for quiz generation...');
      const quizRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY.replace(/"/g, "")}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { 
              role: "system", 
              content: "You are an expert at creating educational multiple choice questions. Always return valid JSON in the exact format requested. Never include explanations or extra text." 
            },
            { role: "user", content: quizPrompt },
          ],
          max_tokens: 300,
          temperature: 0.2,
        }),
      })
      
      const quizDataRaw = await quizRes.json()
      console.log('=== RAW QUIZ RESPONSE ===');
      console.log('Quiz API response:', JSON.stringify(quizDataRaw, null, 2));
      
      let quizObj = null
      if (quizDataRaw.choices && quizDataRaw.choices[0] && quizDataRaw.choices[0].message) {
        const rawContent = quizDataRaw.choices[0].message.content;
        console.log('=== RAW QUIZ CONTENT ===');
        console.log('Raw content:', rawContent);
        
        try {
          // More aggressive cleaning of the response
          let cleanedContent = rawContent.trim();
          
          // Remove any markdown code blocks
          cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          
          // Remove any leading/trailing text that's not JSON
          const jsonStart = cleanedContent.indexOf('{');
          const jsonEnd = cleanedContent.lastIndexOf('}') + 1;
          
          if (jsonStart !== -1 && jsonEnd > jsonStart) {
            cleanedContent = cleanedContent.substring(jsonStart, jsonEnd);
          }
          
          console.log('Cleaned content:', cleanedContent);
          
          quizObj = JSON.parse(cleanedContent);
          console.log('=== PARSED QUIZ OBJECT ===');
          console.log('Parsed quiz object:', JSON.stringify(quizObj, null, 2));
          
          // Validate quiz object structure
          if (!quizObj.q || !quizObj.a || typeof quizObj.a !== 'object') {
            console.error('❌ Invalid quiz object structure');
            console.log('Missing q:', !quizObj.q);
            console.log('Missing a:', !quizObj.a);
            console.log('Type of a:', typeof quizObj.a);
            quizObj = null;
          } else {
            // Validate answers structure
            const answers = Object.values(quizObj.a);
            const trueCount = answers.filter(val => val === true).length;
            const falseCount = answers.filter(val => val === false).length;
            const totalAnswers = answers.length;
            
            console.log('=== ANSWER VALIDATION ===');
            console.log('Total answers:', totalAnswers);
            console.log('True answers:', trueCount);
            console.log('False answers:', falseCount);
            console.log('Answer keys:', Object.keys(quizObj.a));
            
            if (trueCount !== 1 || totalAnswers < 2) {
              console.error('❌ Invalid answer structure - should have exactly 1 true answer and at least 2 total answers');
              quizObj = null;
            } else {
              console.log('✅ Quiz object validated successfully');
            }
          }
        } catch (e) {
          console.error('❌ Quiz parsing error:', e);
          console.log('Failed to parse content:', rawContent);
          
          // Try to create a fallback quiz if parsing fails
          console.log('🔄 Creating fallback quiz...');
          quizObj = {
            q: `What was discussed in this part of the lecture?`,
            a: {
              "Key concept from the transcript": true,
              "Unrelated topic A": false,
              "Unrelated topic B": false,
              "Unrelated topic C": false
            }
          };
          console.log('Fallback quiz created:', JSON.stringify(quizObj, null, 2));
        }
      }

      // Get Google Doc JSON with better error handling
      const docRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY.replace(/"/g, "")}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are an expert at summarizing and note-taking." },
            { role: "user", content: docPrompt },
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      })
      const docData = await docRes.json()
      let docArr = []
      
      if (docData.choices && docData.choices[0] && docData.choices[0].message) {
        try {
          const rawDocContent = docData.choices[0].message.content;
          console.log('=== RAW DOC CONTENT ===');
          console.log('Raw doc content:', rawDocContent);
          
          // Clean the content more thoroughly
          let cleanedDocContent = rawDocContent.trim();
          cleanedDocContent = cleanedDocContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          
          // Find JSON array bounds
          const arrayStart = cleanedDocContent.indexOf('[');
          const arrayEnd = cleanedDocContent.lastIndexOf(']') + 1;
          
          if (arrayStart !== -1 && arrayEnd > arrayStart) {
            cleanedDocContent = cleanedDocContent.substring(arrayStart, arrayEnd);
          }
          
          console.log('Cleaned doc content:', cleanedDocContent);
          
          docArr = JSON.parse(cleanedDocContent);
          console.log('=== PARSED DOC ARRAY ===');
          console.log('Parsed doc array:', JSON.stringify(docArr, null, 2));
          console.log('Doc array length:', docArr.length);
          console.log('Doc array is valid array:', Array.isArray(docArr));
          
          // Validate the structure
          if (!Array.isArray(docArr)) {
            console.error('❌ Parsed doc data is not an array');
            docArr = [];
          } else {
            // Validate each section
            docArr = docArr.filter((section, index) => {
              if (!section || typeof section !== 'object' || !section.section || !section.content) {
                console.warn(`⚠️ Filtering out invalid section at index ${index}:`, section);
                return false;
              }
              return true;
            });
            console.log('✅ Valid doc sections after filtering:', docArr.length);
          }
        } catch (e) {
          console.error('❌ Doc parsing error:', e);
          console.log('Failed to parse doc content:', docData.choices[0].message.content);
          
          // Create fallback doc structure
          const fallbackSection = {
            section: "Notes Summary",
            content: `Summary of content from transcript chunk: ${text.substring(0, 100)}...`
          };
          docArr = [fallbackSection];
          console.log('🔄 Created fallback doc structure:', docArr);
        }
      }

      setIsSummarizing(false)
      
      // Update notes
      setChunkNotes((prevNotes) => {
        const headerMatch = txtSummary.match(/^===\s*(.*?)\s*===/)
        const header = headerMatch ? headerMatch[1] : "Summary"
        const body = txtSummary.replace(/^===.*?===\s*/s, "")
        const formatted = `\n${header}\n${body.trim()}`
        const updatedTxt = prevNotes.length === 0 ? formatted.trim() : prevNotes.join("\n\n") + "\n\n" + formatted.trim()
        setNoteFile(updatedTxt)
        return [...prevNotes, formatted.trim()]
      })

      // Update doc JSON with enhanced logging - SINGLE UPDATE ONLY
      setDocJson((prevDoc) => {
        console.log('=== UPDATING DOC JSON ===');
        console.log('Previous doc JSON:', JSON.stringify(prevDoc, null, 2));
        console.log('Adding new doc sections:', JSON.stringify(docArr, null, 2));
        
        const updatedDoc = [...prevDoc, ...docArr];
        console.log('Updated doc JSON:', JSON.stringify(updatedDoc, null, 2));
        console.log('Updated doc JSON length:', updatedDoc.length);
        
        return updatedDoc;
      })

      // REMOVED: Duplicate setDocJson call that was causing duplicates
      // setDocJson((prevDoc) => {
      //   const updatedDoc = [...prevDoc, ...docArr]
      //   return updatedDoc
      // })

      // Update quiz data with detailed logging
      if (quizObj) {
        console.log('✅ Adding quiz object to quizData array');
        setQuizData((prevQuiz) => {
          console.log('=== UPDATING QUIZ DATA ===');
          console.log('Previous quiz data:', JSON.stringify(prevQuiz, null, 2));
          console.log('Previous quiz count:', prevQuiz.length);
          console.log('Adding new quiz:', JSON.stringify(quizObj, null, 2));
          
          const updatedQuiz = [...prevQuiz, quizObj];
          console.log('Updated quiz data:', JSON.stringify(updatedQuiz, null, 2));
          console.log('New quiz count:', updatedQuiz.length);
          
          setQuizFile(JSON.stringify(updatedQuiz, null, 2))
          return updatedQuiz
        })
      } else {
        console.log('❌ No quiz object to add (quizObj is null)');
      }
    } catch (error) {
      console.error('❌ Error in getNotesForChunk:', error)
      setIsSummarizing(false)
    }
  }

  const saveQuizToDatabase = async () => {
    console.log('=== SAVE QUIZ TO DATABASE CALLED ===');
    console.log('quizData.length:', quizData.length);
    console.log('user exists:', !!user);
    console.log('user email:', user?.email);
    
    if (!quizData.length || !user) {
      console.log('❌ No quiz data or user to save');
      console.log('Quiz data:', quizData);
      console.log('User:', user);
      return null;
    }
    
    console.log('✅ Quiz data exists, proceeding to save...');
    console.log('=== QUIZ DATA FORMAT ===');
    console.log('Raw quizData:', JSON.stringify(quizData, null, 2));
    
    setIsSavingQuiz(true);
    try {
      const requestBody = {
        userEmail: user.email,
        quizData: quizData,
        title: `Lecture Quiz - ${new Date().toLocaleDateString()}`
      };
      
      console.log('=== REQUEST BODY ===');
      console.log(JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('http://localhost:5050/api/quiz/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      console.log('=== SAVE RESPONSE ===');
      console.log('Save response:', JSON.stringify(result, null, 2));

      if (response.ok) {
        setMicStatus("✅ Recording complete! Quiz saved successfully.");
        console.log('✅ Quiz saved successfully:', result);
        return result.quizUuid;
      } else {
        console.error('❌ Failed to save quiz:', result);
        setMicStatus("❌ Recording complete but failed to save quiz");
        return null;
      }
    } catch (error) {
      console.error('❌ Error saving quiz:', error);
      setMicStatus("❌ Recording complete but error saving quiz");
      return null;
    } finally {
      setIsSavingQuiz(false);
    }
  };

  const handleTakeQuiz = async () => {
    console.log('=== HANDLE TAKE QUIZ CALLED ===');
    console.log('Current quizData:', JSON.stringify(quizData, null, 2));
    console.log('QuizData length:', quizData.length);
    
    if (!quizData.length || !user) {
      console.log('❌ No quiz data or user available');
      return;
    }

    // Save quiz to database first and get the UUID
    const quizUuid = await saveQuizToDatabase();
    
    if (quizUuid) {
      console.log('✅ Quiz saved successfully, navigating to quiz:', quizUuid);
      // Navigate to the individual quiz page with the UUID
      navigate(`/quiz/${quizUuid}`);
    } else {
      console.log('❌ Failed to save quiz, using fallback navigation');
      // Fallback: navigate to quiz page with state
      navigate("/quiz", { state: { generatedQuiz: quizData } });
    }
  };

  const handleStartRecording = async () => {
    if (!isRecording) {
      try {
        console.log('Starting recording...')
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setMicStatus("🎤 Microphone access granted! Starting transcription...")
        setIsRecording(true)
        setRecordingComplete(false)
        setTranscript("")
        setChunkNotes([])
        setQuizData([])
        setNoteFile("")
        setQuizFile("")
        setDocJson([])
        wordBufferRef.current = []

        const mediaRecorder = new MediaRecorder(stream, { 
          mimeType: "audio/webm;codecs=opus" 
        })
        mediaRecorderRef.current = mediaRecorder

        console.log('Connecting to Deepgram...')
        console.log('DG_KEY exists:', !!DG_KEY)
        
        const cleanKey = DG_KEY?.replace(/['"]/g, '') || ''
        console.log('Using API key:', cleanKey.substring(0, 10) + '...')

        const socket = new WebSocket(
          `wss://api.deepgram.com/v1/listen?model=nova-2&language=en&smart_format=true`,
          ['token', cleanKey]
        )
        socketRef.current = socket

        socket.onopen = () => {
          console.log('✅ WebSocket connected to Deepgram')
          setMicStatus("🎤 Connected! Speak to see live transcription...")
          
          mediaRecorder.addEventListener("dataavailable", (event) => {
            if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
              console.log('Sending audio chunk, size:', event.data.size)
              socket.send(event.data)
            }
          })
          
          mediaRecorder.start(100)
          console.log('📹 MediaRecorder started')
        }

        socket.onmessage = (message) => {
          try {
            const received = JSON.parse(message.data)
            console.log('Raw Deepgram response:', received)
            
            const transcript = received.channel?.alternatives?.[0]?.transcript
            const is_final = received.is_final
            
            if (transcript && transcript.trim()) {
              console.log('📝 Received transcript:', transcript, 'Final:', is_final)
              
              setTranscript((prev) => {
                let updated
                if (is_final) {
                  updated = prev + " " + transcript
                  console.log('Final transcript added:', transcript)
                  
                  const words = transcript.trim().split(/\s+/)
                  wordBufferRef.current = wordBufferRef.current.concat(words)
                  
                  if (wordBufferRef.current.length >= 50 && !isSummarizing) {
                    const chunk = wordBufferRef.current.slice(0, 50).join(" ")
                    console.log('🤖 Processing AI chunk:', chunk.substring(0, 50) + '...')
                    getNotesForChunk(chunk, chunkNotes, updated)
                    wordBufferRef.current = wordBufferRef.current.slice(50)
                  }
                } else {
                  updated = prev + " " + transcript
                  console.log('Interim transcript:', transcript)
                }
                return updated
              })
            }
          } catch (e) {
            console.error('❌ Error parsing Deepgram message:', e)
            console.log('Raw message data:', message.data)
          }
        }

        socket.onclose = (event) => {
          console.log('🔌 WebSocket closed:', event.code, event.reason)
          if (event.code !== 1000) {
            setMicStatus("❌ Connection lost. Please try again.")
          }
          setIsRecording(false)
        }
        
        socket.onerror = (error) => {
          console.error('❌ WebSocket error:', error)
          setMicStatus("❌ Connection error. Check your API key and try again.")
          setIsRecording(false)
        }

        setTimeout(() => {
          if (socket.readyState === WebSocket.CONNECTING) {
            console.log('⏰ Connection timeout')
            socket.close()
            setMicStatus("❌ Connection timeout. Please check your API key.")
            setIsRecording(false)
          }
        }, 10000)

      } catch (err) {
        console.error('❌ Microphone error:', err)
        setMicStatus("❌ Microphone access denied or not available.")
        setIsRecording(false)
      }
    } else {
      console.log('🛑 Stopping recording...')
      setIsRecording(false)
      setMicStatus("⏹️ Recording stopped. Processing final content...")
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current.stream.getTracks().forEach(track => {
          track.stop()
          console.log('🔇 Stopped audio track')
        })
      }
      
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close(1000, "Recording stopped")
        console.log('🔌 Closed WebSocket')
      }

      if (wordBufferRef.current.length > 0 && !isSummarizing) {
        const finalChunk = wordBufferRef.current.join(" ")
        console.log('🤖 Processing final AI chunk:', finalChunk.substring(0, 50) + '...')
        await getNotesForChunk(finalChunk, chunkNotes, transcript)
        wordBufferRef.current = []
      }

      setRecordingComplete(true)
      
      // Auto-save quiz to database when recording stops
      setTimeout(async () => {
        console.log('=== AUTO-SAVE TIMEOUT TRIGGERED ===');
        console.log('Current quizData length:', quizData.length);
        
        if (quizData.length > 0) {
          await saveQuizToDatabase()
        } else {
          setMicStatus("✅ Recording complete! Ready to export.")
        }
      }, 3000)
    }
  }

  const handleDownloadTxt = () => {
    const blob = new Blob([noteFile], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "notes.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px"
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        background: "#fff",
        borderRadius: "20px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1a2a4f 0%, #2d4a87 100%)",
          color: "#fff",
          padding: "30px",
          textAlign: "center"
        }}>
          <h1 style={{ fontSize: "2.5rem", margin: "0 0 10px 0", fontWeight: "700" }}>
            🎙️ Live Transcriber
          </h1>
          <p style={{ fontSize: "1.2rem", margin: 0, opacity: 0.9 }}>
            AI-powered lecture recording with real-time notes and quiz generation
          </p>
        </div>

        {/* Controls */}
        <div style={{ padding: "30px", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "20px",
            marginBottom: "20px"
          }}>
            <button
              onClick={handleStartRecording}
              disabled={isSummarizing}
              style={{
                background: isRecording ? "#ef4444" : "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: "50px",
                padding: "15px 40px",
                fontSize: "1.1rem",
                fontWeight: "600",
                cursor: isSummarizing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                transition: "all 0.3s ease",
                opacity: isSummarizing ? 0.6 : 1
              }}
            >
              {isRecording ? "⏹️ Stop Recording" : "🎙️ Start Recording"}
            </button>

            {recordingComplete && quizData.length > 0 && (
              <button
                onClick={handleTakeQuiz}
                disabled={isSavingQuiz}
                style={{
                  background: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50px",
                  padding: "15px 40px",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  cursor: isSavingQuiz ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  opacity: isSavingQuiz ? 0.6 : 1
                }}
              >
                {isSavingQuiz ? "💾 Saving..." : "📝 Take Quiz"}
              </button>
            )}

            <button
              onClick={onBack}
              style={{
                background: "transparent",
                color: "#6b7280",
                border: "2px solid #d1d5db",
                borderRadius: "50px",
                padding: "15px 30px",
                fontSize: "1rem",
                fontWeight: "500",
                cursor: "pointer"
              }}
            >
              ← Back to Dashboard
            </button>
          </div>

          {micStatus && (
            <div style={{
              background: "#f3f4f6",
              borderRadius: "12px",
              padding: "15px",
              textAlign: "center",
              fontSize: "1rem",
              color: "#374151"
            }}>
              {micStatus}
            </div>
          )}
        </div>

        {/* View Tabs */}
        <div style={{ padding: "0 30px" }}>
          <div style={{
            display: "flex",
            borderBottom: "1px solid #e5e7eb",
            marginBottom: "30px"
          }}>
            {[
              { key: "transcript", label: "📝 Live Transcript", count: transcript.split(' ').filter(w => w.length > 0).length },
              { key: "notes", label: "📋 AI Notes", count: chunkNotes.length },
              { key: "quiz", label: "🧠 Quiz Questions", count: quizData.length },
              { key: "doc", label: "📄 Google Doc Format", count: docJson.length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                style={{
                  background: view === tab.key ? "#f8fafc" : "transparent",
                  color: view === tab.key ? "#1a2a4f" : "#6b7280",
                  border: "none",
                  borderBottom: view === tab.key ? "3px solid #1a2a4f" : "3px solid transparent",
                  padding: "15px 20px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "0 30px 30px" }}>
          {view === "transcript" && (
            <div style={{
              background: "#f9fafb",
              borderRadius: "12px",
              padding: "25px",
              minHeight: "300px",
              border: "1px solid #e5e7eb"
            }}>
              <h3 style={{ color: "#1a2a4f", marginBottom: "20px", fontSize: "1.3rem" }}>
                Live Transcript
              </h3>
              {transcript ? (
                <p style={{
                  lineHeight: 1.8,
                  fontSize: "1.1rem",
                  color: "#374151",
                  whiteSpace: "pre-wrap"
                }}>
                  {transcript}
                </p>
              ) : (
                <p style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "1.1rem" }}>
                  {isRecording ? "Listening for speech..." : "Start recording to see live transcript"}
                </p>
              )}
            </div>
          )}

          {view === "notes" && (
            <div style={{
              background: "#f9fafb",
              borderRadius: "12px",
              padding: "25px",
              minHeight: "300px",
              border: "1px solid #e5e7eb"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ color: "#1a2a4f", margin: 0, fontSize: "1.3rem" }}>
                  AI-Generated Notes
                </h3>
                {/* REMOVED: JSON download button */}
                {noteFile && (
                  <button
                    onClick={handleDownloadTxt}
                    style={{
                      background: "#1a2a4f",
                      color: "#fff",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                      cursor: "pointer"
                    }}
                  >
                    📄 Download .txt
                  </button>
                )}
              </div>
              {chunkNotes.length > 0 ? (
                <div style={{ lineHeight: 1.8, fontSize: "1rem", color: "#374151" }}>
                  {chunkNotes.map((note, index) => (
                    <div key={index} style={{ marginBottom: "20px", whiteSpace: "pre-wrap" }}>
                      {note}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "1.1rem" }}>
                  {isRecording ? "AI notes will appear here as chunks are processed..." : "Start recording to generate AI notes"}
                </p>
              )}
            </div>
          )}

          {view === "doc" && (
            <div style={{
              background: "#f9fafb",
              borderRadius: "12px",
              padding: "25px",
              minHeight: "300px",
              border: "1px solid #e5e7eb"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ color: "#1a2a4f", margin: 0, fontSize: "1.3rem" }}>
                  Google Docs Format
                </h3>
                {/* Simplified: Just show the button when data is available */}
                {docJson && Array.isArray(docJson) && docJson.length > 0 && (
                  <GoogleDocButton docData={docJson} />
                )}
              </div>
              {docJson && Array.isArray(docJson) && docJson.length > 0 ? (
                <div style={{ marginBottom: "20px" }}>
                  <p style={{ 
                    color: "#6b7280", 
                    fontSize: "1rem", 
                    marginBottom: "15px",
                    fontStyle: "italic"
                  }}>
                    Click the button above to create a formatted Google Doc with your notes.
                  </p>
                  {/* Preview of sections */}
                  <div style={{ 
                    background: "#fff", 
                    borderRadius: "8px", 
                    padding: "20px", 
                    border: "1px solid #e5e7eb",
                    maxHeight: "400px",
                    overflowY: "auto"
                  }}>
                    {docJson.map((section, index) => {
                      if (!section || typeof section !== 'object') {
                        return null;
                      }

                      return (
                        <div key={index} style={{ marginBottom: "20px" }}>
                          <h4 style={{
                            color: "#1a2a4f",
                            fontSize: "1.1rem",
                            marginBottom: "8px",
                            fontWeight: "600"
                          }}>
                            {section.section || `Section ${index + 1}`}
                          </h4>
                          <div style={{
                            lineHeight: 1.6,
                            fontSize: "0.95rem",
                            color: "#4b5563",
                            whiteSpace: "pre-wrap",
                            paddingLeft: "12px",
                            borderLeft: "3px solid #e5e7eb"
                          }}>
                            {section.content || 'No content available'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "1.1rem" }}>
                  {isRecording ? "Google Docs format will be generated..." : "Start recording to generate Google Docs format"}
                </p>
              )}
            </div>
          )}

          {view === "quiz" && (
            <div style={{
              background: "#f9fafb",
              borderRadius: "12px",
              padding: "25px",
              minHeight: "300px",
              border: "1px solid #e5e7eb"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ color: "#1a2a4f", margin: 0, fontSize: "1.3rem" }}>
                  Generated Quiz Questions
                </h3>
                <div style={{ display: "flex", gap: "10px" }}>
                  {recordingComplete && quizData.length > 0 && (
                    <button
                      onClick={handleTakeQuiz}
                      disabled={isSavingQuiz}
                      style={{
                        background: "#10b981",
                        color: "#fff",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        cursor: isSavingQuiz ? "not-allowed" : "pointer",
                        opacity: isSavingQuiz ? 0.6 : 1
                      }}
                    >
                      {isSavingQuiz ? "💾 Saving..." : "🚀 Take Quiz"}
                    </button>
                  )}
                </div>
              </div>
              {quizData.length > 0 ? (
                <div style={{ space: "20px" }}>
                  {quizData.map((quiz, index) => (
                    <div key={index} style={{
                      background: "#fff",
                      borderRadius: "12px",
                      padding: "20px",
                      marginBottom: "15px",
                      border: "1px solid #e5e7eb"
                    }}>
                      <h4 style={{ color: "#1a2a4f", marginBottom: "15px", fontSize: "1.1rem" }}>
                        Question {index + 1}: {quiz.q}
                      </h4>
                      <div style={{ paddingLeft: "20px" }}>
                        {/* COMPLETELY HIDE ANSWERS - Show only question text and option count */}
                        {quiz.a && Object.keys(quiz.a).length > 0 ? (
                          <div style={{
                            padding: "12px",
                            background: "#f8fafc",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            fontSize: "0.9rem",
                            color: "#64748b",
                            textAlign: "center"
                          }}>
                            📋 Multiple choice question with {Object.keys(quiz.a).length} options
                            <br />
                            <span style={{ fontSize: "0.8rem", fontStyle: "italic" }}>
                              Answer options hidden - take the quiz to see choices
                            </span>
                          </div>
                        ) : (
                          <div style={{
                            padding: "12px",
                            background: "#fef2f2",
                            borderRadius: "8px",
                            border: "1px solid #fecaca",
                            fontSize: "0.9rem",
                            color: "#dc2626",
                            textAlign: "center"
                          }}>
                            ⚠️ Question generated but answers need review
                          </div>
                        )}
                      </div>
                      <p style={{ 
                        marginTop: "12px", 
                        fontSize: "0.85rem", 
                        color: "#6b7280", 
                        fontStyle: "italic",
                        textAlign: "center"
                      }}>
                        🚀 Click "Take Quiz" above to see the full question with answer choices
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "1.1rem" }}>
                  {isRecording ? "Quiz questions will be generated as you speak..." : "Start recording to generate quiz questions"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
  };
