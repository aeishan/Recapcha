import express from 'express';
import { v4 as uuidv4 } from 'uuid'; // Add this import
import User from '../models/Users.js';

const router = express.Router();

// Save quiz questions for a user
router.post('/save', async (req, res) => {
  try {
    const { userEmail, quizData, title } = req.body;
    
    console.log('=== SAVING QUIZ ===');
    console.log('User email:', userEmail);
    console.log('Quiz data:', JSON.stringify(quizData, null, 2));
    console.log('Quiz data length:', quizData.length);
    console.log('Title:', title);
    
    if (!userEmail || !quizData || !Array.isArray(quizData)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.log('User not found:', userEmail);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Found user:', user.email);
    console.log('Current quizzes count:', user.quizzes.length);

    // Create a single quiz entry with multiple questions and unique UUID
    const quizUuid = uuidv4();
    const newQuiz = {
      uuid: quizUuid, // Add unique UUID for routing
      title: title || `Quiz ${new Date().toLocaleDateString()}`,
      questions: quizData.map(item => ({
        q: item.q,
        a: item.a // Store as plain object
      })),
      user: user.uuid,
      createdAt: new Date()
    };

    console.log('New quiz to save:', JSON.stringify(newQuiz, null, 2));
    console.log('Quiz UUID:', quizUuid);
    console.log('Questions count in new quiz:', newQuiz.questions.length);

    // Add to user's quizzes array
    user.quizzes.push(newQuiz);
    await user.save();

    console.log('Quiz saved successfully. New quiz count:', user.quizzes.length);
    res.json({ 
      message: 'Quiz saved successfully', 
      quizCount: quizData.length,
      totalQuizzes: user.quizzes.length,
      quizUuid: quizUuid
    });
  } catch (error) {
    console.error('Error saving quiz:', error);
    res.status(500).json({ error: 'Failed to save quiz', details: error.message });
  }
});

// Get all quizzes for a user (ordered by most recent)
router.get('/user/:email', async (req, res) => {
  try {
    console.log('=== FETCHING QUIZZES SERVER SIDE ===');
    console.log('User email:', req.params.email);
    
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      console.log('❌ User not found:', req.params.email);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Found user:', user.email);
    console.log('User UUID:', user.uuid);
    console.log('Raw user.quizzes:', JSON.stringify(user.quizzes, null, 2));
    console.log('Quizzes count:', user.quizzes.length);
    
    // Log each quiz in detail
    user.quizzes.forEach((quiz, index) => {
      console.log(`=== QUIZ ${index} DETAILS ===`);
      console.log('Quiz UUID:', quiz.uuid);
      console.log('Quiz title:', quiz.title);
      console.log('Quiz questions count:', quiz.questions?.length || 0);
      console.log('Quiz createdAt:', quiz.createdAt);
      
      // Log each question in the quiz
      if (quiz.questions && Array.isArray(quiz.questions)) {
        quiz.questions.forEach((question, qIndex) => {
          console.log(`  Question ${qIndex}:`, JSON.stringify(question, null, 2));
        });
      }
    });
    
    // Sort quizzes by most recent first, then return in expected format
    const sortedQuizzes = user.quizzes
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Most recent first
      .map((quiz, index) => {
        console.log(`Mapping quiz ${index}...`);
        
        // Ensure questions is an array
        const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
        console.log(`Quiz ${index} has ${questions.length} questions`);
        
        const mapped = {
          uuid: quiz.uuid || quiz._id, // Use quiz UUID or fallback to _id
          title: quiz.title,
          questions: questions.map((q, qIndex) => {
            console.log(`  Mapping question ${qIndex}:`, JSON.stringify(q, null, 2));
            return {
              q: q.q,
              a: q.a
            };
          }),
          createdAt: quiz.createdAt,
          id: quiz._id
        };
        
        console.log(`Mapped quiz ${index}:`, JSON.stringify(mapped, null, 2));
        console.log(`Mapped quiz ${index} questions count:`, mapped.questions.length);
        
        return mapped;
      });

    console.log('=== FINAL RETURN DATA ===');
    console.log('Returning quizzes count:', sortedQuizzes.length);
    console.log('Total questions across all quizzes:', sortedQuizzes.reduce((total, quiz) => total + quiz.questions.length, 0));
    console.log('Returning quizzes:', JSON.stringify(sortedQuizzes, null, 2));
    res.json(sortedQuizzes);
  } catch (error) {
    console.error('❌ Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes', details: error.message });
  }
});

// Get individual quiz by UUID (for protected routing)
router.get('/quiz/:uuid', async (req, res) => {
  try {
    console.log('=== FETCHING INDIVIDUAL QUIZ ===');
    console.log('Quiz UUID:', req.params.uuid);
    
    // Find user that has this quiz
    const user = await User.findOne({ 
      'quizzes.uuid': req.params.uuid 
    });
    
    if (!user) {
      console.log('❌ Quiz not found:', req.params.uuid);
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Find the specific quiz
    const quiz = user.quizzes.find(q => q.uuid === req.params.uuid);
    
    if (!quiz) {
      console.log('❌ Quiz not found in user data:', req.params.uuid);
      return res.status(404).json({ error: 'Quiz not found' });
    }

    console.log('✅ Found quiz:', quiz.title);
    console.log('Questions count:', quiz.questions?.length || 0);

    const quizData = {
      uuid: quiz.uuid,
      title: quiz.title,
      questions: quiz.questions.map(q => ({
        q: q.q,
        a: q.a
      })),
      createdAt: quiz.createdAt,
      userEmail: user.email // For verification
    };

    console.log('Returning quiz data:', JSON.stringify(quizData, null, 2));
    res.json(quizData);
  } catch (error) {
    console.error('❌ Error fetching individual quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz', details: error.message });
  }
});

export default router;