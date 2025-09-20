import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Quiz schema with UUID
const quizSchema = new mongoose.Schema({
  uuid: { type: String, required: true, default: uuidv4 }, // Unique identifier
  title: { type: String, required: true, default: "Quiz" },
  questions: [{
    q: { type: String, required: true },
    a: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  }],
  createdAt: { type: Date, default: Date.now },
  user: { type: String, required: true }, // UUID reference
});

// User schema
const userSchema = new mongoose.Schema({
  uuid: { type: String, required: true, default: uuidv4 },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  quizzes: [quizSchema], // Array of quiz objects
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);