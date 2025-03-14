import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  Flex,
  InputGroup,
  InputRightElement,
  useColorModeValue,
  FormErrorMessage,
  Link,
  useToast,
  HStack,
  Divider,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { login } from "../api/userService";

// Add JWT decoder function
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return {};
  }
};

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const toast = useToast();

  const bgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);

      try {
        // Call the login API
        const response = await login({ email, password });
      
        const token = response.data.token;

        localStorage.setItem("token", token);

        const decodedToken = decodeJWT(token);
       
        const roleId = parseInt(decodedToken.role_id || 2, 10);
       
        localStorage.setItem("role_id", roleId);

        toast({
          title: "Login successful",
          description: "Redirecting to dashboard...",
          status: "success",
          duration: 2000,
          isClosable: true,
        });

        const userData = {
          id: decodedToken.sub,
          email: decodedToken.email,
          role_id: roleId,
        };
        
        if (onLoginSuccess) {
          onLoginSuccess(userData);
        }
      } catch (error) {
        console.error("Login error:", error);
        toast({
          title: "Login failed",
          description: error.response?.data?.message || "Invalid credentials",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Flex
      width="100%"
      height="100vh"
      direction="column"
      align="center"
      justify="center"
      bg={useColorModeValue("gray.50", "gray.900")}
    >
      <Box
        width={["90%", "80%", "60%", "450px"]}
        p={8}
        borderRadius="lg"
        bg={bgColor}
        boxShadow="lg"
      >
        <VStack spacing={6} align="stretch">
          <VStack spacing={3} align="center">
            <Heading size="xl" color="blue.500">
              HireFlow
            </Heading>
            <Text fontSize="md" color={textColor}>
              Sign in to access your assessment portal
            </Text>
          </VStack>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isInvalid={errors.email}>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@company.com"
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={errors.password}>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              </FormControl>

              <Link alignSelf="flex-end" fontSize="sm" color="blue.500">
                Forgot password?
              </Link>

              <Button
                w="100%"
                colorScheme="blue"
                isLoading={isLoading}
                type="submit"
                mt={2}
              >
                Sign In
              </Button>
              
              <Divider my={2} />

              <Text textAlign="center" fontSize="sm">
                Don't have an account?
              </Text>

              <Button
                as={RouterLink}
                to="/register"
                w="100%"
                colorScheme="gray"
                variant="outline"
              >
                Create Account
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Flex>
  );
};

export default LoginPage;