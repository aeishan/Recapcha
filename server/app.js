const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Sample Mongoose model
const SampleSchema = new mongoose.Schema({ name: String });
const Sample = mongoose.model('Sample', SampleSchema);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/sampledb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Insert sample data if collection is empty
async function seedSampleData() {
  const count = await Sample.countDocuments();
  if (count === 0) {
    await Sample.insertMany([
      { name: 'Sample One' },
      { name: 'Sample Two' },
      { name: 'Sample Three' }
    ]);
    console.log('Sample data inserted');
  }
}

mongoose.connection.once('open', () => {
  seedSampleData();
});

// Sample route
app.get('/api/samples', async (req, res) => {
  const samples = await Sample.find();
  res.json(samples);
});

// Start server
app.listen(5050, () => console.log('Server running on port 5050'));