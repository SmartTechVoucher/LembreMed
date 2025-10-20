import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'medication-alarm';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function initializeAlarmService() {
  try {
    console.log('🔔 Inicializando serviço de alarmes...');
    await configureNotificationChannel();
    console.log('✅ Serviço de alarmes inicializado!');
  } catch (error) {
    console.error('❌ Erro ao inicializar serviço de alarmes:', error);
  }
}

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

export async function configureNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Alarme de Medicamentos',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 500, 250, 500],
      enableVibrate: true,
      enableLights: true,
      lightColor: '#FF0000',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

function getNextFireDate(hour: number, minute: number): Date {
  const now = new Date();
  const nextFire = new Date();
  
  nextFire.setHours(hour, minute, 0, 0);
  
  if (nextFire.getTime() <= now.getTime()) {
    nextFire.setDate(nextFire.getDate() + 1);
  }
  
  return nextFire;
}

/**
 * Agenda um alarme usando Date (timestamp)
 * Esta abordagem funciona tanto no Android quanto no iOS
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

    console.log('✅ Permissão concedida para notificações:', permissionGranted);

    if (!permissionGranted) {
      console.warn('❌ Permissão negada. O alarme não será agendado.');
      return { id: null, scheduledDate: null };
    }

    await configureNotificationChannel();

    const hour = alarmTime.getHours();
    const minute = alarmTime.getMinutes();
    
    const nextFireDate = getNextFireDate(hour, minute);
    
    const now = new Date();
    const secondsUntilFire = Math.floor((nextFireDate.getTime() - now.getTime()) / 1000);
    
    console.log('⏰ AGENDAMENTO:');
    console.log('   Horário solicitado:', `${hour}:${minute.toString().padStart(2, '0')}`);
    console.log('   Agora:', now.toLocaleString('pt-BR'));
    console.log('   Próximo disparo:', nextFireDate.toLocaleString('pt-BR'));
    console.log('   Segundos até disparar:', secondsUntilFire);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 HORA DO MEDICAMENTO!',
        body: `${medicationName} - ${dosage}\n⏰ Tome agora!`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && {
          channelId: CHANNEL_ID,
        }),
      },

      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hour,
        minute: minute,
        repeats: true,
      },
    });

    console.log('✅ Alarme agendado com sucesso!');
    console.log('   ID da notificação:', notificationId);
    console.log('   Primeiro toque em:', nextFireDate.toLocaleString('pt-BR'));
    
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const thisNotification = scheduled.find(n => n.identifier === notificationId);
    
    if (thisNotification) {
      console.log('✅ Confirmado: Notificação encontrada na fila');
      console.log('   Trigger:', JSON.stringify(thisNotification.trigger));
    } else {
      console.warn('⚠️ AVISO: Notificação NÃO encontrada na fila após agendamento!');
    }
    
    return { id: notificationId, scheduledDate: nextFireDate };
  } catch (error) {
    console.error('❌ Erro ao agendar o alarme:', error);
    console.error('   Detalhes:', error);
    return { id: null, scheduledDate: null };
  }
}

export async function cancelAlarm(notificationId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('🧹 Alarme cancelado:', notificationId);
  } catch (error) {
    console.error('Erro ao cancelar alarme:', error);
  }
}

export async function cancelAllAlarms() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🧹 Todos os alarmes foram cancelados.');
  } catch (error) {
    console.error('Erro ao cancelar todos os alarmes:', error);
  }
}


export async function listScheduledAlarms() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log('📋 ===== ALARMES AGENDADOS =====');
    console.log(`   Total: ${scheduled.length}`);
    
    if (scheduled.length === 0) {
      console.log('   ⚠️ NENHUM alarme agendado! Isso pode indicar um problema.');
    }
    
    scheduled.forEach((notif, index) => {
      console.log(`\n   [${index + 1}] ${notif.content.title}`);
      console.log(`       ID: ${notif.identifier}`);
      console.log(`       Body: ${notif.content.body}`);
      console.log(`       Trigger: ${JSON.stringify(notif.trigger, null, 2)}`);
    });
    console.log('================================\n');
    
    return scheduled;
  } catch (error) {
    console.error('Erro ao listar alarmes:', error);
    return [];
  }
}

export async function testAlarmNow() {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 TESTE DE ALARME',
        body: 'Seu sistema de notificações está funcionando corretamente!',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && {
          channelId: CHANNEL_ID,
        }),
      },
      trigger: {
        seconds: 2,
      },
    });

    console.log('🚨 Alarme de teste agendado para 2 segundos!');
  } catch (error) {
    console.error('Erro ao disparar alarme de teste:', error);
  }
}