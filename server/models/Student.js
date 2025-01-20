import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters']
  },
  lastName: { 
    type: String, 
    required: [false],
    trim: true,
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: false,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  college: {
    type: String,
    trim: true,
    default: ''
  },
  department: {
    type: String,
    trim: true,
    default: ''
  },
  contactNumber: { 
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid 10-digit phone number!`
    }
  },
  fees: {
    type: Number,
    required: [true, 'Fees is required'],
    min: [0, 'Fees cannot be negative']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  batch: { 
    type: String,
    default: 'Batch 1',
    trim: true
  },
  course: { 
    type: String,
    default: 'networking',
    trim: true
  },
  month: { 
    type: String,
    default: 'January',
    trim: true
  },
  year: { 
    type: String,
    default: () => new Date().getFullYear().toString(),
    trim: true
  },
  additionalDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { 
  timestamps: true,
  collection: 'Students'
});

// Ensure email is lowercase and trimmed before saving
StudentSchema.pre('save', function(next) {
  this.email = this.email.toLowerCase().trim();
  this.firstName = this.firstName.trim();
  this.lastName = this.lastName.trim();
  next();
});

// Create a compound unique index to prevent duplicate students
StudentSchema.index({ 
  firstName: 1, 
  lastName: 1, 
  email: 1 
}, { 
  unique: true,
  partialFilterExpression: { 
    firstName: { $type: 'string' },
    lastName: { $type: 'string' },
    email: { $type: 'string' }
  }
});

export default mongoose.model('Student', StudentSchema);
