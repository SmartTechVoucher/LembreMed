import * as Notifications from 'expo-notifications';

/**
 * Lista todos os alarmes agendados
 */
export async function listScheduledAlarms(): Promise<any[]> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log('📋 Alarmes agendados:', scheduled);
    return scheduled;
  } catch (error) {
    console.error('❌ Erro ao listar alarmes:', error);
    return [];
  }
}

/**
 * Cancela todos os alarmes
 */
export async function cancelAllAlarms(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🗑️ Todos os alarmes cancelados');
  } catch (error) {
    console.error('❌ Erro ao cancelar alarmes:', error);
  }
}