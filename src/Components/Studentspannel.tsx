import React, { useState, useEffect } from 'react';
import { Container, Button, Card, Modal, Form, Alert, Table } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import StudentList from '../Components/StudentList';
import { fetchCourses, fetchBatches, fetchMonths } from '../utils/fetchOptions';
import * as XLSX from 'xlsx';

interface StudentPannelProps {
  batchId?: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  college: string;
  department: string;
  fees: number;
  address: string;
  course: string;
  batch: string;
  year: string;
  month: string;
}

const Studentspannel: React.FC<StudentPannelProps> = ({ batchId }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract course, year, batch, and month from navigation state
  const { course, year, batch, month } = location.state || {};

  // Determine the actual batch ID
  const actualBatchId = batchId || (batch?._id || batch);

  if (!course || !year || !batch || !month) {
    return (
      <Container className="py-4">
        <h1 className="text-center mb-4">Invalid Navigation</h1>
        <div className="text-center">
          <Button variant="secondary" onClick={() => navigate('/')}>
            Back to Courses
          </Button>
        </div>
      </Container>
    );
  }

  const [showModal, setShowModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [fees, setFees] = useState('');
  const [address, setAddress] = useState('');
  const [batchStudents, setBatchStudents] = useState<{ [batchName: string]: any[] }>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // State for available options
  const [availableCourses, setAvailableCourses] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);

  // Fetch students when component mounts or when key parameters change
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate navigation state
        if (!course || !year || !batch || !month) {
          throw new Error('Missing navigation parameters. Please navigate from the correct page.');
        }

        // Prepare query parameters with comprehensive logging
        const queryParams = {
          course: typeof course === 'string'
            ? course
            : (course?.name || course?.course || 'web development'),
          year: typeof year === 'string'
            ? year
            : (year?.year || year?.name || '2025'),
          month: typeof month === 'string'
            ? month
            : (month?.name || 'January'),
          batch: typeof batch === 'string'
            ? batch
            : (batch?.name || 'Batch 1')
        };

        // console.log('Fetching students with detailed params:', {
        //   courseParam: queryParams.course,
        //   yearParam: queryParams.year,
        //   monthParam: queryParams.month,
        //   batchParam: queryParams.batch,
        //   courseType: typeof course,
        //   courseKeys: course ? Object.keys(course) : 'N/A',
        //   courseObject: course
        // });

        // Try fetching from dynamic collection route
        const dynamicCollectionResponse = await axios.get('http://localhost:5000/api/students', {
          params: queryParams,
          timeout: 10000
        });

        // console.log('Dynamic Collection Response:', {
        //   status: dynamicCollectionResponse.status,
        //   data: dynamicCollectionResponse.data
        // });

        // Validate response data
        if (!dynamicCollectionResponse.data || !dynamicCollectionResponse.data.students) {
          throw new Error('No student data received from the server');
        }

        // Group students by batch
        const studentsByBatch = dynamicCollectionResponse.data.students.reduce((acc, student) => {
          const batchName = student.batch || 'Unknown Batch';
          if (!acc[batchName]) {
            acc[batchName] = [];
          }
          acc[batchName].push(student);
          return acc;
        }, {} as { [batchName: string]: any[] });

        // console.log('Students Grouped by Batch:', studentsByBatch);

        // Update batch students state
        setBatchStudents(studentsByBatch);

        // If no students found, set an informative message
        if (Object.keys(studentsByBatch).length === 0) {
          setError('No students found for the selected course, year, batch, and month.');
        }
      } catch (err: any) {
        // Prepare query parameters before error logging
        const queryParams = {
          course: typeof course === 'string'
            ? course
            : (course?.name || course?.course || 'web development'),
          year: typeof year === 'string'
            ? year
            : (year?.year || year?.name || '2025'),
          month: typeof month === 'string'
            ? month
            : (month?.name || 'January'),
          batch: typeof batch === 'string'
            ? batch
            : (batch?.name || 'Batch 1')
        };

        // Comprehensive error logging
        console.error('Complete Error Object:', err);
        console.error('Error Details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          requestParams: {
            course: queryParams.course,
            year: queryParams.year,
            month: queryParams.month,
            batch: queryParams.batch
          }
        });

        // Set user-friendly error message
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          'Failed to fetch students. Please check your connection and try again.';

        // Log specific error details for debugging
        if (err.response?.data) {
          console.error('Detailed Server Error:', {
            message: err.response.data.message,
            details: err.response.data,
            availableYears: err.response.data.availableYears
          });
        }

        // If year is not found, log additional context
        if (err.response?.data?.message === 'Year not found') {
          const queryParams = new URLSearchParams(location.search);
          console.warn('Year Debugging:', {
            inputYear: queryParams.get('year'),
            availableYears: err.response.data.availableYears,
            courseObject: course,
            courseDetails: {
              name: course?.name,
              course: course?.course,
              id: course?._id
            }
          });
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if all required parameters are present
    if (course && year && batch && month) {
      fetchStudents();
    } else {
      console.warn('Missing navigation parameters:', {
        course: !!course,
        year: !!year,
        batch: !!batch,
        month: !!month
      });
      setError('Invalid navigation. Please select a course, year, batch, and month.');
      setLoading(false);
    }
  }, [course, year, batch, month]);

  // Fetch available options when component mounts
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const courses = await fetchCourses();
        const batches = await fetchBatches();
        const months = await fetchMonths();

        setAvailableCourses(courses);
        setAvailableBatches(batches);
        setAvailableMonths(months);

        // console.log('Available Options:', {
        //   courses,
        //   batches,
        //   months
        // });
      } catch (error) {
        console.error('Error loading options:', error);
      }
    };

    loadOptions();
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    switch (name) {
      case 'firstName':
        setFirstName(value);
        break;
      case 'lastName':
        setLastName(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'college':
        setCollege(value);
        break;
      case 'department':
        setDepartment(value);
        break;
      case 'contactNumber':
        setContactNumber(value);
        break;
      case 'fees':
        setFees(value);
        break;
      case 'address':
        setAddress(value);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      // Validate form data
      if (!course || !year || !month || !batch) {
        throw new Error('Please select a course, year, month, and batch before adding a student.');
      }

      // Validate required fields
      if (!firstName.trim() || !lastName.trim() || !email.trim()) {
        throw new Error('First Name, Last Name, and Email are required fields.');
      }

      // Prepare student data
      const submissionData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        college: college.trim(),
        department: department.trim(),
        contactNumber: contactNumber.trim(),
        fees: parseFloat(fees) || 0,
        address: address.trim(),
        course: typeof course === 'string'
          ? course
          : (course?.name || course?.course || 'networking'),
        year: typeof year === 'string'
          ? year
          : (year?.year || year?.name || '2025'),
        month: typeof month === 'string'
          ? month
          : (month?.name || 'January'),
        batch: typeof batch === 'string'
          ? batch
          : (batch?.name || 'Batch 1')
      };

      // Send request to add student
      const updatedStudentsResponse = await axios.post('http://localhost:5000/api/students/add', submissionData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Update batch students state with the latest data
      const newStudent = updatedStudentsResponse.data.student;
      const updatedStudentsByBatch = {
        ...batchStudents,
        [newStudent.batch || 'Unknown Batch']: [
          ...(batchStudents[newStudent.batch || 'Unknown Batch'] || []),
          newStudent
        ]
      };

      setBatchStudents(updatedStudentsByBatch);

      // Reset form fields
      setFirstName('');
      setLastName('');
      setEmail('');
      setCollege('');
      setDepartment('');
      setContactNumber('');
      setFees('');
      setAddress('');

      // Close modal
      setShowModal(false);

      // Show success message
      setSuccess(`Student ${newStudent.firstName} ${newStudent.lastName} added successfully!`);
    } catch (error: any) {
      console.error('Complete Error Object:', error);

      // Prepare error message
      let errorMessage = 'Failed to add student.';

      if (error.response) {
        // Server responded with an error
        console.error('Server Response Error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });

        switch (error.response.status) {
          case 500:
            errorMessage = 'Internal Server Error. Please try again later.';
            // Log full error details for debugging
            console.error('Detailed Server Error:', {
              message: error.response.data.message,
              error: error.response.data.error,
              stack: error.response.data.stack
            });
            break;
          case 409:
            errorMessage = `A student with email ${email} already exists.`;
            break;
          case 400:
            errorMessage = error.response.data.message ||
              'Invalid student data. Please check your inputs.';
            break;
          default:
            errorMessage = error.response.data.message ||
              'Unexpected server error occurred.';
        }
      } else if (error.request) {
        // Request made but no response received
        errorMessage = 'No response from server. Please check your connection.';
        console.error('Request Error:', error.request);
      } else {
        // Error in setting up the request
        errorMessage = error.message || 'An unexpected error occurred.';
        console.error('Error Message:', error.message);
      }

      // Set error state
      setError(errorMessage);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      // Confirm deletion
      const confirmDelete = window.confirm('Are you sure you want to delete this student?');
      if (!confirmDelete) return;

      // Send delete request
      await axios.delete(`http://localhost:5000/api/students/${studentId}`);

      // Update students state
      const updatedStudentsByBatch = Object.fromEntries(
        Object.entries(batchStudents).map(([batchName, students]) => [
          batchName,
          students.filter(student => student._id !== studentId)
        ])
      );

      setBatchStudents(updatedStudentsByBatch);

      // Show success message
      setSuccess('Student deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting student:', error);
      setError(error.response?.data?.message || 'Failed to delete student');
    }
  };

  // Render students by batch with new fields and total count
  const renderStudentsByBatch = () => {
    return Object.entries(batchStudents).map(([batchName, students]) => (
      <div key={batchName} className="batch-students-container mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>{batchName} Students</h3>
        </div>
        <div className="">
          {/* Table view for large devices */}
          <table className="students-table w-full border-collapse border border-gray-300 bg-white hidden lg:table">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border border-gray-300 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-sm font-medium text-gray-700">Email</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-sm font-medium text-gray-700">College</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-sm font-medium text-gray-700">Department</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-sm font-medium text-gray-700">Phone No</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-sm font-medium text-gray-700">Fees</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-sm font-medium text-gray-700">Course</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-sm font-medium text-gray-700">Address</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student._id}
                  className="hover:bg-gray-50 even:bg-gray-100 odd:bg-white text-sm"
                >
                  <td className="px-4 py-2 border border-gray-300 whitespace-nowrap">{student.firstName} {student.lastName}</td>
                  <td className="px-4 py-2 border border-gray-300 whitespace-nowrap">{student.email}</td>
                  <td className="px-4 py-2 border border-gray-300 whitespace-nowrap">{student.college}</td>
                  <td className="px-4 py-2 border border-gray-300 whitespace-nowrap">{student.department}</td>
                  <td className="px-4 py-2 border border-gray-300 whitespace-nowrap">{student.contactNumber}</td>
                  <td className="px-4 py-2 border border-gray-300 whitespace-nowrap">{student.fees}</td>
                  <td className="px-4 py-2 border border-gray-300 whitespace-nowrap">{student.course}</td>
                  <td className="px-4 py-2 border border-gray-300 whitespace-nowrap">{student.address}</td>
                  <td className="px-4 py-2 border border-gray-300 whitespace-nowrap">
                    <button
                      onClick={() => handleDeleteStudent(student._id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1 rounded"
                      title="Delete Student"
                    >
                      <i className="bi bi-trash"></i> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Responsive block layout for small and medium devices */}
          <div className="block lg:hidden">
            {students.map((student) => (
              <div
                key={student._id}
                className="border border-gray-300 bg-white p-4 mb-4 rounded shadow"
              >
                <p className="text-sm font-medium text-gray-700">
                  <span className="font-bold">Name: </span>
                  {student.firstName} {student.lastName}
                </p>
                <p className="text-sm font-medium text-gray-700">
                  <span className="font-bold">Email: </span>
                  {student.email}
                </p>
                <p className="text-sm font-medium text-gray-700">
                  <span className="font-bold">College: </span>
                  {student.college}
                </p>
                <p className="text-sm font-medium text-gray-700">
                  <span className="font-bold">Department: </span>
                  {student.department}
                </p>
                <p className="text-sm font-medium text-gray-700">
                  <span className="font-bold">Phone No: </span>
                  {student.contactNumber}
                </p>
                <p className="text-sm font-medium text-gray-700">
                  <span className="font-bold">Fees: </span>
                  {student.fees}
                </p>
                <p className="text-sm font-medium text-gray-700">
                  <span className="font-bold">Course: </span>
                  {student.course}
                </p>
                <p className="text-sm font-medium text-gray-700">
                  <span className="font-bold">Address: </span>
                  {student.address}
                </p>
                <button
                  onClick={() => handleDeleteStudent(student._id)}
                  className="mt-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1 rounded"
                  title="Delete Student"
                >
                  <i className="bi bi-trash"></i> Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    ));
  };

  // Calculate total students across all batches
  const totalStudents = Object.values(batchStudents).reduce(
    (total, students) => total + students.length,
    0
  );

  const handleExportToExcel = () => {
    // Flatten students from all batches
    const allStudents = Object.values(batchStudents).flat();

    // Prepare data for Excel export with selected fields
    const exportData = allStudents.map(student => ({
      'First Name': student.firstName,
      'Last Name': student.lastName,
      'Email': student.email,
      'Contact Number': student.contactNumber,
      'College': student.college,
      'Department': student.department,
      'Course': student.course,
      'Batch': student.batch,
      'Year': student.year,
      'Month': student.month,
      'Fees': student.fees
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Generate filename with current date
    const filename = `students_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const handleAddStudent = () => {
    const courseName = typeof course === 'object' ? course.name || course.course || 'web development' : course;
    const url = `/add-student?batchId=${actualBatchId}&course=${encodeURIComponent(courseName)}&year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`;
    window.open(url, '_blank');
  };

  return (
    <Container className="py-4">
      <div className="lg:flex justify-content-between align-items-center mb-4">
        <h1 className="lg:text-3xl py-3 font-semibold md:text-2xl text-sm">
          {course?.name || course} ({year}  {month} {batch})
        </h1>
        <div className="flex lg:gap-4 gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/')}
            className="lg:text-lg md:text-md text-sm"
          >
            <span className='hidden lg:inline'>Back to</span>Courses
          </Button>
          <Button
            variant="primary"
            onClick={handleExportToExcel}
            className="lg:text-lg md:text-md text-sm"
          >
             <span className='hidden lg:inline'>Export to </span> Excel
           
          </Button>
          <Button
            variant="primary"
            onClick={handleAddStudent}
            className="lg:text-lg md:text-md text-sm"
           
          >
             <span className='hidden lg:inline'>New</span>Tab
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
          {success}
        </Alert>
      )}

      <div className="text-center py-10 mb-3">
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Add New Student
        </Button>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="text-center">Loading students...</div>
      ) : (
        <div>
          <div className="alert relative  d-flex justify-content-between align-items-center mb-4">
            {/* <span className='lg:text-xl md:text-md sm:text-sm'>Total Students in {course?.name || course}</span> */}
            <strong className="absolute right-0 lg:text-lg md:text-md sm:text-sm text-blue-500">
              {totalStudents} Students
            </strong>
          </div>
          {renderStudentsByBatch()}
        </div>
      )}

      {/* Add Student Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Student</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                name="firstName"
                value={firstName}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                name="lastName"
                value={lastName}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={email}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>College</Form.Label>
              <Form.Control
                type="text"
                name="college"
                value={college}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Department</Form.Label>
              <Form.Control
                type="text"
                name="department"
                value={department}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contact Number</Form.Label>
              <Form.Control
                type="tel"
                name="contactNumber"
                value={contactNumber}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Fees</Form.Label>
              <Form.Control
                type="number"
                name="fees"
                value={fees}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={address}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Add Student
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Studentspannel;