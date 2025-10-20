import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { initDatabase } from './database/database';
import { initializeAlarmService } from './src/services/alarmService';

function AppContent() {
  const { user } = useAuth();

  useEffect(() => {
    async function initialize() {
      try {
        console.log('🚀 Inicializando aplicação...');
        
        await initDatabase();
        console.log('✅ Banco de dados inicializado');
        
        await initializeAlarmService();
        console.log('✅ Serviço de alarmes inicializado');
        
        if (user) {
          await reScheduleAllAlarms(user.id);
        }
      } catch (error) {
        console.error('❌ Erro na inicialização:', error);
      }
    }

    initialize();
  }, []);

  useEffect(() => {
    if (user) {
      console.log('👤 Usuário logado, verificando alarmes...');
      reScheduleAllAlarms(user.id);
    }
  }, [user]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="passos" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="cadastro" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

/**
 * 🔄 Re-agenda todos os alarmes ativos do usuário
 * (Útil após reboot do dispositivo ou login)
 */
async function reScheduleAllAlarms(userId: number) {
  try {
    console.log('🔄 Re-agendando alarmes para o usuário:', userId);
    
    // Importação dinâmica para evitar dependência circular
    const { getAllMedicationsByUser } = await import('./database/database');
    const { scheduleMedicationAlarm, listScheduledAlarms } = await import('./src/services/alarmService');
    
    const medications = await getAllMedicationsByUser(userId);
    
    if (!medications || medications.length === 0) {
      console.log('ℹ️ Nenhum medicamento cadastrado para re-agendar');
      return;
    }

    console.log(`📋 ${medications.length} medicamento(s) encontrado(s)`);

    const scheduledNotifications = await listScheduledAlarms();
    const scheduledIds = scheduledNotifications.map(n => n.identifier);

    let rescheduledCount = 0;

    for (const med of medications) {
      try {
        if (med.alarm_id && scheduledIds.includes(med.alarm_id)) {
          console.log(`⏭️ Alarme já agendado: ${med.name}`);
          continue;
        }

        const [hour, minute] = med.time.split(':').map(Number);
        
        if (isNaN(hour) || isNaN(minute)) {
          console.warn(`⚠️ Horário inválido para ${med.name}: ${med.time}`);
          continue;
        }

        const alarmTime = new Date();
        alarmTime.setHours(hour, minute, 0, 0);

        const { id: newAlarmId } = await scheduleMedicationAlarm(
          med.name,
          med.dosage,
          alarmTime
        );

        if (newAlarmId) {
          if (newAlarmId !== med.alarm_id) {
            const { updateMedicationAlarmId } = await import('./database/database');
            await updateMedicationAlarmId(med.id, newAlarmId);
          }
          
          rescheduledCount++;
          console.log(`✅ Re-agendado: ${med.name} às ${hour}:${minute.toString().padStart(2, '0')}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao re-agendar ${med.name}:`, error);
      }
    }

    console.log(`🎉 ${rescheduledCount} alarme(s) re-agendado(s) com sucesso!`);
  } catch (error) {
    console.error('❌ Erro ao re-agendar alarmes:', error);
  }
}

/**
 * Layout raiz da aplicação
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}