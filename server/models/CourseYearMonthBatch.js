import mongoose from 'mongoose';

const CourseYearMonthBatchSchema = new mongoose.Schema({
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
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  totalStudents: {
    type: Number,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'CourseYearMonthBatches'
});

// Ensure unique combination of course, year, month, and batch
CourseYearMonthBatchSchema.index({ 
  course: 1, 
  year: 1, 
  month: 1, 
  batch: 1 
}, { 
  unique: true 
});

export default mongoose.model('CourseYearMonthBatch', CourseYearMonthBatchSchema);
