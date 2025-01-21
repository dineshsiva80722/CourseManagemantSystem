import React, { useState, useEffect } from 'react';
import { Container, Button, Card, Modal, Form, Alert, Table } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import StudentList from '../Components/StudentList';
import { fetchCourses, fetchBatches, fetchMonths } from '../utils/fetchOptions';
import * as XLSX from 'xlsx';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



interface StudentPannelProps {
  batchId?: string;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  college: string;
  department: string;
  mobileNo: string;
  course: string;
  batch?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  year?: string;
  month?: string;
  fees?: number;
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [batchStudents, setBatchStudents] = useState<{ [batchName: string]: any[] }>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // State for available options
  const [availableCourses, setAvailableCourses] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);

  // State for editing fees
  const [editingFees, setEditingFees] = useState<{ [studentId: string]: boolean }>({});
  const [newFees, setNewFees] = useState<{ [studentId: string]: number }>({});

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

          // Ensure fees is always a number and from the database
          const studentWithFees = {
            ...student,
            fees: student.fees !== undefined ? Number(student.fees) : 0
          };

          acc[batchName].push(studentWithFees);
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
      case 'name':
        setName(value);
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
      case 'mobileNo':
        setMobileNo(value);
        break;
      case 'linkedinUrl':
        setLinkedinUrl(value);
        break;
      case 'githubUrl':
        setGithubUrl(value);
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
      if (!name.trim() || !email.trim()) {
        throw new Error('Name and Email are required fields.');
      }

      // Prepare student data
      const submissionData = {
        name: name.trim(),
        email: email.trim(),
        college: college.trim(),
        department: department.trim(),
        mobileNo: mobileNo.trim(),
        linkedinUrl: linkedinUrl.trim(),
        githubUrl: githubUrl.trim(),
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
      setName('');
      setEmail('');
      setCollege('');
      setDepartment('');
      setMobileNo('');
      setLinkedinUrl('');
      setGithubUrl('');

      // Close modal
      setShowModal(false);

      // Show success message
      setSuccess(`Student ${newStudent.name} added successfully!`);
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

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const handleShowDetails = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const handleUpdateFees = async (studentId: string) => {
    try {
      const feesToUpdate = newFees[studentId];

      // Validate fees
      if (feesToUpdate === undefined || feesToUpdate === null) {
        toast.error('Invalid fees amount');
        return;
      }

      console.log('Updating fees for student:', {
        studentId,
        fees: feesToUpdate
      });

      const response = await axios.put(`http://localhost:5000/api/students/updateFees/${studentId}`, {
        fees: Number(feesToUpdate)
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Use the server response to update the local state
      const updatedStudent = response.data;

      // Update batchStudents state to reflect the new fees
      setBatchStudents(prevBatchStudents => {
        const updatedBatchStudents = { ...prevBatchStudents };

        // Iterate through each batch
        Object.keys(updatedBatchStudents).forEach(batchName => {
          const studentIndex = updatedBatchStudents[batchName].findIndex(
            student => student._id === studentId
          );

          // If student found, update their fees
          if (studentIndex !== -1) {
            updatedBatchStudents[batchName][studentIndex] = {
              ...updatedBatchStudents[batchName][studentIndex],
              fees: updatedStudent.fees
            };
          }
        });

        return updatedBatchStudents;
      });

      // Reset editing state and clear new fees for this student
      setEditingFees(prev => ({ ...prev, [studentId]: false }));
      setNewFees(prev => {
        const updatedNewFees = { ...prev };
        delete updatedNewFees[studentId];
        return updatedNewFees;
      });

      toast.success('Fees updated successfully');
    } catch (error) {
      console.error('Error updating fees:', error);
      toast.error('Failed to update fees');
    }
  };

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
                <th className="px-4 py-2 border-b-2 border-blue-500 bg-blue-50 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-2 border-b-2 border-blue-500 bg-blue-50 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-2 border-b-2 border-blue-500 bg-blue-50 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  College
                </th>
                <th className="px-4 py-2 border-b-2 border-blue-500 bg-blue-50 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-4 py-2 border-b-2 border-blue-500 bg-blue-50 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Phone No
                </th>
                <th className="px-4 py-2 border-b-2 border-blue-500 bg-blue-50 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-4 py-2 border-b-2 border-blue-500 bg-blue-50 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Fees
                </th>
                <th className="px-4 py-2 border-b-2 border-blue-500 bg-blue-50 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student._id}
                  className="hover:bg-gray-50 even:bg-gray-100 odd:bg-white text-sm"
                >
                  <td className="px-4 py-2 border border-gray-300 whitespace-nowrap">{student.name}</td>
                  <td className="px-4 py-2 border border-gray-300 whitespace-nowrap">{student.email}</td>
                  <td className="px-4 py-2 border border-gray-300 whitespace-nowrap">{student.college}</td>
                  <td className="px-4 py-2 border border-gray-300 whitespace-nowrap">{student.department}</td>
                  <td className="px-4 py-2 border border-gray-300 whitespace-nowrap">{student.mobileNo}</td>
                  <td className="px-4 py-2 border border-gray-300 whitespace-nowrap">{student.course}</td>
                  <td className="px-4 py-2 border border-gray-300 whitespace-nowrap">

                    {editingFees[student._id] ? (
                      <div className="flex items-center">
                        <input
                          type="number"
                          value={newFees[student._id] ?? student.fees ?? 0}
                          onChange={(e) => setNewFees(prev => ({
                            ...prev,
                            [student._id]: Number(e.target.value)
                          }))}
                          className="border rounded px-2 py-1 w-24 mr-2"
                        />
                        <button
                          onClick={() => handleUpdateFees(student._id)}
                          className="bg-green-500 text-white px-2 py-1 rounded text-sm mr-2"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingFees(prev => ({ ...prev, [student._id]: false }))}
                          className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <h1>
                          ₹{student.fees ?? 0}
                        </h1>
                        <button
                          onClick={() => {
                            setNewFees(prev => ({
                              ...prev,
                              [student._id]: student.fees ?? 0
                            }));
                            setEditingFees(prev => ({ ...prev, [student._id]: true }));
                          }}
                          className="ml-2 text-blue-500 hover:text-blue-700"
                          title="Edit Fees"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                            stroke="currentColor" className="size-6">
                            <path stroke-linecap="round" stroke-linejoin="round"
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 border border-gray-300 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleShowDetails(student)}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded"
                        title="View Details"
                      >
                        <i className="bi bi-eye"></i> Details
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student._id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1 rounded"
                        title="Delete Student"
                      >
                        <i className="bi bi-trash"></i> Delete
                      </button>
                    </div>
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
                <div className="grid grid-cols-1 gap-2">
                  <p className="text-sm font-medium text-gray-700">
                    <span className="font-bold">Name: </span>
                    {student.name}
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
                    {student.mobileNo}
                  </p>
                  <p className="text-sm font-medium text-gray-700">
                    <span className="font-bold">Course: </span>
                    {student.course}
                  </p>
                  <p className="text-sm font-medium text-gray-700">
                    <span className="font-bold">Fees: </span>
                    {editingFees[student._id] ? (
                      <div className="flex items-center">
                        <input
                          type="number"
                          value={newFees[student._id] ?? student.fees ?? 0}
                          onChange={(e) => setNewFees(prev => ({
                            ...prev,
                            [student._id]: Number(e.target.value)
                          }))}
                          className="border rounded px-2 py-1 w-24 mr-2"
                        />
                        <button
                          onClick={() => handleUpdateFees(student._id)}
                          className="bg-green-500 text-white px-2 py-1 rounded text-sm mr-2"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingFees(prev => ({ ...prev, [student._id]: false }))}
                          className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        ₹{student.fees ?? 0}
                        <button
                          onClick={() => {
                            setNewFees(prev => ({
                              ...prev,
                              [student._id]: student.fees ?? 0
                            }));
                            setEditingFees(prev => ({ ...prev, [student._id]: true }));
                          }}
                          className="ml-2 text-blue-500 hover:text-blue-700"
                          title="Edit Fees"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                      </div>
                    )}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleShowDetails(student)}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded flex-1"
                      title="View Details"
                    >
                      <i className="bi bi-eye"></i> View Details
                    </button>
                    <button
                      onClick={() => handleDeleteStudent(student._id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1 rounded flex-1"
                      title="Delete Student"
                    >
                      <i className="bi bi-trash"></i> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Student Details Modal */}
          <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Student Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedStudent && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="border-b pb-2">
                    <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
                    <p><span className="font-bold">Name:</span> {selectedStudent.name}</p>
                    <p><span className="font-bold">Email:</span> {selectedStudent.email}</p>

                    <p><span className="font-bold">Phone No:</span> {selectedStudent.mobileNo}</p>
                  </div>

                  <div className="border-b pb-2">
                    <h3 className="text-lg font-semibold mb-2">Academic Information</h3>
                    <p><span className="font-bold">College:</span> {selectedStudent.college}</p>
                    <p><span className="font-bold">Department:</span> {selectedStudent.department}</p>
                    <p><span className="font-bold">Course:</span> {selectedStudent.course}</p>
                    <p><span className="font-bold">Batch:</span> {selectedStudent.batch}</p>
                    <p><span className="font-bold">Year:</span> {selectedStudent.year}</p>
                    <p><span className="font-bold">Month:</span> {selectedStudent.month}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Social Links</h3>
                    {selectedStudent.linkedinUrl ? (
                      <p>
                        <span className="font-bold">LinkedIn:</span>{' '}
                        <a
                          href={selectedStudent.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Link <i className="bi bi-box-arrow-up-right text-xs"></i>
                        </a>
                      </p>
                    ) : (
                      <p className="text-gray-500">No LinkedIn profile provided</p>
                    )}

                    {selectedStudent.githubUrl ? (
                      <p>
                        <span className="font-bold">GitHub:</span>{' '}
                        <a
                          href={selectedStudent.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Link <i className="bi bi-box-arrow-up-right text-xs"></i>
                        </a>
                      </p>
                    ) : (
                      <p className="text-gray-500">No GitHub profile provided</p>
                    )}
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
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
      'Name': student.name,
      'Email': student.email,
      'College': student.college,
      'Department': student.department,
      'Mobile No': student.mobileNo,
      'Course': student.course,
      'Batch': student.batch,
      'Year': student.year,
      'Month': student.month
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
      <ToastContainer />
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
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={name}
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
              <Form.Label>Mobile No</Form.Label>
              <Form.Control
                type="tel"
                name="mobileNo"
                value={mobileNo}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>LinkedIn URL</Form.Label>
              <Form.Control
                type="text"
                name="linkedinUrl"
                value={linkedinUrl}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>GitHub URL</Form.Label>
              <Form.Control
                type="text"
                name="githubUrl"
                value={githubUrl}
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