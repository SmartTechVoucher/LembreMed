import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// ✅ Importa o tipo User que agora é definido e exportado pelo database.ts
import { User } from '../database/database'; 

// 📦 Tipos do contexto
interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (userData: User) => Promise<void>;
  // ✅ CORREÇÃO: Mantendo 'signOut'
  signOut: () => Promise<void>; 
}

// Criação do contexto
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// 📍 Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  // 🔄 Carrega usuário salvo no AsyncStorage
  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('@LembreMed:user');
      if (storedUser) {
        // Garantindo que o JSON parseado seja do tipo User
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔐 Login (salva no AsyncStorage)
  const signIn = async (userData: User) => {
    try {
      await AsyncStorage.setItem('@LembreMed:user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  // 🚪 Logout
  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('@LembreMed:user');
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado
export const useAuth = (): AuthContextData => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
