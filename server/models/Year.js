import mongoose from 'mongoose';

const YearSchema = new mongoose.Schema({
  year: { 
    type: String, 
    required: true 
  },
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course',
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  months: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Month'
  }],
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
  collection: 'Years'  
});

// Ensure unique combination of year and course
YearSchema.index({ year: 1, course: 1 }, { unique: true });

export default mongoose.model('Year', YearSchema);
