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
  Divider,
} from "@chakra-ui/react";
import { MainLayout } from "./Dashboard"; // Assuming MainLayout is exported from Dashboard
import {
  getSelfAssessmentBehavioral,
  submitBehavioralAssessment,
  setupAuthHeadersFromStorage,
} from "../api/userService";
import { useNavigate } from "react-router-dom";
import base64 from "base-64"; // Import Base64 decoder

const BehavioralAssessment = ({ onLogout, user, onComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    setupAuthHeadersFromStorage();
    const fetchBehavioralQuestions = async () => {
      try {
        const response = await getSelfAssessmentBehavioral();
        const formattedQuestions = response.data.map((item) => ({
          id: item.ID,
          question: item.Question,
          type: item.Type,
          options: JSON.parse(base64.decode(item.Options)), // Decode Base64 options
        }));

        setQuestions(formattedQuestions);

        // Initialize answers state with empty values
        const initialAnswers = {};
        formattedQuestions.forEach((q) => {
          initialAnswers[q.id] = "";
        });
        setAnswers(initialAnswers);
      } catch (error) {
        console.error("Error fetching behavioral questions:", error);
        toast({
          title: "Error",
          description: "Failed to load assessment questions.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBehavioralQuestions();
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
      // Format answers for API
      const formattedAnswers = Object.entries(answers).map(
        ([questionId, value]) => ({
          question_id: parseInt(questionId),
          answer_value: value,
        })
      );

      // Make sure auth is set up before submitting
      setupAuthHeadersFromStorage();

      const response = await submitBehavioralAssessment(formattedAnswers);

      toast({
        title: "Success",
        description: "Assessment completed successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Call onComplete if provided (for any additional logic)
      if (onComplete) {
        onComplete("behavioral", response.data.session_id);
      }

      // Set a short delay before redirecting to provide user feedback
      setTimeout(() => {
        // Redirect to dashboard
        navigate("/dashboard");
      }, 1500); // 1.5 second delay to show the success message
    } catch (error) {
      console.error("Error submitting answers:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit assessment.",
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
            Please answer all questions honestly based on how you typically
            behave.
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
              {Object.entries(currentQuestionData.options).map(
                ([key, option]) => (
                  <Radio key={key} value={key} colorScheme="blue">
                    {option.text}
                  </Radio>
                )
              )}
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
