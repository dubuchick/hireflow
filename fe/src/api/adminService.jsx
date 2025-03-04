import api from './api';

export const getCandidateScores = () => {
  return api.get("/self-assessment/candidate/scores");
};
