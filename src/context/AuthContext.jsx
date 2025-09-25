// context/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import api from "../config/api"; // Assurez-vous que c'est le bon chemin

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("auth_token") || null);
  const [loading, setLoading] = useState(true);

  // Initialisation avec vérification du token
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem("auth_token");
      
      if (savedToken) {
        try {
          console.log("🔄 Vérification du token...");
          // Vérifier si le token est valide
          const response = await api.get("/auth/user");
          setUser(response.data.user);
          setToken(savedToken);
          console.log("✅ Utilisateur connecté:", response.data.user);
        } catch (error) {
          console.error("❌ Erreur lors de la vérification du token:", error);
          if (error.response?.status === 404) {
            console.error("❌ Route /auth/user non trouvée");
          }
          logout();
        }
      } else {
        console.log("🔐 Aucun token trouvé dans le localStorage");
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login
  const login = async (email, password) => {
    try {
      console.log("🔑 Tentative de connexion...");
      const response = await api.post('/auth/login', { 
        email, 
        password 
      });
      
      console.log("✅ Réponse login:", response.data);
      
      const { token: receivedToken, user: userData } = response.data;

      if (!receivedToken) {
        throw new Error("Token non reçu");
      }

      // Sauvegarder le token
      localStorage.setItem('auth_token', receivedToken);
      setToken(receivedToken);
      setUser(userData);

      return { success: true, message: 'Connexion réussie' };
    } catch (error) {
      console.error("❌ Erreur login:", error);
      const message = error.response?.data?.error || error.response?.data?.message || 'Erreur de connexion';
      return { success: false, message };
    }
  };

  // Register
  const register = async (fullName, email, password) => {
    try {
      console.log("📝 Tentative d'inscription...");
      const response = await api.post("/auth/register", {
        name: fullName,
        email,
        password,
        password_confirmation: password
      });

      console.log("✅ Réponse register:", response.data);

      const receivedToken = response.data.token;
      const userData = response.data.user;

      if (!receivedToken) {
        throw new Error("Token non reçu");
      }

      localStorage.setItem("auth_token", receivedToken);
      setToken(receivedToken);
      setUser(userData);

      return { success: true, message: "Inscription réussie" };
    } catch (error) {
      console.error("❌ Erreur register:", error);
      const message = error.response?.data?.error || error.response?.data?.message || "Erreur d'inscription";
      return { success: false, message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (token) {
        await api.post("/auth/logout");
      }
    } catch (error) {
      console.error("Erreur logout:", error);
    } finally {
      localStorage.removeItem("auth_token");
      setToken(null);
      setUser(null);
      console.log("🚪 Déconnexion effectuée");
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      register, 
      logout, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);