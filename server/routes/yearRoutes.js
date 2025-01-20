import express from 'express';
import Year from '../models/Year.js';
import Course from '../models/Course.js';

const router = express.Router();

// Get all years
router.get('/years', async (req, res) => {
  try {
    const { courseId } = req.query;

    // If courseId is provided, filter years by course
    const query = courseId ? { course: courseId } : {};

    const years = await Year.find(query)
      .populate('course', 'name')
      .sort({ year: 1 });

    // If no years exist, create default years for the course
    if (years.length === 0 && courseId) {
      const defaultYears = [];
      const currentYear = new Date().getFullYear();
      
      for (let i = 2020; i <= 2030; i++) {
        const newYear = new Year({
          year: i.toString(),
          course: courseId,
          description: `Academic year ${i}`,
          months: [], // You can populate months later if needed
          batches: [], // You can populate batches later if needed
          students: []
        });
        
        defaultYears.push(await newYear.save());
      }

      return res.status(201).json({
        message: 'Created default years',
        years: defaultYears
      });
    }

    res.status(200).json({
      message: 'Years retrieved successfully',
      years: years
    });
  } catch (error) {
    console.error('Error retrieving years:', error);
    res.status(500).json({ 
      message: 'Error retrieving years', 
      error: error.message 
    });
  }
});

// Create a new year
router.post('/years', async (req, res) => {
  try {
    const { year, courseId, description } = req.body;

    // Validate input
    if (!year || !courseId) {
      return res.status(400).json({ 
        message: 'Year and Course are required' 
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        message: 'Course not found' 
      });
    }

    // Check if year already exists for this course
    const existingYear = await Year.findOne({ 
      year, 
      course: courseId 
    });

    if (existingYear) {
      return res.status(400).json({ 
        message: 'Year already exists for this course' 
      });
    }

    // Create new year
    const newYear = new Year({
      year,
      course: courseId,
      description: description || `Academic year ${year}`,
      months: [],
      batches: [],
      students: []
    });

    await newYear.save();

    res.status(201).json({
      message: 'Year created successfully',
      year: newYear
    });
  } catch (error) {
    console.error('Error creating year:', error);
    res.status(500).json({ 
      message: 'Error creating year', 
      error: error.message 
    });
  }
});

export default router;
