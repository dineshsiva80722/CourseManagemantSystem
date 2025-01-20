import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

interface AddStudentFormProps {
  batchId: string;
  course: string | { name?: string; course?: string };
  year: string;
  month: string;
}

const AddStudentForm: React.FC<AddStudentFormProps> = ({ batchId, course, year, month }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    college: '',
    department: '',
    fees: '',
    address: ''
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
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.firstName || !formData.email || !formData.contactNumber || !formData.fees || !formData.address) {
        setError('Please fill in all required fields');
        return;
      }

      // console.log('Submitting student data:', {
      //   ...formData,
      //   course,
      //   year,
      //   month,
      //   batch: batchId
      // });

      // First create the student
      const studentResponse = await axios.post('http://localhost:5000/api/students/add', {
        firstName: formData.firstName,
        lastName: formData.lastName || '',
        email: formData.email,
        contactNumber: formData.contactNumber,
        college: formData.college || '',
        department: formData.department || '',
        fees: Number(formData.fees),
        address: formData.address,
        course: typeof course === 'object' ? course.name || course.course || 'web development' : course,
        year,
        month,
        batch: batchId
      });


      // console.log('Server response:', studentResponse.data);
      // console.log('Request payload:', {
      //   firstName: formData.firstName,
      //   lastName: formData.lastName || '',
      //   email: formData.email,
      //   contactNumber: formData.contactNumber,
      //   college: formData.college || '',
      //   department: formData.department || '',
      //   fees: Number(formData.fees),
      //   address: formData.address,
      //   course: typeof course === 'object' ? course.name || course.course || 'web development' : course,
      //   year,
      //   month,
      //   batch: batchId,
      // });
      

      setSuccess(true);
      setError(null);
      
      // Clear form for next entry
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: '',
        college: '',
        department: '',
        fees: '',
        address: ''
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (err: any) {
      console.error('Error adding student:', err);
      setError(err.response?.data?.message || 'Error adding student');
      setSuccess(false);
    }
  };

  return (
    <Container className="py-4" style={{ maxWidth: '600px' }}>
      <h4 className="mb-4">Add New Student</h4>
      <div className="mb-4">
        <strong>Course:</strong> {typeof course === 'object' ? course.name || course.course || 'web development' : course} | <strong>Batch:</strong> {batchId} | <strong>Year:</strong> {year} | <strong>Month:</strong> {month}
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
          <Form.Label>First Name</Form.Label>
          <Form.Control
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Last Name</Form.Label>
          <Form.Control
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
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
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Department</Form.Label>
          <Form.Control
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Contact Number</Form.Label>
          <Form.Control
            type="tel"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Fees</Form.Label>
          <Form.Control
            type="number"
            name="fees"
            value={formData.fees}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Address</Form.Label>
          <Form.Control
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
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
