import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Container, Alert, Spinner, Button } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';

export interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  course: string;
  month: string;
  batch: string;
  year: string;
}

const StudentList: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract state from navigation
  const { 
    course = 'networking', 
    year = '2025', 
    month = 'January', 
    batch = 'Batch 1' 
  } = location.state || {};

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);

        // Construct query parameters with state values
        const params = new URLSearchParams({
          course: typeof course === 'object' ? (course as any)._id || (course as any).course || 'networking' : course,
          year,
          month,
          batch
        });

        console.log('Fetching students with params:', { 
          course: typeof course === 'object' ? (course as any)._id || (course as any).course : course, 
          year, 
          month, 
          batch 
        });

        const response = await axios.get(`http://localhost:5000/api/students?${params.toString()}`);
        
        console.log('Full response:', response.data);
        console.log('Fetched students:', response.data.students);
        
        setStudents(response.data.students || []);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching students:', err);
        console.error('Error response:', err.response?.data);
        setError(err.response?.data?.message || 'Failed to fetch students');
        setLoading(false);
      }
    };

    fetchStudents();
  }, [course, year, month, batch]);

  // Add a button to go back to main panel
  const handleGoBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Container className="text-center mt-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {error}
        </Alert>
      </Container>
    );
  }

  if (students.length === 0) {
    return (
      <Container className="mt-4">
        <Alert variant="info">
          No students found for {typeof course === 'object' ? (course as any)._id || (course as any).course : course} - {year} - {month} - {batch}
        </Alert>
        <Button variant="primary" onClick={handleGoBack}>
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <h3 className="mb-3">
        Students: {typeof course === 'object' ? (course as any)._id || (course as any).course : course} - {year} - {month} - {batch}
      </h3>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Contact Number</th>
            <th>Course</th>
            <th>Month</th>
            <th>Batch</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student._id}>
              <td>{student.firstName}</td>
              <td>{student.lastName}</td>
              <td>{student.email}</td>
              <td>{student.contactNumber}</td>
              <td>{student.course}</td>
              <td>{student.month}</td>
              <td>{student.batch}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p>Total Students: {students.length}</p>
      <Button variant="primary" onClick={handleGoBack}>
        Go Back
      </Button>
    </Container>
  );
};

export default StudentList;
