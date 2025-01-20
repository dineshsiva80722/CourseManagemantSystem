import mongoose from 'mongoose';
import Year from '../models/Year.js';
import Course from '../models/Course.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection function
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yourdbname', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Function to create default years
const createDefaultYears = async () => {
  try {
    // Connect to database
    await connectDB();

    // Find all courses
    const courses = await Course.find({});

    if (courses.length === 0) {
      console.error('No courses found. Please create courses first.');
      process.exit(1);
    }

    // Years to create
    const yearsToCreate = ['2023', '2024', '2025', '2026', '2027'];

    // Create years for each course
    for (const course of courses) {
      for (const yearStr of yearsToCreate) {
        // Check if year already exists for this course
        const existingYear = await Year.findOne({ 
          year: yearStr, 
          course: course._id 
        });

        if (!existingYear) {
          const newYear = new Year({
            year: yearStr,
            course: course._id,
            description: `Academic year ${yearStr} for ${course.name}`,
            months: [],
            batches: [],
            students: []
          });

          await newYear.save();
          console.log(`Created year ${yearStr} for course ${course.name}`);
        }
      }
    }

    console.log('Default years initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('Error creating default years:', error);
    process.exit(1);
  }
};

// Run the script
createDefaultYears();
