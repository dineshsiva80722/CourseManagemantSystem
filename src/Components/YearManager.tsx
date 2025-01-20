import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Form, Button, ListGroup, Alert, Spinner } from 'react-bootstrap';

interface Course {
  _id: string;
  name: string;
}

interface Year {
  _id: string;
  year: string;
  course: string | Course;
  description?: string;
}

interface YearManagerProps {
  course: string;
}

const YearManager: React.FC<YearManagerProps> = ({ course }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [newYear, setNewYear] = useState({
    year: '',
    description: '',
    courseId: course
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch courses and years
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch courses if not already fetched
        const coursesResponse = await axios.get('http://localhost:5000/api/courses');
        setCourses(coursesResponse.data.courses);

        // Fetch years for the current course
        const yearsResponse = await axios.get(`http://localhost:5000/api/years?course=${course}`);
        setYears(yearsResponse.data.years);
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, [course]);

  // Handle year submission
  const handleSubmitYear = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await axios.post('http://localhost:5000/api/years/add', {
        ...newYear,
        course: course
      });

      // Update years list
      setYears([...years, response.data.year]);
      
      // Reset form
      setNewYear({
        year: '',
        description: '',
        courseId: course
      });

      setSuccess('Year added successfully');
      setLoading(false);
    } catch (err: any) {
      console.error('Error adding year:', err);
      setError(err.response?.data?.message || 'Failed to add year');
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row>
        <Col md={6}>
          <h4>Add Year for {course}</h4>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmitYear}>
            <Form.Group className="mb-3">
              <Form.Label>Year</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter year (e.g., 2025)"
                value={newYear.year}
                onChange={(e) => setNewYear({...newYear, year: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter year description"
                value={newYear.description}
                onChange={(e) => setNewYear({...newYear, description: e.target.value})}
              />
            </Form.Group>
            
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading}
            >
              {loading ? <Spinner animation="border" size="sm" /> : 'Add Year'}
            </Button>
          </Form>
        </Col>
        
        <Col md={6}>
          <h4>Existing Years</h4>
          {loading ? (
            <Spinner animation="border" />
          ) : years.length === 0 ? (
            <Alert variant="info">No years added yet</Alert>
          ) : (
            <ListGroup>
              {years.map((yearItem) => (
                <ListGroup.Item key={yearItem._id}>
                  {yearItem.year} 
                  {yearItem.description && ` - ${yearItem.description}`}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default YearManager;
