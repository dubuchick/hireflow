import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  Heading, 
  Text, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  TableContainer, 
  Badge,
  Flex,
  useToast
} from '@chakra-ui/react';
import { MainLayout } from './Dashboard'; // Assuming you've exported MainLayout from Dashboard
import { getCandidateScores } from '../api/adminService'; // You'll need to create this service

const AdminDashboard = ({ onLogout, user }) => {
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchCandidateScores = async () => {
      try {
        setIsLoading(true);
        const response = await getCandidateScores();
        
        if (response && response.candidates) {
          setCandidates(response.candidates);
        }
      } catch (error) {
        console.error("Error fetching candidate scores:", error);
        toast({
          title: "Error",
          description: "Could not fetch candidate scores",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidateScores();
  }, [toast]);

  const getAssessmentBadgeColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'green';
      case 'In Progress':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <MainLayout onLogout={onLogout} user={user}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">
          Admin Dashboard{user?.name ? `, ${user.name}` : ""}
        </Heading>
        <Text fontSize="lg">
          Review candidate assessment progress and scores
        </Text>

        <Box borderRadius="lg" boxShadow="md" bg="white" p={6}>
          <Heading size="md" mb={4}>
            Candidate Assessments
          </Heading>
          
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Candidate Name</Th>
                  <Th>Behavioral Assessment</Th>
                  <Th>Personality Assessment</Th>
                  <Th>Cognitive Assessment</Th>
                </Tr>
              </Thead>
              <Tbody>
                {isLoading ? (
                  <Tr>
                    <Td colSpan={4} textAlign="center">
                      Loading candidates...
                    </Td>
                  </Tr>
                ) : candidates.length === 0 ? (
                  <Tr>
                    <Td colSpan={4} textAlign="center">
                      No candidates found
                    </Td>
                  </Tr>
                ) : (
                  candidates.map((candidate) => (
                    <Tr key={candidate.id}>
                      <Td>{candidate.name}</Td>
                      {['behavioral', 'personality', 'cognitive'].map((type) => (
                        <Td key={type}>
                          <Flex align="center">
                            <Badge 
                              colorScheme={getAssessmentBadgeColor(candidate[`${type}_status`])}
                              mr={2}
                            >
                              {candidate[`${type}_status`] || 'Not Started'}
                            </Badge>
                            {candidate[`${type}_score`] && (
                              <Text>
                                Score: {candidate[`${type}_score`]}
                              </Text>
                            )}
                          </Flex>
                        </Td>
                      ))}
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </VStack>
    </MainLayout>
  );
};

export default AdminDashboard;