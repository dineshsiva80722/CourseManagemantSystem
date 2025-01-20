import express from 'express';
import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Year from '../models/Year.js';
import Month from '../models/Month.js';
import Batch from '../models/Batch.js';
import Student from '../models/Student.js';

const router = express.Router();

// Create a new course
router.post('/courses/add', async (req, res) => {
  try {
    // Support both 'course' and 'name'
    const { course, name, description } = req.body;
    const courseName = course || name;
    
    // Validate input
    if (!courseName || !description) {
      return res.status(400).json({ message: 'Course name and description are required' });
    }

    // Check if course already exists
    const existingCourse = await Course.findOne({ 
      $or: [{ name: courseName }, { course: courseName }] 
    });
    if (existingCourse) {
      return res.status(409).json({ message: 'Course already exists' });
    }

    // Create new course
    const newCourse = new Course({ 
      name: courseName, 
      description 
    });
    await newCourse.save();

    res.status(201).json({ 
      message: 'Course added successfully', 
      course: newCourse 
    });
  } catch (error) {
    console.error('Error adding course:', error);
    res.status(500).json({ message: 'Error adding course', error: error.message });
  }
});

// Get all courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find().lean(); // Use lean for better performance
    
    console.log('Raw Courses from Database:', courses);
    
    // Transform courses to ensure both name and course are present
    const transformedCourses = courses.map(course => {
      const transformedCourse = {
        ...course,
        course: course.name,  // Explicitly set course to name
        name: course.name     // Preserve original 'name' field
      };
      
      // Ensure course field is set even if name is not present
      if (!transformedCourse.course) {
        transformedCourse.course = 'Unnamed Course';
      }
      
      console.log('Transformed Course:', transformedCourse);
      return transformedCourse;
    });
    
    console.log('All Transformed Courses:', transformedCourses);
    
    res.json(transformedCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
});

// Delete course route
router.delete('/courses/delete/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    // Validate courseId
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    // Log the incoming courseId for debugging
    console.log('Attempting to delete course with ID:', courseId);

    // Validate if the courseId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.error('Invalid course ID format:', courseId);
      return res.status(400).json({ message: 'Invalid course ID format' });
    }

    // Find and delete the course
    const deletedCourse = await Course.findByIdAndDelete(courseId);

    // Log the result of deletion
    if (!deletedCourse) {
      console.warn('No course found with ID:', courseId);
      return res.status(404).json({ message: 'Course not found' });
    }

    console.log('Course deleted successfully:', deletedCourse);

    res.status(200).json({ 
      message: 'Course deleted successfully', 
      course: deletedCourse 
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ 
      message: 'Error deleting course', 
      error: error.message,
      details: error.toString() 
    });
  }
});

// Add year to a course
router.post('/courses/:courseId/years/add', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { year, description } = req.body;

    // Validate input
    if (!courseId || !year) {
      return res.status(400).json({ message: 'Course ID and year are required' });
    }

    // Check if course exists
    const existingCourse = await Course.findById(courseId);
    if (!existingCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if year already exists for this course
    const existingYear = await Year.findOne({ 
      course: courseId, 
      year: year 
    });
    if (existingYear) {
      return res.status(409).json({ message: 'Year already exists for this course' });
    }

    // Create new year
    const newYear = new Year({ 
      year, 
      course: courseId,
      description: description || ''
    });
    await newYear.save();

    // Update course to include this year
    await Course.findByIdAndUpdate(courseId, 
      { $push: { years: newYear._id } },
      { new: true }
    );

    res.status(201).json({ 
      message: 'Year added successfully', 
      year: newYear 
    });
  } catch (error) {
    console.error('Error adding year:', error);
    res.status(500).json({ message: 'Error adding year', error: error.message });
  }
});

