import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  deleteMedication,
  getMedicationNotificationId,
  getTodayMedications,
  markMedicationAsTaken,
  Medication,
  updateMedicationTime,
} from '../database/database';
import {
  cancelNotification,
  scheduleNotification,
} from '../src/services/alarmService';

export default function MinhaContaScreen() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) loadMedications();
    }, [user])
  );

  const loadMedications = async () => {
    if (!user?.id) return;
    try {
      const meds = await getTodayMedications(user.id);
      setMedications(meds);
      console.log(`📱 Medicamentos carregados: ${meds.length}`);
    } catch (error) {
      console.error('❌ Erro ao carregar medicamentos:', error);
    }
  };

  /**
   * Marca ou desmarca um medicamento como tomado.
   */
  const handleToggleTaken = async (med: Medication, currentStatus: boolean) => {
    if (!user) return;

    try {
      const result = await markMedicationAsTaken(
        med.id,
        !currentStatus,
        user.id,
        med.name,
        med.dosage,
        med.time
      );

      if (!result.success) throw new Error(result.error);

      if (!currentStatus) {
        // Agendar próxima dose
        const newNotificationId = await scheduleNotification(
          med.id,
          med.name,
          med.dosage,
          med.time,
          med.frequency
        );
        console.log(`✅ ${med.name} marcado como tomado. Nova notificação: ${newNotificationId}`);
      }

      await loadMedications();

      if (!currentStatus) {
        Alert.alert(
          'Medicamento Tomado ✅',
          `${med.name} foi marcado como tomado!\n\nVocê verá este medicamento novamente amanhã no horário ${med.time}.`
        );
      }
    } catch (error) {
      console.error('❌ Erro ao marcar medicamento como tomado:', error);
      Alert.alert('Erro', 'Não foi possível marcar o medicamento. Tente novamente.');
    }
  };

  /**
   * Adia o medicamento em 30 minutos.
   */
  const handleDeferMedication = async (med: Medication) => {
    if (!user) return;

    try {
      const [hours, minutes] = med.time.split(':').map(Number);
      const newDate = new Date();
      newDate.setHours(hours, minutes + 30, 0, 0);

      const newTime = `${String(newDate.getHours()).padStart(2, '0')}:${String(
        newDate.getMinutes()
      ).padStart(2, '0')}`;

      const oldNotificationId = await getMedicationNotificationId(med.id);
      if (oldNotificationId) {
        await cancelNotification(oldNotificationId);
        console.log(`🔕 Notificação antiga cancelada (${oldNotificationId})`);
      }

      const updateResult = await updateMedicationTime(med.id, newTime);
      if (!updateResult.success) throw new Error(updateResult.error);

      const newNotificationId = await scheduleNotification(
        med.id,
        med.name,
        med.dosage,
        newTime,
        med.frequency
      );

      console.log(`🔔 Nova notificação agendada (${newNotificationId}) para ${newTime}`);

      Alert.alert('Medicamento Adiado ⏰', `${med.name} foi adiado para ${newTime}!`);
      await loadMedications();
    } catch (error) {
      console.error('❌ Erro ao adiar medicamento:', error);
      Alert.alert('Erro', 'Não foi possível adiar o medicamento. Tente novamente.');
    }
  };

  /**
   * Exclui um medicamento e sua notificação.
   */
  const handleDeleteMedication = (medicationId: number, name: string) => {
    Alert.alert('Excluir Medicamento', `Deseja realmente excluir "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            const notificationId = await getMedicationNotificationId(medicationId);
            if (notificationId) await cancelNotification(notificationId);

            const result = await deleteMedication(medicationId);
            if (!result.success) throw new Error(result.error);

            await loadMedications();
            Alert.alert('Sucesso', 'Medicamento e notificação excluídos com sucesso!');
          } catch (error) {
            console.error('❌ Erro ao excluir medicamento:', error);
            Alert.alert('Erro', 'Não foi possível excluir o medicamento.');
          }
        },
      },
    ]);
  };

  /**
   * Abre tela de edição com dados do medicamento.
   */
  const handleEditMedication = (med: Medication) => {
    router.push({
      pathname: '/(tabs)/adicionar',
      params: { medication: JSON.stringify(med) },
    });
  };

  /**
   * Renderiza um card de medicamento.
   */
  const renderMedication = ({ item }: { item: Medication }) => {
    const taken = item.taken_today === 1;

    return (
      <View style={[styles.medicationCard, taken && styles.medicationCardTaken]}>
        {/* Cabeçalho */}
        <View style={styles.medicationHeader}>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color="#FFF" />
            <Text style={styles.medicationTimeBadge}>{item.time}</Text>
          </View>

          <View style={styles.actionIcons}>
            {/* Marcar como tomado */}
            <TouchableOpacity
              onPress={() => handleToggleTaken(item, taken)}
              style={styles.actionButton}
              disabled={taken}
            >
              <Ionicons
                name={taken ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={22}
                color={taken ? '#38A169' : '#666'}
              />
            </TouchableOpacity>

            {/* Adiar */}
            <TouchableOpacity
              onPress={() => handleDeferMedication(item)}
              style={styles.actionButton}
              disabled={taken}
            >
              <Ionicons
                name="reload-circle-outline"
                size={22}
                color={taken ? '#ccc' : '#E6A23C'}
              />
            </TouchableOpacity>

            {/* Editar */}
            <TouchableOpacity onPress={() => handleEditMedication(item)} style={styles.actionButton}>
              <Ionicons name="create-outline" size={20} color="#2A9D8F" />
            </TouchableOpacity>

            {/* Excluir */}
            <TouchableOpacity
              onPress={() => handleDeleteMedication(item.id, item.name)}
              style={styles.actionButton}
            >
              <Ionicons name="trash-outline" size={20} color="#E76F51" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Corpo */}
        <View style={styles.medicationBody}>
          <Ionicons
            name="leaf-outline"
            size={24}
            color={taken ? '#38A169' : '#2A9D8F'}
            style={styles.medicationIcon}
          />
          <View style={styles.medicationInfo}>
            <Text style={[styles.medicationName, taken && styles.medicationNameTaken]}>
              {item.name}
            </Text>
            <Text style={styles.medicationDosage}>
              {item.dosage} | {item.instructions || 'Sem observações'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  /**
   * Estado vazio
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require('../../assets/images/Hidden person-pana 1.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Nenhum medicamento para hoje</Text>
      <Text style={styles.emptySubtitle}>
        Você não tem medicamentos agendados{'\n'}para o horário de hoje.
      </Text>
      <Text style={styles.emptyHint}>
        💡 Medicamentos cadastrados com horários{'\n'}futuros aparecerão aqui automaticamente!
      </Text>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/(tabs)/adicionar')}
      >
        <Ionicons name="add-circle-outline" size={22} color="#fff" />
        <Text style={styles.addButtonText}>Adicionar Medicamento</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <TouchableOpacity style={styles.soundButton} onPress={() => router.push('/configuracoes')}>
          <View style={styles.notificationIcon}>
            <Ionicons name="settings-outline" size={24} color="#7B68EE" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Perfil */}
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          {user?.profile_image ? (
            <Image source={{ uri: user.profile_image }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={50} color="#FFF" />
            </View>
          )}
        </View>
        <Text style={styles.greeting}>
          Olá, <Text style={styles.userName}>{user?.name || 'Usuário'}!</Text>
        </Text>
        <Text style={styles.subGreeting}>Como você está?</Text>
      </View>

      {/* Lista */}
      {medications.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>📋 Medicamentos de Hoje</Text>
          <FlatList
            data={medications}
            renderItem={renderMedication}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.medicationsList}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        renderEmptyState()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5DC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerLeft: { flex: 1 },
  soundButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  notificationIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#E8E8F0',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: { alignItems: 'center', paddingVertical: 20 },
  profileImageContainer: { marginBottom: 15 },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#2A9D8F',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2A9D8F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: { fontSize: 18, color: '#333' },
  userName: { fontWeight: '700', color: '#2A9D8F' },
  subGreeting: { fontSize: 14, color: '#666', marginTop: 5 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  medicationsList: { paddingHorizontal: 20, paddingBottom: 100 },
  medicationCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  medicationCardTaken: { backgroundColor: '#D1EAD8' },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A9D8F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  medicationTimeBadge: { fontSize: 13, fontWeight: '700', color: '#FFF', marginLeft: 5 },
  actionIcons: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  actionButton: { padding: 2 },
  medicationBody: { flexDirection: 'row', alignItems: 'flex-start' },
  medicationIcon: { marginRight: 12 },
  medicationInfo: { flex: 1 },
  medicationName: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  medicationNameTaken: { textDecorationLine: 'line-through', color: '#38A169' },
  medicationDosage: { fontSize: 13, color: '#555', lineHeight: 18 },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#B8E6E8',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 20,
    paddingVertical: 40,
    minHeight: 440,
  },
  emptyImage: { width: 200, height: 200, marginBottom: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'center', marginBottom: 10 },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 10,
  },
  emptyHint: {
    fontSize: 12,
    color: '#2A9D8F',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A9D8F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  addButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
});
