import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AddStudentForm from '../Components/AddStudentForm';

const AddStudentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  
  const batchId = searchParams.get('batchId') || '';
  const course = searchParams.get('course') || '';
  const year = searchParams.get('year') || '';
  const month = searchParams.get('month') || '';

  return (
    <AddStudentForm
      batchId={batchId}
      course={course}
      year={year}
      month={month}
    />
  );
};

export default AddStudentPage;
