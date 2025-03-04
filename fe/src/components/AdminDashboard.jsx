import React, { useState, useEffect } from "react";
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
  useToast,
} from "@chakra-ui/react";
import { MainLayout } from "./Dashboard";
import { getCandidateScores } from "../api/adminService";

const AdminDashboard = ({ onLogout, user }) => {
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchCandidateScores = async () => {
      try {
        setIsLoading(true);
        const response = await getCandidateScores();
        
        // Use the data array directly
        const candidateData = response.data || [];
        
        console.log('Processed Candidate Data:', candidateData);
  
        setCandidates(candidateData);
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

  const getAssessmentBadgeColor = (score) => {
    if (score !== null) {
      return score > 0 ? 'blue' : 'gray';
    }
    return 'gray';
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
                  <Th>User ID</Th>
                  <Th>Session ID</Th>
                  <Th>Assessment Status</Th>
                  <Th>Top Behavioral Trait</Th>
                  <Th>Behavioral Score</Th>
                </Tr>
              </Thead>
              <Tbody>
                {isLoading ? (
                  <Tr>
                    <Td colSpan={5} textAlign="center">
                      Loading candidates...
                    </Td>
                  </Tr>
                ) : candidates.length === 0 ? (
                  <Tr>
                    <Td colSpan={5} textAlign="center">
                      No candidates found
                    </Td>
                  </Tr>
                ) : (
                  candidates.map((candidate) => (
                    <Tr key={`${candidate.UserID}-${candidate.SessionID}`}>
                      <Td>{candidate.UserID}</Td>
                      <Td>{candidate.SessionID}</Td>
                      <Td>
                        <Badge 
                          colorScheme={getAssessmentBadgeColor(candidate.TopBehavioralScore)}
                        >
                          {candidate.AssessmentStatus}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge 
                          colorScheme="blue"
                          mr={2}
                        >
                          {candidate.TopBehavioralTrait}
                        </Badge>
                      </Td>
                      <Td>
                        <Flex align="center">
                          <Text>Score: {candidate.TopBehavioralScore}</Text>
                        </Flex>
                      </Td>
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