import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  college: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  mobileNo: {
    type: String,
    trim: true
  },
  course: {
    type: String,
    required: [true, 'Course is required']
  },
  fees: {
    type: Number,
    default: 0,
    min: [0, 'Fees cannot be negative']
  },
  linkedinUrl: {
    type: String,
    trim: true
  },
  githubUrl: {
    type: String,
    trim: true
  },
  batch: {
    type: String,
    required: [true, 'Batch is required']
  },
  year: {
    type: String,
    required: [true, 'Year is required']
  },
  month: {
    type: String,
    required: [true, 'Month is required']
  }
}, { 
  timestamps: true,
  collection: 'Students'
});

// Ensure email is lowercase and trimmed before saving
StudentSchema.pre('save', function(next) {
  this.email = this.email.toLowerCase().trim();
  next();
});

// Create a compound unique index to prevent duplicate students
StudentSchema.index({ 
  email: 1 
}, { 
  unique: true,
  partialFilterExpression: { 
    email: { $type: 'string' }
  }
});

export default mongoose.model('Student', StudentSchema);
