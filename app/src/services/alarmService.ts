import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';

// ID do canal de notificação para Android
const CHANNEL_ID = 'medication-alarm';

// ✅ Configuração global do handler 
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // Exibe notificação como banner
    shouldShowList: true,   // Exibe na central de notificações
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Inicializa o serviço de alarmes (chamado no _layout.tsx)
 */
export async function initializeAlarmService() {
  try {
    console.log('🔔 Inicializando serviço de alarmes...');
    await configureNotificationChannel();
    console.log('✅ Serviço de alarmes inicializado!');
  } catch (error) {
    console.error('❌ Erro ao inicializar serviço de alarmes:', error);
  }
}

/**
 * Solicita permissão para enviar notificações (Android + iOS)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (!Device.isDevice && Platform.OS !== 'web') {
      console.warn('⚠️ Notificações podem não funcionar corretamente em emuladores/simuladores.');
    }

    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;

    const response = await Notifications.requestPermissionsAsync();
    return response.granted || false;
  } catch (error) {
    console.error('Erro ao solicitar permissão:', error);
    return false;
  }
}

/**
 * Configura o canal de som e vibração no Android
 */
export async function configureNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Alarme de Medicamentos',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default', // Som padrão do sistema
      vibrationPattern: [0, 500, 250, 500],
      enableVibrate: true,
      enableLights: true,
      lightColor: '#FF0000',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

/**
 * Agenda um alarme para o horário selecionado (repete diariamente)
 * @param medicationName Nome do medicamento
 * @param dosage Dosagem
 * @param alarmTime Objeto Date com o horário (hora e minuto) desejado
 */
export async function scheduleMedicationAlarm(
  medicationName: string,
  dosage: string,
  alarmTime: Date
): Promise<{ id: string | null, scheduledDate: Date | null }> {
  try {
    const permissionGranted = await requestNotificationPermission();

    console.log('Permissão concedida para notificações:', permissionGranted);

    if (!permissionGranted) {
      Alert.alert('Permissão negada', 'Ative as notificações para receber os alarmes.');
      return { id: null, scheduledDate: null };
    }

    await configureNotificationChannel();

    const hour = alarmTime.getHours();
    const minute = alarmTime.getMinutes();
    
    // Calcula a próxima data de disparo (apenas para logging)
    const now = new Date();
    const nextFireDate = new Date();
    nextFireDate.setHours(hour, minute, 0, 0);

    if (nextFireDate.getTime() <= now.getTime()) {
      nextFireDate.setDate(nextFireDate.getDate() + 1);
      console.log('⏰ Horário passou hoje. Próximo disparo amanhã:', nextFireDate.toLocaleString());
    } else {
      console.log('⏰ Próximo disparo hoje:', nextFireDate.toLocaleString());
    }


    // 3. Agenda o alarme usando o trigger 'time' para repetição diária
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 HORA DO MEDICAMENTO!',
        body: `${medicationName} - ${dosage}\n⏰ Tome agora!`,
        sound: 'default', 
        // 🚨 MUDANÇA: Reduzindo a prioridade de MAX para HIGH
        priority: Notifications.AndroidNotificationPriority.HIGH, 
        ...(Platform.OS === 'android' && {
          channelId: CHANNEL_ID, 
        }),
      },
      trigger: {
        hour: hour,
        minute: minute,
        repeats: true, 
      },
    });

    console.log('✅ Alarme agendado!');
    console.log('   ID:', notificationId);
    console.log('   Para:', nextFireDate.toLocaleString());
    
    return { id: notificationId, scheduledDate: nextFireDate };
  } catch (error) {
    console.error('❌ Erro ao agendar o alarme:', error);
    return { id: null, scheduledDate: null };
  }
}

/**
 * Cancela um alarme específico
 */
export async function cancelAlarm(notificationId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('🧹 Alarme cancelado:', notificationId);
  } catch (error) {
    console.error('Erro ao cancelar alarme:', error);
  }
}

/**
 * Cancela todos os alarmes
 */
export async function cancelAllAlarms() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🧹 Todos os alarmes foram cancelados.');
  } catch (error) {
    console.error('Erro ao cancelar todos os alarmes:', error);
  }
}

/**
 * Lista todos os alarmes agendados
 */
export async function listScheduledAlarms() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log('📋 Alarmes agendados:', scheduled.length);
    scheduled.forEach((notif, index) => {
      // Loga o 'trigger' (mostra se é 'time' com repeats: true)
      console.log(`   [${index + 1}]`, notif.content.title, '- Trigger:', JSON.stringify(notif.trigger));
    });
    return scheduled;
  } catch (error) {
    console.error('Erro ao listar alarmes:', error);
    return [];
  }
}

/**
 * Testa o alarme imediatamente (para debug)
 */
export async function testAlarmNow() {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 TESTE DE ALARME',
        body: 'Seu sistema de notificações está funcionando corretamente!',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH, // Usando HIGH aqui também
        ...(Platform.OS === 'android' && {
            channelId: CHANNEL_ID, 
        }),
      },
      trigger: {
        type: 'seconds',
        seconds: 2, 
      },
    });

    console.log('🚨 Alarme de teste agendado para 2 segundos!');
  } catch (error) {
    console.error('Erro ao disparar alarme de teste:', error);
  }
}
