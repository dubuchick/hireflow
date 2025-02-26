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
  Progress,
  Badge,
} from "@chakra-ui/react";

// Placeholder icons (you can replace with actual icons from a library like react-icons)
const MenuIcon = () => <span>☰</span>;
const BellIcon = () => <span>🔔</span>;
const UserIcon = () => <span>👤</span>;

const Header = ({ onLogout, user }) => {
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
          <Heading size="md" color="blue.500">HireFlow</Heading>
          <HStack as="nav" spacing={4} display={{ base: "none", md: "flex" }}>
            <Button variant="ghost">Dashboard</Button>
            <Button variant="ghost">Assessments</Button>
            <Button variant="ghost">Progress</Button>
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

const MainLayout = ({ children, onLogout, user }) => {
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
  const [tests] = useState([
    { type: "Behavioral", status: "Completed", progress: 100 },
    { type: "Personality", status: "In Progress", progress: 65 },
    { type: "Cognitive", status: "Not Started", progress: 0 },
  ]);

  return (
    <MainLayout onLogout={onLogout} user={user}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">
          Welcome to HireFlow{user?.name ? `, ${user.name}` : ''}
        </Heading>
        <Text>Track your assessment progress below</Text>
        
        <Box borderRadius="lg" boxShadow="md" bg="white" p={6}>
          <Heading size="md" mb={4}>Your Assessments</Heading>
          <VStack spacing={4} align="stretch">
            {tests.map((test, index) => (
              <Box key={index} p={4} borderWidth="1px" borderRadius="md">
                <Flex justify="space-between" align="center" mb={2}>
                  <Heading size="sm">{test.type} Assessment</Heading>
                  <Badge
                    colorScheme={
                      test.status === "Completed"
                        ? "green"
                        : test.status === "In Progress"
                        ? "blue"
                        : "gray"
                    }
                  >
                    {test.status}
                  </Badge>
                </Flex>
                <Progress
                  value={test.progress}
                  size="sm"
                  colorScheme="blue"
                  borderRadius="full"
                  mb={2}
                />
                <Flex justify="space-between">
                  <Text fontSize="sm">{test.progress}% completed</Text>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    variant={test.status === "Completed" ? "outline" : "solid"}
                  >
                    {test.status === "Completed"
                      ? "View Results"
                      : "Continue"}
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