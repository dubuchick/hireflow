import api from "./api";
export const getCandidateScores = async () => {
  try {
    const response = await api.get('/self-assessment/candidate/scores');
    return response;
  } catch (error) {
    console.error('Error fetching candidate scores:', error);
    throw error;
  }
};

export const getCandidateDetails = async (params) => {
  try {
    const response = await api.post('/self-assessment/candidate/details', params);
    return response;
  } catch (error) {
    console.error('Error fetching candidate details:', error);
    throw error;
  }
};