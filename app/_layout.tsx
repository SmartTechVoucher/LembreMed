  import { useEffect } from 'react';
  import { Stack } from 'expo-router';
  import { initDatabase } from './database/database';
  import { AuthProvider } from './context/AuthContext';
  import { initializeAlarmService } from './src/services/alarmService'; // ✅ NOVO

  export default function RootLayout() {
    useEffect(() => {
      // Inicializar banco de dados
      initDatabase();
      
      // ✅ Inicializar serviço de alarmes
      initializeAlarmService();
    }, []);

    return (
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="passos" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="cadastro" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    );
  }