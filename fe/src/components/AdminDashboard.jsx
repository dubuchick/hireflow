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
        // group by user
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

    Object.keys(categoriesMap).forEach((key) => {
      categoriesMap[key].averageScore = parseFloat(
        (categoriesMap[key].totalScore / categoriesMap[key].count).toFixed(1)
      );
    });

    return categoriesMap;
  };

  const handleViewDetails = async (userId) => {
    setSelectedUserId(userId);
    setIsLoadingDetails(true);

    try {
      const personalityResponse = await getCandidateDetails({
        user_id: userId,
        assessment_type: "personality",
      });

      const cognitiveResponse = await getCandidateDetails({
        user_id: userId,
        assessment_type: "cognitive",
      });

      setCandidateDetails({
        personality: personalityResponse.data,
        cognitive: cognitiveResponse.data,
      });

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
                                <Badge>Score: {category.averageScore}</Badge>
                              </Flex>
                              <Text fontSize="sm" color="gray.600" mb={3}>
                                {category.description}
                              </Text>
                              <Progress
                                value={(category.averageScore / 4) * 100}
                                size="sm"
                                borderRadius="full"
                              />
                            </Box>
                          )
                        )}
                      </SimpleGrid>
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
                                  <Badge>Score: {result.Score}</Badge>
                                </Flex>
                                <Text fontSize="sm" color="gray.600" mb={3}>
                                  {result.CategoryDescription}
                                </Text>
                                <Progress
                                  value={(result.Score / 12) * 100}
                                  size="sm"
                                  borderRadius="full"
                                />
                              </Box>
                            )
                          )}
                        </SimpleGrid>
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
                                          <Badge>{result.Score}</Badge>
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
                                          <Badge>{result.Score}</Badge>
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
