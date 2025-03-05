import React, { useState, useEffect } from "react";
import {
  ChakraProvider,
  extendTheme,
  CSSReset,
  Spinner,
  Flex,
} from "@chakra-ui/react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage"; 
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import BehavioralAssessment from "./components/BehavioralAssessment";
import PersonalityAssessment from "./components/PersonalityAssessment";
import CognitiveAssessment from "./components/CognitiveAssessment";

const theme = extendTheme({
  colors: {
    brand: {
      50: "#e6f2ff",
      100: "#b3d9ff",
      500: "#0066cc",
      600: "#0052a3", 
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

const ProtectedRoute = ({ user, children, requiredRole }) => {
  if (!user?.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role_id !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const roleId = localStorage.getItem("role_id");
      if (token && roleId) {
        setUser({
          isLoggedIn: true,
          role_id: parseInt(roleId),
        });
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  // Handle login
  const handleLoginSuccess = (userData) => {
    localStorage.setItem("role_id", userData.role_id);
    setUser({ ...userData, isLoggedIn: true });
  };

  // Handle registration
  const handleRegisterSuccess = () => {
    return <Navigate to="/login" replace />;
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role_id");
    setUser(null);
  };

  // Handle assessment completion
  const handleAssessmentComplete = (type) => {
    console.log(`${type} assessment completed`);
  };

  if (isLoading) {
    return (
      <Flex height="100vh" width="100%" align="center" justify="center">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  return (
    <ChakraProvider theme={theme}>
      <CSSReset />
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              user?.isLoggedIn ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginPage onLoginSuccess={handleLoginSuccess} />
              )
            }
          />
          <Route
            path="/register"
            element={
              user?.isLoggedIn ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <RegisterPage onRegisterSuccess={handleRegisterSuccess} />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                {user?.role_id === 1 ? (
                  <AdminDashboard user={user} onLogout={handleLogout} />
                ) : (
                  <Dashboard user={user} onLogout={handleLogout} />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/behavioral"
            element={
              <ProtectedRoute user={user}>
                <BehavioralAssessment
                  user={user}
                  onLogout={handleLogout}
                  onComplete={handleAssessmentComplete}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/personality"
            element={
              <ProtectedRoute user={user}>
                <PersonalityAssessment
                  user={user}
                  onLogout={handleLogout}
                  onComplete={handleAssessmentComplete}
                />
              </ProtectedRoute>
            }
          />
           <Route
            path="/assessment/cognitive"
            element={
              <ProtectedRoute user={user}>
                <CognitiveAssessment
                  user={user}
                  onLogout={handleLogout}
                  onComplete={handleAssessmentComplete}
                />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ChakraProvider>
  );
};

export default App;