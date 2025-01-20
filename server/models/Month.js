import mongoose from 'mongoose';

const MonthSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  year: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Year',
    required: true
  },
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course',
    required: true
  },
  batches: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Batch'
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student'
  }]
}, { 
  timestamps: true,
  collection: 'Months'
});

// Ensure unique combination of name, year, and course
MonthSchema.index({ name: 1, year: 1, course: 1 }, { unique: true });

export default mongoose.model('Month', MonthSchema);
