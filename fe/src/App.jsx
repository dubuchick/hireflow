import React, { useState, useEffect } from "react";
import {
  ChakraProvider,
  extendTheme,
  CSSReset,
  Spinner,
  Flex
} from "@chakra-ui/react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";

// Theme configuration
const theme = extendTheme({
  colors: {
    brand: {
      50: "#e6f2ff",
      100: "#b3d9ff",
      500: "#0066cc", // primary blue
      600: "#0052a3", // darker blue for hover states
    },
  },
  fonts: {
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  styles: {
    global: {
      "html, body": {
        margin: 0,
        padding: 0,
        width: "100%",
        height: "100%",
      },
      "#root": {
        width: "100%",
        height: "100%",
      },
    },
  },
});

const App = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const roleId = localStorage.getItem('role_id'); // Store role_id in localStorage during login
      
      console.log("Token in storage:", token);
      if (token && roleId) {
        setUser({ isLoggedIn: true, role_id: parseInt(roleId) }); // Ensure role_id is an integer
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Handle successful login
  const handleLoginSuccess = (userData) => {
    localStorage.setItem('role_id', userData.role_id); // Store role_id in localStorage
    setUser({ ...userData, isLoggedIn: true });
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role_id');
    setUser(null);
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Flex height="100vh" width="100%" align="center" justify="center">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  // Render the appropriate component based on role
  return (
    <ChakraProvider theme={theme}>
      <CSSReset />
      {user?.isLoggedIn ? (
        user.role_id === 1 ? ( // Assuming 1 is for Admin, 2 is for Candidate
          <AdminDashboard user={user} onLogout={handleLogout} />
        ) : (
          <Dashboard user={user} onLogout={handleLogout} />
        )
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </ChakraProvider>
  );
};

export default App;