import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Year from '../models/Year.js';
import Month from '../models/Month.js';
import Batch from '../models/Batch.js';
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

// Function to create default courses, years, months, and batches
const initializeData = async () => {
  try {
    // Connect to database
    await connectDB();

    // Predefined courses
    const coursesData = [
      { 
        name: 'web development', 
        description: 'Full stack web development course' 
      },
      { 
        name: 'data science', 
        description: 'Advanced data science and machine learning' 
      }
    ];

    // Predefined years
    const yearsToCreate = ['2023', '2024', '2025', '2026', '2027'];

    // Predefined months
    const monthsData = [
      'January', 'February', 'March', 'April', 
      'May', 'June', 'July', 'August', 
      'September', 'October', 'November', 'December'
    ];

    // Predefined batches
    const batchesData = ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4'];

    // Create courses
    const createdCourses = [];
    for (const courseData of coursesData) {
      let course = await Course.findOne({ name: courseData.name });
      if (!course) {
        course = new Course(courseData);
        await course.save();
        console.log(`Created course: ${course.name}`);
      }
      createdCourses.push(course);
    }

    // Create months
    const createdMonths = [];
    for (const monthName of monthsData) {
      let month = await Month.findOne({ name: monthName });
      if (!month) {
        month = new Month({ name: monthName });
        await month.save();
        console.log(`Created month: ${month.name}`);
      }
      createdMonths.push(month);
    }

    // Create batches
    const createdBatches = [];
    for (const batchName of batchesData) {
      let batch = await Batch.findOne({ name: batchName });
      if (!batch) {
        batch = new Batch({ name: batchName });
        await batch.save();
        console.log(`Created batch: ${batch.name}`);
      }
      createdBatches.push(batch);
    }

    // Create years for each course
    for (const course of createdCourses) {
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
            months: createdMonths.map(m => m._id),
            batches: createdBatches.map(b => b._id),
            students: []
          });

          await newYear.save();
          console.log(`Created year ${yearStr} for course ${course.name}`);
        }
      }
    }

    console.log('Data initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing data:', error);
    process.exit(1);
  }
};

// Run the script
initializeData();
