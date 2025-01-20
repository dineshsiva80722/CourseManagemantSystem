import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    alias: 'course'  // This allows using both 'name' and 'course'
  },
  description: {
    type: String,
    default: ''
  },
  years: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Year'  // Restore reference to Year model
  }]
}, { 
  timestamps: true,
  collection: 'Course_details'  // Specify the exact collection name
});

// Add a virtual property to support both 'name' and 'course'
CourseSchema.virtual('course').get(function() {
  return this.name;
});

// Ensure virtual fields are included when converting to JSON
CourseSchema.set('toJSON', { 
  virtuals: true,
  transform: (doc, ret) => {
    ret.course = ret.name;
    return ret;
  }
});

export default mongoose.model('Course', CourseSchema);
