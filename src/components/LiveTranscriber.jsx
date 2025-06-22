import React, { useState } from 'react';
import { startLiveTranscription, stopLiveTranscription } from '../utils/deepgram';

// Replace with your actual API key or use an environment variable
  const DEEPGRAM_API_KEY ="e54cf5e6857717121afcb119452f8bbb0a12fccb";

export default function LiveTranscriber() {
  const [transcript, setTranscript] = useState([]);
  const [isListening, setIsListening] = useState(false);

  const handleStart = () => {
    setTranscript([]);
    startLiveTranscription(DEEPGRAM_API_KEY, (newText) => {
      setTranscript((prev) => [...prev, newText]);
    });
    setIsListening(true);
  };

  const handleStop = () => {
    const finalTranscript = stopLiveTranscription();
    setIsListening(false);
    console.log("Final Transcript:", finalTranscript);
  };

  return (
    <div className="p-4">
      <button onClick={isListening ? handleStop : handleStart} className="bg-blue-600 text-white px-4 py-2 rounded">
        {isListening ? 'Stop' : 'Start'} Transcription
      </button>
      <div className="mt-4 whitespace-pre-wrap text-gray-800 bg-gray-100 p-4 rounded">
        {transcript.join('\n')}
      </div>
    </div>
  );
}
