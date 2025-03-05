import { useState, useEffect } from "react";
import { MainLayout } from "./Dashboard";
import {
  getSelfAssessmentCognitive,
  submitCognitiveAssessment,
  setupAuthHeadersFromStorage,
} from "../api/userService";
import { useNavigate } from "react-router-dom";
import base64 from "base-64";
import {
  VStack,
  Box,
  Heading,
  Text,
  Progress,
  RadioGroup,
  Radio,
  Stack,
  Button,
  Flex,
  Divider,
  useToast,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Circle,
} from "@chakra-ui/react";

const CognitiveAssessment = ({ onLogout, user, onComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds
  const toast = useToast();
  const navigate = useNavigate();

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  useEffect(() => {
    setupAuthHeadersFromStorage();
    const fetchCognitiveQuestions = async () => {
      try {
        setIsLoading(true);
        const response = await getSelfAssessmentCognitive();
        const formattedQuestions = response.data.map((item) => ({
          id: item.ID,
          question: item.Question,
          type: item.Type,
          options: JSON.parse(base64.decode(item.Options)), // Decode Base64 options
        }));

        setQuestions(formattedQuestions);

        const initialAnswers = {};
        formattedQuestions.forEach((q) => {
          initialAnswers[q.id] = "";
        });
        setAnswers(initialAnswers);
      } catch (error) {
        console.error("Error fetching cognitive questions:", error);
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

    fetchCognitiveQuestions();
  }, [toast]);

  // Timer countdown effect
  useEffect(() => {
    if (isLoading || isSubmitting) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading, isSubmitting]);

  // Handle when time runs out
  const handleTimeUp = () => {
    toast({
      title: "Time's up!",
      description: "Your answers will be submitted automatically.",
      status: "warning",
      duration: 3000,
      isClosable: true,
    });
    handleSubmit();
  };

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
    setIsSubmitting(true);

    try {
      const formattedAnswers = Object.entries(answers)
        .filter(([_, value]) => value !== "") 
        .map(([questionId, value]) => ({
          question_id: parseInt(questionId),
          answer_value: value,
        }));

      setupAuthHeadersFromStorage();

      const response = await submitCognitiveAssessment(formattedAnswers);

      toast({
        title: "Success",
        description: "Cognitive assessment completed successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      if (onComplete) {
        onComplete("cognitive", response.data.session_id);
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

  // Loading state
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
  const answeredCount = Object.values(answers).filter(a => a !== "").length;

  return (
    <MainLayout onLogout={onLogout} user={user}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg">Cognitive Assessment</Heading>
          <Flex justifyContent="space-between" alignItems="center" mt={2}>
            <Text color="gray.600">
              Test your problem-solving and analytical skills.
            </Text>
            <HStack spacing={4}>
              <Stat textAlign="center" size="sm">
                <StatLabel>Answered</StatLabel>
                <StatNumber>{answeredCount}/{questions.length}</StatNumber>
              </Stat>
              <Stat textAlign="center" size="sm">
                <StatLabel>Time Remaining</StatLabel>
                <StatNumber color={timeLeft < 120 ? "red.500" : timeLeft < 300 ? "orange.500" : "gray.600"}>
                  {formatTime(timeLeft)}
                </StatNumber>
              </Stat>
            </HStack>
          </Flex>
        </Box>

        <Box position="relative" mb={4}>
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
          <HStack mb={6}>
            <Circle size="30px" bg="blue.500" color="white" fontWeight="bold">
              {currentQuestion + 1}
            </Circle>
            <Text fontSize="xl" fontWeight="medium">
              {currentQuestionData.question}
            </Text>
          </HStack>

          <RadioGroup
            onChange={handleAnswer}
            value={answers[currentQuestionData.id]}
            mb={8}
          >
            <Stack spacing={4} direction="column">
              {Object.entries(currentQuestionData.options).map(
                ([key, option]) => (
                  <Radio key={key} value={key} colorScheme="blue">
                    {option}
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
              leftIcon={<span>←</span>}
            >
              Previous
            </Button>

            {currentQuestion < questions.length - 1 ? (
              <Button
                onClick={handleNext}
                colorScheme="blue"
                isDisabled={!answers[currentQuestionData.id]}
                rightIcon={<span>→</span>}
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

        {/* Question Navigation */}
        <Box borderRadius="lg" boxShadow="sm" bg="white" p={4}>
          <Text fontSize="sm" fontWeight="medium" mb={3}>
            Question Navigator
          </Text>
          <Flex flexWrap="wrap" gap={2}>
            {questions.map((_, index) => (
              <Circle
                key={index}
                size="32px"
                bg={answers[questions[index].id] ? "green.500" : "gray.200"}
                color={answers[questions[index].id] ? "white" : "gray.500"}
                cursor="pointer"
                fontWeight="bold"
                onClick={() => setCurrentQuestion(index)}
                borderWidth={currentQuestion === index ? "2px" : "0px"}
                borderColor="blue.500"
              >
                {index + 1}
              </Circle>
            ))}
          </Flex>
        </Box>
      </VStack>
    </MainLayout>
  );
};

export default CognitiveAssessment;