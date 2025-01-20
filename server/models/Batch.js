import mongoose from 'mongoose';

const BatchSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course',
    required: true
  },
  year: { 
    type: String, 
    required: true 
  },
  month: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Month',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student'
  }],
  description: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true,
  collection: 'Batches'
});

// Ensure unique combination of name, course, year, and month
BatchSchema.index({ name: 1, course: 1, year: 1, month: 1 }, { unique: true });

export default mongoose.model('Batch', BatchSchema);
