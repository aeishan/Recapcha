import mongoose from 'mongoose';

// Quiz schema: stores question and answers in specified format
const quizSchema = new mongoose.Schema({
  title: { type: String, required: true, default: "Quiz" },
  questions: [{
    q: { type: String, required: true },
    a: {
      type: mongoose.Schema.Types.Mixed, // Change from Map to Mixed for better compatibility
      required: true
    }
  }],
  createdAt: { type: Date, default: Date.now },
  user: { type: String, required: true }, // UUID reference
});

export default quizSchema;