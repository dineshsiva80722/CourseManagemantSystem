import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Button, Card, Form, ListGroup, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DEFAULT_BATCHES = ['Batch 1', 'Batch 2', 'Batch 3'];

const Mainpannel: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Get the course details passed via navigation state
    const course = location.state?.course;

    // State for managing years, months, and batches
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [yearBatches, setYearBatches] = useState<{[key: string]: {batches: string[]}}>(course?.years || {});
    const [error, setError] = useState<string | null>(null);
    const [addedYears, setAddedYears] = useState<string[]>([]);

    // Fetch years for the current course
    useEffect(() => {
        const fetchYears = async () => {
            try {
                if (!course?._id) return;

                const response = await axios.get(`http://localhost:5000/api/years`, {
                    params: { courseId: course._id }
                });

                const fetchedYears = response.data.years.map((y: any) => y.year);
                
                // Create default batches for all fetched years
                const defaultYears: {[key: string]: {batches: string[]}} = {};
                fetchedYears.forEach(year => {
                    defaultYears[year] = { 
                        batches: [...DEFAULT_BATCHES] 
                    };
                });
                
                setYearBatches(defaultYears);
                setAddedYears(fetchedYears.sort());
            } catch (error) {
                console.error('Error fetching years:', error);
                // Fallback to default years if fetch fails
                const currentYear = new Date().getFullYear().toString();
                setYearBatches({ [currentYear]: { batches: [...DEFAULT_BATCHES] } });
                setAddedYears([currentYear]);
            }
        };

        fetchYears();
    }, [course]);

    // Year input handler
    const handleYearInput = () => {
        // No longer needed
        return;
    };

    const handleDeleteYear = (year: string) => {
        if (yearBatches[year]) {
            const updatedYearBatches = { ...yearBatches };
            delete updatedYearBatches[year];
            setYearBatches(updatedYearBatches);

            const updatedAddedYears = addedYears.filter(y => y !== year);
            setAddedYears(updatedAddedYears);
        }
    };

    const handleYearButtonClick = (year: string) => {
        setSelectedYear(year);
    };

    // Navigate to Students Panel
    const navigateToStudentPanel = (year: string, batch: string, month: string) => {
        navigate('/students', { 
            state: { 
                course: course,  
                year: year, 
                batch: batch, 
                month: month 
            } 
        });
    };

    if (!course) {
        return (
            <Container className="py-4">
                <h1 className="text-center mb-4">No Course Selected</h1>
                <div className="text-center">
                    <Button variant="none" className="text-red-500" onClick={() => navigate('/')}>
                        Back to Courses
                    </Button>
                </div>
            </Container>
        );
    }

    const years = Object.keys(yearBatches);

    return (
        <Container className="py-4">
            <h1 className="text-center uppercase d-flex justify-content-between mb-4">
                <span className="lg:text-4xl md:text-3xl sm:text-2xl font-bold">{course.course}</span>
                <div>
                    <Button 
                        variant="none" 
                        onClick={() => navigate('/')}
                        className="ms-2 hover:bg-red-600 shadow-md hover:text-white"
                    >
                        Back to Courses
                    </Button>
                </div>
            </h1>

            {/* Error Alert */}
            {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                </Alert>
            )}

            {/* Added Years Buttons */}
            {addedYears.length > 0 && (
                <div className="d-flex flex-wrap justify-content-center mb-4">
                    {addedYears.map(year => (
                        <Button 
                            key={year} 
                            variant={selectedYear === year ? "primary" : "outline-primary"}
                            className="m-1"
                            onClick={() => handleYearButtonClick(year)}
                            style={{ width: '100px' }}
                        >
                            {year}
                        </Button>
                    ))}
                </div>
            )}
            {selectedYear && yearBatches && yearBatches[selectedYear] && yearBatches[selectedYear].batches && (
                <Card className="mb-4">    
                    <Card.Body>
                        <Card.Title>Batches for {selectedYear}</Card.Title>
                        <Row xs={1} md={3} className="g-4">
                            {MONTHS.map(month => (
                                <Col key={month}>
                                    <Card>
                                        <Card.Body>
                                            <Card.Title className="text-center">{month}</Card.Title>
                                            <ListGroup>
                                                {yearBatches[selectedYear].batches.map(batch => (
                                                    <ListGroup.Item 
                                                        key={batch} 
                                                        className="text-center d-flex justify-content-between"
                                                    >
                                                        {batch}
                                                        <Button 
                                                            variant="none"
                                                            className="ms-2 hover:shadow-xl  font-semibold"
                                                            onClick={() => navigateToStudentPanel(selectedYear, batch, month)}
                                                        >
                                                            view
                                                        </Button>
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
};

export default Mainpannel;