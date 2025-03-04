import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Radio,
  RadioGroup,
  VStack,
  Button,
  Flex,
  Progress,
  useToast,
  Stack,
  Divider
} from "@chakra-ui/react";
import { MainLayout } from "./Dashboard"; // Assuming MainLayout is exported from Dashboard

// Mock API call - replace with your actual API
const fetchBehavioralQuestions = async () => {
  // Replace this with your actual API call
  return [
    {
      id: 1,
      question: "I remain calm and focused under pressure",
      type: "behavioral",
      options: {
        "1": {"text": "Strongly Disagree", "points": 1},
        "2": {"text": "Disagree", "points": 2},
        "3": {"text": "Neutral", "points": 3},
        "4": {"text": "Agree", "points": 4},
        "5": {"text": "Strongly Agree", "points": 5}
      }
    },
    {
      id: 2,
      question: "I prefer working in teams rather than individually",
      type: "behavioral",
      options: {
        "1": {"text": "Strongly Disagree", "points": 1},
        "2": {"text": "Disagree", "points": 2},
        "3": {"text": "Neutral", "points": 3},
        "4": {"text": "Agree", "points": 4},
        "5": {"text": "Strongly Agree", "points": 5}
      }
    },
    {
      id: 3,
      question: "I adapt quickly to changing circumstances",
      type: "behavioral",
      options: {
        "1": {"text": "Strongly Disagree", "points": 1},
        "2": {"text": "Disagree", "points": 2},
        "3": {"text": "Neutral", "points": 3},
        "4": {"text": "Agree", "points": 4},
        "5": {"text": "Strongly Agree", "points": 5}
      }
    }
    // Add more questions as needed
  ];
};

// Function to submit answers
const submitAnswers = async (answers) => {
  // Replace with your actual API call
  console.log("Submitting answers:", answers);
  return { success: true };
};

const BehavioralAssessment = ({ onLogout, user, onComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await fetchBehavioralQuestions();
        setQuestions(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading questions:", error);
        toast({
          title: "Error",
          description: "Failed to load assessment questions.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [toast]);

  const handleAnswer = (value) => {
    setAnswers({
      ...answers,
      [questions[currentQuestion].id]: value,
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    if (Object.keys(answers).length < questions.length) {
      toast({
        title: "Warning",
        description: "Please answer all questions before submitting.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAnswers(answers);
      toast({
        title: "Success",
        description: "Assessment completed successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Call the onComplete callback to update the dashboard
      if (onComplete) {
        onComplete("behavioral");
      }
    } catch (error) {
      console.error("Error submitting answers:", error);
      toast({
        title: "Error",
        description: "Failed to submit assessment.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout onLogout={onLogout} user={user}>
        <VStack spacing={8} align="stretch" justifyContent="center" h="60vh">
          <Text textAlign="center">Loading assessment questions...</Text>
          <Progress size="xs" isIndeterminate colorScheme="blue" />
        </VStack>
      </MainLayout>
    );
  }

  const currentQuestionData = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <MainLayout onLogout={onLogout} user={user}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg">Behavioral Assessment</Heading>
          <Text mt={2} color="gray.600">
            Please answer all questions honestly based on how you typically behave.
          </Text>
        </Box>

        <Box position="relative" mb={8}>
          <Progress
            value={progress}
            size="sm"
            colorScheme="blue"
            borderRadius="full"
          />
          <Text mt={2} textAlign="right" fontSize="sm" color="gray.600">
            Question {currentQuestion + 1} of {questions.length}
          </Text>
        </Box>

        <Box borderRadius="lg" boxShadow="md" bg="white" p={6}>
          <Text fontSize="xl" fontWeight="medium" mb={8}>
            {currentQuestionData.question}
          </Text>

          <RadioGroup
            onChange={handleAnswer}
            value={answers[currentQuestionData.id]}
            mb={8}
          >
            <Stack spacing={4} direction="column">
              {Object.entries(currentQuestionData.options).map(([key, option]) => (
                <Radio key={key} value={key} colorScheme="blue">
                  {option.text}
                </Radio>
              ))}
            </Stack>
          </RadioGroup>

          <Divider my={6} />

          <Flex justifyContent="space-between">
            <Button
              onClick={handlePrevious}
              isDisabled={currentQuestion === 0}
              variant="outline"
            >
              Previous
            </Button>
            
            {currentQuestion < questions.length - 1 ? (
              <Button
                onClick={handleNext}
                colorScheme="blue"
                isDisabled={!answers[currentQuestionData.id]}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                colorScheme="green"
                isLoading={isSubmitting}
                isDisabled={!answers[currentQuestionData.id]}
              >
                Submit Assessment
              </Button>
            )}
          </Flex>
        </Box>
      </VStack>
    </MainLayout>
  );
};

export default BehavioralAssessment;