// Get years for a specific course
router.get('/courses/:courseId/years', async (req, res) => {
  try {
    const { courseId } = req.params;

    // Validate courseId
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    // Check if course exists
    const existingCourse = await Course.findById(courseId);
    if (!existingCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Find years for the course
    const years = await Year.find({ course: courseId });
    res.json(years);
  } catch (err) {
    console.error('Error in /api/courses/:courseId/years route:', err);
    res.status(500).json({ 
      message: 'Error fetching years', 
      error: err.message 
    });
  }
});

// Add a month to a year
router.post('/years/:yearId/months/add', async (req, res) => {
  try {
    const { yearId } = req.params;
    const { month } = req.body;
    
    // Validate input
    if (!yearId || !month) {
      return res.status(400).json({ message: 'Year ID and month are required' });
    }

    // Check if year exists
    const existingYear = await Year.findById(yearId);
    if (!existingYear) {
      return res.status(404).json({ message: 'Year not found' });
    }

    // Create new month
    const newMonth = new Month({ 
      month, 
      year: yearId 
    });
    await newMonth.save();

    // Update year to include this month
    await Year.findByIdAndUpdate(yearId, 
      { $push: { months: newMonth._id } },
      { new: true }
    );

    res.status(201).json({ 
      message: 'Month added successfully', 
      month: newMonth 
    });
  } catch (error) {
    console.error('Error adding month:', error);
    res.status(500).json({ message: 'Error adding month', error: error.message });
  }
});

// Get all months for a year
router.get('/years/:yearId/months', async (req, res) => {
  try {
    const { yearId } = req.params;

    // Validate yearId
    if (!yearId) {
      return res.status(400).json({ message: 'Year ID is required' });
    }

    // Check if year exists
    const existingYear = await Year.findById(yearId);
    if (!existingYear) {
      return res.status(404).json({ message: 'Year not found' });
    }

    const months = await Month.find({ year: yearId });
    res.json(months);
  } catch (err) {
    console.error('Error in /api/years/:yearId/months route:', err);
    res.status(500).json({ 
      message: 'Error fetching months', 
      error: err.message 
    });
  }
});

// Add a batch to a month
router.post('/months/:monthId/batches/add', async (req, res) => {
  try {
    const { monthId } = req.params;
    const { batch } = req.body;
    
    // Validate input
    if (!monthId || !batch) {
      return res.status(400).json({ message: 'Month ID and batch are required' });
    }

    // Check if month exists
    const existingMonth = await Month.findById(monthId);
    if (!existingMonth) {
      return res.status(404).json({ message: 'Month not found' });
    }

    // Create new batch
    const newBatch = new Batch({ 
      batch, 
      month: monthId 
    });
    await newBatch.save();

    // Update month to include this batch
    await Month.findByIdAndUpdate(monthId, 
      { $push: { batches: newBatch._id } },
      { new: true }
    );

    res.status(201).json({ 
      message: 'Batch added successfully', 
      batch: newBatch 
    });
  } catch (error) {
    console.error('Error adding batch:', error);
    res.status(500).json({ message: 'Error adding batch', error: error.message });
  }
});

// Get all batches for a month
router.get('/months/:monthId/batches', async (req, res) => {
  try {
    const { monthId } = req.params;

    // Validate monthId
    if (!monthId) {
      return res.status(400).json({ message: 'Month ID is required' });
    }

    // Check if month exists
    const existingMonth = await Month.findById(monthId);
    if (!existingMonth) {
      return res.status(404).json({ message: 'Month not found' });
    }

    const batches = await Batch.find({ month: monthId });
    res.json(batches);
  } catch (err) {
    console.error('Error in /api/months/:monthId/batches route:', err);
    res.status(500).json({ 
      message: 'Error fetching batches', 
      error: err.message 
    });
  }
});

// Add a student to a batch
router.post('/batches/:batchId/students/add', async (req, res) => {
  try {
    const { batchId } = req.params;
    const { student } = req.body;
    
    // Validate input
    if (!batchId || !student) {
      return res.status(400).json({ message: 'Batch ID and student are required' });
    }

    // Check if batch exists
    const existingBatch = await Batch.findById(batchId);
    if (!existingBatch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Create new student
    const newStudent = new Student({ 
      student, 
      batch: batchId 
    });
    await newStudent.save();

    // Update batch to include this student
    await Batch.findByIdAndUpdate(batchId, 
      { $push: { students: newStudent._id } },
      { new: true }
    );

    res.status(201).json({ 
      message: 'Student added successfully', 
      student: newStudent 
    });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ message: 'Error adding student', error: error.message });
  }
});

// Get all students for a batch
router.get('/batches/:batchId/students', async (req, res) => {
  try {
    const { batchId } = req.params;

    // Validate batchId
    if (!batchId) {
      return res.status(400).json({ message: 'Batch ID is required' });
    }

    // Check if batch exists
    const existingBatch = await Batch.findById(batchId);
    if (!existingBatch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    const students = await Student.find({ batch: batchId });
    res.json(students);
  } catch (err) {
    console.error('Error in /api/batches/:batchId/students route:', err);
    res.status(500).json({ 
      message: 'Error fetching students', 
      error: err.message 
    });
  }
});

// Get all batches
router.get('/batches', async (req, res) => {
  try {
    const batches = await Batch.find({});
    res.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ message: 'Error fetching batches', error: error.message });
  }
});

// Get all months
router.get('/months', async (req, res) => {
  try {
    const months = await Month.find({});
    res.json(months);
  } catch (error) {
    console.error('Error fetching months:', error);
    res.status(500).json({ message: 'Error fetching months', error: error.message });
  }
});

export default router;
