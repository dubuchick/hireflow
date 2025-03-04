import React, { useState } from "react";
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  useColorModeValue,
  Heading,
  Text,
  Avatar,
  Container,
  VStack,
  Badge,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom"; // Make sure to install react-router if you haven't

// Placeholder icons (you can replace with actual icons from a library like react-icons)
const MenuIcon = () => <span>☰</span>;
const BellIcon = () => <span>🔔</span>;
const UserIcon = () => <span>👤</span>;

export const Header = ({ onLogout, user }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      as="header"
      bg={bgColor}
      px={4}
      boxShadow="sm"
      position="fixed"
      width="full"
      borderBottom="1px"
      borderBottomColor={borderColor}
      zIndex="1"
    >
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <IconButton
          size="md"
          icon={<MenuIcon />}
          aria-label="Open Menu"
          display={{ md: "none" }}
          onClick={isOpen ? onClose : onOpen}
        />

        <HStack spacing={8} alignItems="center">
          <Heading size="md" color="blue.500">
            HireFlow
          </Heading>
          <HStack as="nav" spacing={4} display={{ base: "none", md: "flex" }}>
            <Button variant="ghost">Dashboard</Button>
            <Button variant="ghost">Assessments</Button>
            <Button variant="ghost">Results</Button>
          </HStack>
        </HStack>

        <Flex alignItems="center">
          <IconButton
            size="md"
            icon={<BellIcon />}
            aria-label="Notifications"
            variant="ghost"
            mr={3}
          />
          <Menu>
            <MenuButton
              as={Button}
              rounded="full"
              variant="link"
              cursor="pointer"
              minW={0}
            >
              <Avatar
                size="sm"
                src={user?.profileImage}
                name={user?.name || "User"}
                icon={<UserIcon />}
              />
            </MenuButton>
            <MenuList>
              <MenuItem>Profile</MenuItem>
              <MenuItem>Settings</MenuItem>
              <MenuItem>Help</MenuItem>
              <MenuItem onClick={onLogout}>Sign out</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
    </Box>
  );
};

export const MainLayout = ({ children, onLogout, user }) => {
  return (
    <Box minH="100vh" bg={useColorModeValue("gray.50", "gray.900")}>
      <Header onLogout={onLogout} user={user} />
      <Box as="main" pt="16" px={4}>
        <Container maxW="container.xl" py={6}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

const Dashboard = ({ onLogout, user }) => {
  const [assessments, setAssessments] = useState([
    {
      id: 1,
      type: "Behavioral",
      status: "Not Started",
      description: "Assess your workplace behaviors and tendencies",
    },
    {
      id: 2,
      type: "Personality",
      status: "Not Started",
      description: "Understand your personality traits and preferences",
    },
    {
      id: 3,
      type: "Cognitive",
      status: "Not Started",
      description: "Evaluate your problem-solving and reasoning abilities",
    },
  ]);

  const toast = useToast();
  const navigate = useNavigate(); // If using react-router

  const handleStartAssessment = (assessmentType) => {
    // Option 1: If using react-router, navigate to the assessment page
    // navigate(`/assessment/${assessmentType.toLowerCase()}`);

    // Option 2: If not using react-router, you can use a state-based approach
    toast({
      title: "Starting Assessment",
      description: `You are about to start the ${assessmentType} assessment. Once started, you must complete it.`,
      status: "info",
      duration: 5000,
      isClosable: true,
    });

    // Here you would typically navigate or change your app state to show the assessment
    // For demonstration, let's just log it
    navigate(`/assessment/${assessmentType.toLowerCase()}`);
    console.log(`Starting ${assessmentType} assessment`);
  };

  const updateAssessmentStatus = (type, newStatus) => {
    setAssessments(
      assessments.map((assessment) =>
        assessment.type.toLowerCase() === type.toLowerCase()
          ? { ...assessment, status: newStatus }
          : assessment
      )
    );
  };

  return (
    <MainLayout onLogout={onLogout} user={user}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">
          Welcome to HireFlow{user?.name ? `, ${user.name}` : ""}
        </Heading>
        <Text fontSize="lg">
          Below are the assessments you need to complete. Each assessment must
          be completed in a single session once started.
        </Text>

        <Box borderRadius="lg" boxShadow="md" bg="white" p={6}>
          <Heading size="md" mb={4}>
            Your Assessments
          </Heading>
          <VStack spacing={4} align="stretch">
            {assessments.map((assessment) => (
              <Box
                key={assessment.id}
                p={6}
                borderWidth="1px"
                borderRadius="md"
                position="relative"
              >
                <Flex justify="space-between" align="center" mb={3}>
                  <Box>
                    <Heading size="md">{assessment.type} Assessment</Heading>
                    <Text color="gray.600" mt={1}>
                      {assessment.description}
                    </Text>
                  </Box>
                  <Badge
                    colorScheme={
                      assessment.status === "Completed"
                        ? "green"
                        : assessment.status === "In Progress"
                        ? "blue"
                        : "gray"
                    }
                    p={2}
                    borderRadius="md"
                  >
                    {assessment.status}
                  </Badge>
                </Flex>

                <Flex mt={4}>
                  <Box flex="1"></Box> {/* Spacer */}
                  <Button
                    colorScheme={
                      assessment.status === "Completed" ? "green" : "blue"
                    }
                    onClick={() => handleStartAssessment(assessment.type)}
                    isDisabled={assessment.status === "Completed"}
                  >
                    {assessment.status === "Completed"
                      ? "View Results"
                      : assessment.status === "In Progress"
                      ? "Continue"
                      : "Start Assessment"}
                  </Button>
                </Flex>
              </Box>
            ))}
          </VStack>
        </Box>
      </VStack>
    </MainLayout>
  );
};

export default Dashboard;
