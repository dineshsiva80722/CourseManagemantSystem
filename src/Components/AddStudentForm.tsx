import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

interface AddStudentFormProps {
  batchId: string;
  course: string | { name?: string; course?: string };
  name?: string;
  year: string | { year?: string; name?: string };
  month: string | { name?: string };
}

const AddStudentForm: React.FC<AddStudentFormProps> = ({ batchId, course, year, month }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    college: '',
    department: '',
    mobileNo: '',
    linkedinUrl: '',
    githubUrl: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!formData.name || !formData.email) {
        throw new Error('Name and Email are required fields.');
      }

      // Prepare student data
      const submissionData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        college: formData.college?.trim() || '',
        department: formData.department?.trim() || '',
        mobileNo: formData.mobileNo?.trim() || '',
        course: typeof course === 'string'
          ? course
          : (course?.name || course?.course || 'networking'),
        batch: batchId || 'Batch 1',
        linkedinUrl: formData.linkedinUrl?.trim() || '', // Optional field
        githubUrl: formData.githubUrl?.trim() || '', // Optional field
        year: typeof year === 'string'
          ? year
          : (year.year || (year.name && parseInt(year.name, 10).toString()) || '2025'),
        month: typeof month === 'string'
          ? month
          : (month?.name || 'January'),
        fees: 0
      };

      // Send request to add student
      const response = await axios.post('http://localhost:5000/api/students/add', submissionData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        college: '',
        department: '',
        mobileNo: '',
        linkedinUrl: '',
        githubUrl: ''
      });

      // Set success state
      setSuccess(true);
      setError(null);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

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
            errorMessage = `A student with email ${formData.email} already exists.`;
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
      setSuccess(false);
    }
  };

  return (
    <Container className="py-4" style={{ maxWidth: '600px' }}>
      <h4 className="mb-4">Add New Student</h4>
      <div className="mb-4">
        <strong>Course:</strong> {typeof course === 'object' ? String(course.name || course.course || 'web development') : String(course)} | <strong>Batch:</strong> {String(batchId)} | <strong>Year:</strong> {typeof year === 'object' ? String(year.year || year.name || 'N/A') : String(year)} | <strong>Month:</strong> {String(month)}
      </div>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
          Student added successfully! You can add another student.
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>College</Form.Label>
          <Form.Control
            type="text"
            name="college"
            value={formData.college}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Department</Form.Label>
          <Form.Control
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Mobile Number</Form.Label>
          <Form.Control
            type="tel"
            name="mobileNo"
            value={formData.mobileNo}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>LinkedIn URL (Optional)</Form.Label>
          <Form.Control
            type="url"
            name="linkedinUrl"
            value={formData.linkedinUrl}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>GitHub URL (Optional)</Form.Label>
          <Form.Control
            type="url"
            name="githubUrl"
            value={formData.githubUrl}
            onChange={handleChange}
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          Add Student
        </Button>
      </Form>
    </Container>
  );
};

export default AddStudentForm;
