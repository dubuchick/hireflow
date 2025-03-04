import { useState, useEffect } from "react";
import { MainLayout } from "./Dashboard";
import { getCandidateScores, getCandidateDetails } from "../api/adminService";
import {
  VStack,
  Box,
  Heading,
  Text,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  useToast,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  SimpleGrid,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Center,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from "@chakra-ui/react";

const AdminDashboard = ({ onLogout, user }) => {
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [candidateDetails, setCandidateDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [consolidatedScores, setConsolidatedScores] = useState({});
  const toast = useToast();

  useEffect(() => {
    const fetchCandidateScores = async () => {
      try {
        setIsLoading(true);
        const response = await getCandidateScores();
        // Process candidates data - group by user
        const candidateData = response.data || [];

        // Group by UserID and SessionID to create unique candidate entries
        const uniqueCandidates = [];
        const processed = new Set();

        candidateData.forEach((entry) => {
          const key = `${entry.UserID}-${entry.SessionID}`;
          if (!processed.has(key)) {
            uniqueCandidates.push(entry);
            processed.add(key);
          }
        });

        setCandidates(uniqueCandidates);
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

  // Process results to consolidate duplicate categories
  const processResults = (results) => {
    const categoriesMap = {};

    results.forEach((result) => {
      const categoryName = result.CategoryName;

      if (!categoriesMap[categoryName]) {
        categoriesMap[categoryName] = {
          name: categoryName,
          description: result.CategoryDescription,
          scores: [result.Score],
          totalScore: result.Score,
          count: 1,
        };
      } else {
        categoriesMap[categoryName].scores.push(result.Score);
        categoriesMap[categoryName].totalScore += result.Score;
        categoriesMap[categoryName].count += 1;
      }
    });

    // Calculate average scores for each category
    Object.keys(categoriesMap).forEach((key) => {
      categoriesMap[key].averageScore = parseFloat(
        (categoriesMap[key].totalScore / categoriesMap[key].count).toFixed(1)
      );
    });

    return categoriesMap;
  };

  // Determine personality type based on highest scoring categories
  const determinePersonalityType = (consolidatedScores) => {
    // Sort categories by average score
    const sortedCategories = Object.values(consolidatedScores).sort(
      (a, b) => b.averageScore - a.averageScore
    );

    // Get top 3 categories
    const topCategories = sortedCategories.slice(0, 3);

    // Define personality types based on top categories
    if (
      topCategories.some((c) => c.name === "Leadership") &&
      topCategories.some((c) => c.name === "Risk Tolerance")
    ) {
      return {
        type: "Strategic Leader",
        description:
          "Takes initiative, makes tough decisions, and is willing to take calculated risks to achieve objectives.",
      };
    } else if (
      topCategories.some((c) => c.name === "Adaptability") &&
      topCategories.some((c) => c.name === "Learning Approach")
    ) {
      return {
        type: "Adaptive Learner",
        description:
          "Quickly adapts to new situations and continuously seeks to improve skills and knowledge.",
      };
    } else if (
      topCategories.some((c) => c.name === "Communication") &&
      topCategories.some((c) => c.name === "Teamwork")
    ) {
      return {
        type: "Collaborative Communicator",
        description:
          "Excels at interpersonal relationships and working with others to achieve common goals.",
      };
    } else if (
      topCategories.some((c) => c.name === "Problem-solving") &&
      topCategories.some((c) => c.name === "Goal-orientation")
    ) {
      return {
        type: "Analytical Achiever",
        description:
          "Methodical in solving problems and highly focused on reaching objectives.",
      };
    } else if (
      topCategories.some((c) => c.name === "Stress Management") &&
      topCategories.some((c) => c.name === "Time Management")
    ) {
      return {
        type: "Resilient Organizer",
        description:
          "Handles pressure effectively while maintaining productivity and organization.",
      };
    } else {
      // Fallback if no specific combinations match
      return {
        type: "Balanced Professional",
        description: `Shows strong abilities in ${topCategories
          .map((c) => c.name)
          .join(", ")}.`,
      };
    }
  };

  const handleViewDetails = async (userId) => {
    setSelectedUserId(userId);
    setIsLoadingDetails(true);

    try {
      // Fetch personality assessment results
      const personalityResponse = await getCandidateDetails({
        user_id: userId,
        assessment_type: "personality",
      });

      // Fetch cognitive assessment results
      const cognitiveResponse = await getCandidateDetails({
        user_id: userId,
        assessment_type: "cognitive",
      });

      // Set combined data
      setCandidateDetails({
        personality: personalityResponse.data,
        cognitive: cognitiveResponse.data,
      });

      // Process personality data if available
      if (
        personalityResponse.data &&
        personalityResponse.data.results &&
        personalityResponse.data.results.length > 0
      ) {
        const processed = processResults(personalityResponse.data.results);
        setConsolidatedScores(processed);
      } else {
        setConsolidatedScores({});
      }

      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching candidate details:", error);
      toast({
        title: "Error",
        description: "Could not fetch candidate assessment details",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      // Open modal anyway to show the "not taken" message
      setIsModalOpen(true);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const getAssessmentBadgeColor = (score) => {
    if (score !== null) {
      return score > 0 ? "blue" : "gray";
    }
    return "gray";
  };

  const getScoreColor = (score) => {
    if (score >= 3.5) return "green";
    if (score >= 2.5) return "blue";
    if (score >= 1.5) return "orange";
    return "red";
  };

  const getCognitiveScoreColor = (score) => {
    if (score >= 8) return "green";
    if (score >= 4) return "blue";
    if (score >= 1) return "orange";
    return "red";
  };

  // Interpret cognitive scores
  const interpretCognitiveScore = (score) => {
    if (score >= 8) return "Excellent";
    if (score >= 4) return "Good";
    if (score >= 1) return "Average";
    return "Needs Development";
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
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {isLoading ? (
                  <Tr>
                    <Td colSpan={7} textAlign="center">
                      Loading candidates...
                    </Td>
                  </Tr>
                ) : candidates.length === 0 ? (
                  <Tr>
                    <Td colSpan={7} textAlign="center">
                      No candidates found
                    </Td>
                  </Tr>
                ) : (
                  candidates.map((candidate) => (
                    <Tr
                      key={`candidate-${candidate.UserID}-${candidate.SessionID}`}
                    >
                      <Td>{candidate.UserID}</Td>
                      <Td>{candidate.SessionID}</Td>
                      <Td>
                        <Badge
                          colorScheme={getAssessmentBadgeColor(
                            candidate.TopBehavioralScore
                          )}
                        >
                          {candidate.AssessmentStatus}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme="blue" mr={2}>
                          {candidate.TopBehavioralTrait}
                        </Badge>
                      </Td>
                      <Td>
                        <Flex align="center">
                          <Text>Score: {candidate.TopBehavioralScore}</Text>
                        </Flex>
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          colorScheme="teal"
                          onClick={() => handleViewDetails(candidate.UserID)}
                          isLoading={
                            isLoadingDetails &&
                            selectedUserId === candidate.UserID
                          }
                        >
                          View Details
                        </Button>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </VStack>

      {/* Candidate Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Candidate Assessment Details
            <Text fontSize="sm" color="gray.600" mt={1}>
              User ID: {selectedUserId}
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {!candidateDetails ||
            ((!candidateDetails.personality?.results ||
              candidateDetails.personality.results.length === 0) &&
              (!candidateDetails.cognitive?.results ||
                candidateDetails.cognitive.results.length === 0)) ? (
              <Box p={6} textAlign="center">
                <Heading size="md" color="gray.500" mb={4}>
                  No Assessment Data
                </Heading>
                <Text fontSize="lg">
                  This user hasn't completed cognitive/ personality assessment
                  yet.
                </Text>
              </Box>
            ) : (
              <Tabs colorScheme="teal" mt={2}>
                <TabList>
                  <Tab>Personality Profile</Tab>
                  <Tab>Personality Type</Tab>
                  <Tab>Cognitive Profile</Tab>
                  <Tab>Detailed Scores</Tab>
                </TabList>

                <TabPanels>
                  {/* Personality Profile Tab */}
                  <TabPanel>
                    {!candidateDetails.personality?.results ||
                    candidateDetails.personality.results.length === 0 ? (
                      <Box p={6} textAlign="center">
                        <Heading size="md" color="gray.500" mb={4}>
                          No Personality Assessment Data
                        </Heading>
                        <Text fontSize="lg">
                          This user hasn't completed a personality test yet.
                        </Text>
                      </Box>
                    ) : (
                      <SimpleGrid columns={1} spacing={4}>
                        {Object.values(consolidatedScores).map(
                          (category, index) => (
                            <Box
                              key={`profile-${index}`}
                              p={4}
                              borderWidth="1px"
                              borderRadius="md"
                              shadow="sm"
                            >
                              <Flex
                                justifyContent="space-between"
                                alignItems="center"
                                mb={2}
                              >
                                <Heading size="sm">{category.name}</Heading>
                                <Badge
                                  colorScheme={getScoreColor(
                                    category.averageScore
                                  )}
                                >
                                  Score: {category.averageScore}
                                </Badge>
                              </Flex>
                              <Text fontSize="sm" color="gray.600" mb={3}>
                                {category.description}
                              </Text>
                              <Progress
                                value={(category.averageScore / 4) * 100}
                                colorScheme={getScoreColor(
                                  category.averageScore
                                )}
                                size="sm"
                                borderRadius="full"
                              />
                            </Box>
                          )
                        )}
                      </SimpleGrid>
                    )}
                  </TabPanel>

                  {/* Personality Type Tab */}
                  <TabPanel>
                    {!candidateDetails.personality?.results ||
                    candidateDetails.personality.results.length === 0 ? (
                      <Box p={6} textAlign="center">
                        <Heading size="md" color="gray.500" mb={4}>
                          No Personality Assessment Data
                        </Heading>
                        <Text fontSize="lg">
                          This user hasn't completed a personality test yet.
                        </Text>
                      </Box>
                    ) : (
                      Object.keys(consolidatedScores).length > 0 && (
                        <Box
                          p={6}
                          borderWidth="1px"
                          borderRadius="lg"
                          boxShadow="md"
                          bg="white"
                        >
                          <Center mb={6}>
                            <VStack>
                              <Heading size="md" color="teal.600">
                                {
                                  determinePersonalityType(consolidatedScores)
                                    .type
                                }
                              </Heading>
                              <Text
                                textAlign="center"
                                fontSize="md"
                                color="gray.600"
                              >
                                {
                                  determinePersonalityType(consolidatedScores)
                                    .description
                                }
                              </Text>
                            </VStack>
                          </Center>

                          <Divider mb={6} />

                          <Heading size="sm" mb={4}>
                            Top Strengths
                          </Heading>
                          <SimpleGrid columns={[1, 2, 3]} spacing={4} mb={6}>
                            {Object.values(consolidatedScores)
                              .sort((a, b) => b.averageScore - a.averageScore)
                              .slice(0, 3)
                              .map((strength, index) => (
                                <Stat
                                  key={`strength-${index}`}
                                  borderWidth="1px"
                                  borderRadius="md"
                                  p={3}
                                >
                                  <StatLabel>{strength.name}</StatLabel>
                                  <StatNumber>
                                    {strength.averageScore}
                                  </StatNumber>
                                  <StatHelpText
                                    color={getScoreColor(strength.averageScore)}
                                  >
                                    {strength.averageScore >= 3.5
                                      ? "Excellent"
                                      : strength.averageScore >= 2.5
                                      ? "Good"
                                      : strength.averageScore >= 1.5
                                      ? "Average"
                                      : "Needs Development"}
                                  </StatHelpText>
                                </Stat>
                              ))}
                          </SimpleGrid>

                          <Heading size="sm" mb={4}>
                            Areas for Development
                          </Heading>
                          <SimpleGrid columns={[1, 2, 3]} spacing={4}>
                            {Object.values(consolidatedScores)
                              .sort((a, b) => a.averageScore - b.averageScore)
                              .slice(0, 3)
                              .map((area, index) => (
                                <Stat
                                  key={`area-${index}`}
                                  borderWidth="1px"
                                  borderRadius="md"
                                  p={3}
                                >
                                  <StatLabel>{area.name}</StatLabel>
                                  <StatNumber>{area.averageScore}</StatNumber>
                                  <StatHelpText
                                    color={getScoreColor(area.averageScore)}
                                  >
                                    {area.averageScore >= 3.5
                                      ? "Excellent"
                                      : area.averageScore >= 2.5
                                      ? "Good"
                                      : area.averageScore >= 1.5
                                      ? "Average"
                                      : "Needs Development"}
                                  </StatHelpText>
                                </Stat>
                              ))}
                          </SimpleGrid>
                        </Box>
                      )
                    )}
                  </TabPanel>

                  {/* Cognitive Profile Tab */}
                  <TabPanel>
                    {!candidateDetails.cognitive?.results ||
                    candidateDetails.cognitive.results.length === 0 ? (
                      <Box p={6} textAlign="center">
                        <Heading size="md" color="gray.500" mb={4}>
                          No Cognitive Assessment Data
                        </Heading>
                        <Text fontSize="lg">
                          This user hasn't completed a cognitive assessment yet.
                        </Text>
                      </Box>
                    ) : (
                      <Box>
                        <Heading size="md" mb={4}>
                          Cognitive Abilities
                        </Heading>
                        <SimpleGrid columns={1} spacing={4}>
                          {candidateDetails.cognitive.results.map(
                            (result, index) => (
                              <Box
                                key={`cognitive-${index}`}
                                p={4}
                                borderWidth="1px"
                                borderRadius="md"
                                shadow="sm"
                              >
                                <Flex
                                  justifyContent="space-between"
                                  alignItems="center"
                                  mb={2}
                                >
                                  <Heading size="sm">
                                    {result.CategoryName}
                                  </Heading>
                                  <Badge
                                    colorScheme={getCognitiveScoreColor(
                                      result.Score
                                    )}
                                  >
                                    Score: {result.Score}
                                  </Badge>
                                </Flex>
                                <Text fontSize="sm" color="gray.600" mb={3}>
                                  {result.CategoryDescription}
                                </Text>
                                <Progress
                                  value={(result.Score / 12) * 100}
                                  colorScheme={getCognitiveScoreColor(
                                    result.Score
                                  )}
                                  size="sm"
                                  borderRadius="full"
                                />
                                <Text mt={2} fontSize="sm" textAlign="right">
                                  {interpretCognitiveScore(result.Score)}
                                </Text>
                              </Box>
                            )
                          )}
                        </SimpleGrid>

                        <Box
                          mt={6}
                          p={4}
                          borderWidth="1px"
                          borderRadius="md"
                          bg="gray.50"
                        >
                          <Heading size="sm" mb={3}>
                            Cognitive Assessment Interpretation
                          </Heading>
                          <Text fontSize="sm">
                            Scores are based on correct answers to questions in
                            each category:
                          </Text>
                          <SimpleGrid columns={[1, 2, 4]} spacing={4} mt={3}>
                            <Box p={2} bg="green.100" borderRadius="md">
                              <Text fontWeight="bold">8-12: Excellent</Text>
                              <Text fontSize="xs">Strong proficiency</Text>
                            </Box>
                            <Box p={2} bg="blue.100" borderRadius="md">
                              <Text fontWeight="bold">4-7: Good</Text>
                              <Text fontSize="xs">Competent performance</Text>
                            </Box>
                            <Box p={2} bg="orange.100" borderRadius="md">
                              <Text fontWeight="bold">1-3: Average</Text>
                              <Text fontSize="xs">Basic understanding</Text>
                            </Box>
                            <Box p={2} bg="red.100" borderRadius="md">
                              <Text fontWeight="bold">
                                0: Needs Development
                              </Text>
                              <Text fontSize="xs">Area for improvement</Text>
                            </Box>
                          </SimpleGrid>
                        </Box>
                      </Box>
                    )}
                  </TabPanel>

                  {/* Detailed Scores Tab */}
                  <TabPanel>
                    <Tabs variant="soft-rounded" colorScheme="blue">
                      <TabList mb={4}>
                        <Tab>Personality</Tab>
                        <Tab>Cognitive</Tab>
                      </TabList>
                      <TabPanels>
                        <TabPanel p={0}>
                          {!candidateDetails.personality?.results ||
                          candidateDetails.personality.results.length === 0 ? (
                            <Box
                              p={6}
                              textAlign="center"
                              bg="gray.50"
                              borderRadius="md"
                            >
                              <Text>
                                No personality assessment data available
                              </Text>
                            </Box>
                          ) : (
                            <TableContainer>
                              <Table variant="simple" size="sm">
                                <Thead>
                                  <Tr>
                                    <Th>Category</Th>
                                    <Th>Score</Th>
                                    <Th>Description</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {candidateDetails.personality.results.map(
                                    (result, index) => (
                                      <Tr key={`personality-table-${index}`}>
                                        <Td>{result.CategoryName}</Td>
                                        <Td>
                                          <Badge
                                            colorScheme={getScoreColor(
                                              result.Score
                                            )}
                                          >
                                            {result.Score}
                                          </Badge>
                                        </Td>
                                        <Td>{result.CategoryDescription}</Td>
                                      </Tr>
                                    )
                                  )}
                                </Tbody>
                              </Table>
                            </TableContainer>
                          )}
                        </TabPanel>
                        <TabPanel p={0}>
                          {!candidateDetails.cognitive?.results ||
                          candidateDetails.cognitive.results.length === 0 ? (
                            <Box
                              p={6}
                              textAlign="center"
                              bg="gray.50"
                              borderRadius="md"
                            >
                              <Text>
                                No cognitive assessment data available
                              </Text>
                            </Box>
                          ) : (
                            <TableContainer>
                              <Table variant="simple" size="sm">
                                <Thead>
                                  <Tr>
                                    <Th>Category</Th>
                                    <Th>Score</Th>
                                    <Th>Description</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {candidateDetails.cognitive.results.map(
                                    (result, index) => (
                                      <Tr key={`cognitive-table-${index}`}>
                                        <Td>{result.CategoryName}</Td>
                                        <Td>
                                          <Badge
                                            colorScheme={getCognitiveScoreColor(
                                              result.Score
                                            )}
                                          >
                                            {result.Score}
                                          </Badge>
                                        </Td>
                                        <Td>{result.CategoryDescription}</Td>
                                      </Tr>
                                    )
                                  )}
                                </Tbody>
                              </Table>
                            </TableContainer>
                          )}
                        </TabPanel>
                      </TabPanels>
                    </Tabs>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </MainLayout>
  );
};

export default AdminDashboard;
