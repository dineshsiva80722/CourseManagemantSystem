import express from 'express';
import mongoose from 'mongoose';
import CourseYearMonthBatch from '../models/CourseYearMonthBatch.js';
import Course from '../models/Course.js';
import Month from '../models/Month.js';
import Batch from '../models/Batch.js';
import Student from '../models/Student.js';

const router = express.Router();

// Create or update a CourseYearMonthBatch collection when a student is added
router.post('/course-year-month-batch/add-student', async (req, res) => {
  try {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));

    const { 
      course, 
      year, 
      month, 
      batch, 
      studentId 
    } = req.body;

    // Detailed input validation with specific error messages
    const validationErrors = [];
    if (!course) validationErrors.push('Course is required');
    if (!year) validationErrors.push('Year is required');
    if (!month) validationErrors.push('Month is required');
    if (!batch) validationErrors.push('Batch is required');
    if (!studentId) validationErrors.push('Student ID is required');

    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors,
        receivedData: req.body
      });
    }

    // Find or create references with more flexible matching
    const courseRef = await Course.findOne({ 
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(course) ? course : null },
        { name: course },
        { course: course }
      ]
    });

    const monthRef = await Month.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(month) ? month : null },
        { name: month }
      ]
    });

    const batchRef = await Batch.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(batch) ? batch : null },
        { name: batch }
      ]
    });

    const studentRef = await Student.findById(studentId);

    // Detailed reference validation
    const referenceErrors = [];
    if (!courseRef) {
      referenceErrors.push('Course not found');
      console.error('Course not found:', course);
    }
    if (!monthRef) {
      referenceErrors.push('Month not found');
      console.error('Month not found:', month);
    }
    if (!batchRef) {
      referenceErrors.push('Batch not found');
      console.error('Batch not found:', batch);
    }
    if (!studentRef) {
      referenceErrors.push('Student not found');
      console.error('Student not found:', studentId);
    }

    if (referenceErrors.length > 0) {
      return res.status(404).json({ 
        message: 'References not found',
        errors: referenceErrors,
        details: {
          courseFound: !!courseRef,
          monthFound: !!monthRef,
          batchFound: !!batchRef,
          studentFound: !!studentRef
        },
        availableOptions: {
          courses: await Course.find({}, 'name'),
          months: await Month.find({}, 'name'),
          batches: await Batch.find({}, 'name')
        }
      });
    }

    // Find or create the CourseYearMonthBatch document
    let courseYearMonthBatch = await CourseYearMonthBatch.findOne({
      course: courseRef._id,
      year,
      month: monthRef._id,
      batch: batchRef._id
    });

    if (!courseYearMonthBatch) {
      // Create new document if not exists
      courseYearMonthBatch = new CourseYearMonthBatch({
        course: courseRef._id,
        year,
        month: monthRef._id,
        batch: batchRef._id,
        students: [studentRef._id],
        totalStudents: 1,
        metadata: {
          courseName: courseRef.name,
          monthName: monthRef.name,
          batchName: batchRef.name
        }
      });
    } else {
      // Check if student already exists in the collection
      if (!courseYearMonthBatch.students.includes(studentRef._id)) {
        courseYearMonthBatch.students.push(studentRef._id);
        courseYearMonthBatch.totalStudents = courseYearMonthBatch.students.length;
      }
    }

    // Save the document
    await courseYearMonthBatch.save();

    res.status(201).json({
      message: 'Student added to CourseYearMonthBatch successfully',
      courseYearMonthBatch: {
        _id: courseYearMonthBatch._id,
        course: courseRef.name,
        year,
        month: monthRef.name,
        batch: batchRef.name,
        totalStudents: courseYearMonthBatch.totalStudents
      }
    });
  } catch (error) {
    console.error('Error adding student to CourseYearMonthBatch:', error);
    res.status(500).json({ 
      message: 'Error adding student to CourseYearMonthBatch', 
      error: error.message 
    });
  }
});

// Get CourseYearMonthBatch details
router.get('/course-year-month-batch', async (req, res) => {
  try {
    const { 
      course, 
      year, 
      month, 
      batch 
    } = req.query;

    // Build query dynamically
    const query = {};

    if (course) {
      const courseRef = await Course.findOne({ 
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(course) ? course : null },
          { name: course }
        ]
      });
      if (courseRef) query.course = courseRef._id;
    }

    if (year) query.year = year;

    if (month) {
      const monthRef = await Month.findOne({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(month) ? month : null },
          { name: month }
        ]
      });
      if (monthRef) query.month = monthRef._id;
    }

    if (batch) {
      const batchRef = await Batch.findOne({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(batch) ? batch : null },
          { name: batch }
        ]
      });
      if (batchRef) query.batch = batchRef._id;
    }

    // Fetch CourseYearMonthBatch documents
    const courseYearMonthBatches = await CourseYearMonthBatch.find(query)
      .populate('course', 'name')
      .populate('month', 'name')
      .populate('batch', 'name')
      .populate('students');

    if (courseYearMonthBatches.length === 0) {
      return res.status(404).json({ 
        message: 'No CourseYearMonthBatch found matching the criteria',
        query 
      });
    }

    res.status(200).json({
      message: `Found ${courseYearMonthBatches.length} CourseYearMonthBatch documents`,
      courseYearMonthBatches: courseYearMonthBatches.map(doc => ({
        _id: doc._id,
        course: doc.course.name,
        year: doc.year,
        month: doc.month.name,
        batch: doc.batch.name,
        totalStudents: doc.totalStudents,
        students: doc.students.map(student => ({
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email
        }))
      }))
    });
  } catch (error) {
    console.error('Error fetching CourseYearMonthBatch:', error);
    res.status(500).json({ 
      message: 'Error fetching CourseYearMonthBatch', 
      error: error.message 
    });
  }
});

export default router;
