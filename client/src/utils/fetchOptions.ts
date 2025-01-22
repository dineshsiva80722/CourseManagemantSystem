import axios from 'axios';

export const fetchCourses = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/courses');
    return response.data;
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};

export const fetchBatches = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/batches');
    return response.data;
  } catch (error) {
    console.error('Error fetching batches:', error);
    return [];
  }
};

export const fetchMonths = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/months');
    return response.data;
  } catch (error) {
    console.error('Error fetching months:', error);
    return [];
  }
};
