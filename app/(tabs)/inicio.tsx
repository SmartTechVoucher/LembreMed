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
  getUserMedications,
  markMedicationAsTaken,
  Medication,
} from '../database/database';
import { cancelAlarm } from '../src/services/alarmService';

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
      const meds = await getUserMedications(user.id); 
      setMedications(meds);
    } catch (error) {
      console.error('Erro ao carregar medicamentos:', error);
    }
  };

  const handleToggleTaken = async (medication: Medication, currentStatus: boolean) => {
    if (!user) return;
    
    const result = await markMedicationAsTaken(
      medication.id,
      !currentStatus,
      user.id,
      medication.name,
      medication.dosage,
      medication.time
    );
    
    if (result.success) {
      loadMedications();
    }
  };
  
  /**
   * Função para adiar o medicamento por 30 minutos.
   * NOTE: Você deve implementar a função de banco de dados para salvar o novo horário!
   */
  const handleDeferMedication = async (medication: Medication) => {
    if (!user) return;
    
    // 1. Calcular novo horário (+30 minutos)
    const [hours, minutes] = medication.time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() + 30); // Adia por 30 minutos

    const newTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    
    try {
      // 2. SIMULAÇÃO: Cancelar alarme antigo
      const oldAlarmId = await getMedicationNotificationId(medication.id);
      if (oldAlarmId) {
        await cancelAlarm(oldAlarmId);
        // Em um app real, aqui você agendaria o novo alarme para 'newTime'
        // await scheduleAlarm(medication.id, newTime, ...);
      }

      // ** 3. AQUI DEVE ENTRAR A CHAMADA AO BANCO DE DADOS **
      // Ex: const deferResult = await updateMedicationTime(medication.id, newTime); 
      // if (!deferResult.success) throw new Error(deferResult.error);

      // Simulação de Sucesso
      Alert.alert(
        'Medicamento Adiado',
        `${medication.name} adiado com sucesso. Novo horário: ${newTime}. 
         ** Lembre-se de implementar a função de banco de dados para persistir o novo horário! **`
      );
      loadMedications(); // Recarrega lista (assumindo que o DB foi atualizado)
    } catch (error) {
      console.error('Erro ao adiar medicamento:', error);
      Alert.alert('Erro', 'Não foi possível adiar o medicamento. Verifique a implementação do DB.');
    }
  };
  

  const handleDeleteMedication = async (medicationId: number, medicationName: string) => {
    Alert.alert(
      'Excluir Medicamento',
      `Deseja realmente excluir "${medicationName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const alarmId = await getMedicationNotificationId(medicationId);
              if (alarmId) {
                await cancelAlarm(alarmId);
              }

              const result = await deleteMedication(medicationId);
              if (result.success) {
                await loadMedications();
                Alert.alert('Sucesso', 'Medicamento e alarme excluídos com sucesso!');
              } else {
                Alert.alert('Erro', result.error || 'Erro ao excluir medicamento');
              }
            } catch (error) {
              console.error('Erro ao excluir medicamento:', error);
              Alert.alert('Erro', 'Não foi possível excluir o medicamento');
            }
          },
        },
      ]
    );
  };

  const handleEditMedication = (medication: Medication) => {
    router.push({
      pathname: '/(tabs)/adicionar',
      params: { medication: JSON.stringify(medication) },
    });
  };

  const renderMedication = ({ item }: { item: Medication }) => (
    <View style={[
      styles.medicationCard,
      item.taken_today === 1 && styles.medicationCardTaken 
    ]}>
      {/* ROW 1 (Header): Horário em formato de badge (pill) e Ícones de Ação */}
      <View style={styles.medicationHeader}>
        {/* Horário (Badge) */}
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={16} color="#FFF" />
          <Text style={styles.medicationTimeBadge}>{item.time}</Text>
        </View>

        {/* Ícones de Ação: "Tomando" (Checkmark), ADIAR, Editar, Excluir */}
        <View style={styles.actionIcons}>
          
          {/* Ícone de "Tomado" (Checkmark) */}
          <TouchableOpacity 
            onPress={() => handleToggleTaken(item, item.taken_today === 1)}
            style={styles.actionButton}
            disabled={item.taken_today === 1} // Não pode marcar como tomado se já foi
          >
            <Ionicons 
              name={item.taken_today === 1 ? "checkmark-circle" : "checkmark-circle-outline"} 
              size={22} 
              color={item.taken_today === 1 ? "#38A169" : "#666"} 
            />
          </TouchableOpacity>
          
          {/* ÍCONE DE ADIAR (NOVO) */}
          <TouchableOpacity 
            onPress={() => handleDeferMedication(item)}
            style={styles.actionButton}
            disabled={item.taken_today === 1} // Não pode adiar se já foi tomado
          >
            <Ionicons 
              name="reload-circle-outline" // Ícone que sugere reagendamento/adiamento
              size={22} 
              color={item.taken_today === 1 ? "#ccc" : "#E6A23C"} // Amarelo/Laranja
            />
          </TouchableOpacity>

          {/* Ícone de Editar */}
          <TouchableOpacity 
            onPress={() => handleEditMedication(item)}
            style={styles.actionButton}
          >
            <Ionicons name="create-outline" size={20} color="#2A9D8F" />
          </TouchableOpacity>

          {/* Ícone de Excluir */}
          <TouchableOpacity 
            onPress={() => handleDeleteMedication(item.id, item.name)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={20} color="#E76F51" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ROW 2 (Body): Ícone do Medicamento (Folha) e Nome/Dosagem */}
      <View style={styles.medicationBody}>
        <Ionicons 
          name="leaf-outline" 
          size={24} 
          color={item.taken_today === 1 ? "#38A169" : "#2A9D8F"} 
          style={styles.medicationIcon}
        />
        
        <View style={styles.medicationInfo}>
          <Text style={[
            styles.medicationName,
            item.taken_today === 1 && styles.medicationNameTaken
          ]}>
            {item.name}
          </Text>
          <Text style={styles.medicationDosage}>
            {item.dosage} | {item.instructions || 'Sem observações'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require('../../assets/images/Hidden person-pana 1.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Cadastre seus medicamentos</Text>
      <Text style={styles.emptySubtitle}>
        para que possamos ajudá-lo a não esquecer{'\n'}nenhum horário!
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
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <TouchableOpacity
          style={styles.soundButton}
          onPress={() => router.push('/configuracoes')} 
        >
          <View style={styles.notificationIcon}>
            <Ionicons name="settings-outline" size={24} color="#7B68EE" /> 
          </View>
        </TouchableOpacity>

      </View>

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

      {medications.length > 0 ? (
        <FlatList
          data={medications}
          renderItem={renderMedication}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.medicationsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC', // Fundo em tom de bege claro
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  soundButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    position: 'relative',
    width: 40,
    height: 40,
    backgroundColor: '#E8E8F0',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  profileImageContainer: {
    marginBottom: 15,
  },
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
  greeting: {
    fontSize: 18,
    color: '#333',
  },
  userName: {
    fontWeight: '700',
    color: '#2A9D8F',
  },
  subGreeting: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  medicationsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  
  // --- ESTILOS DO CARD REFATORADOS ---
  medicationCard: {
    backgroundColor: '#E8F5E9', 
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  medicationCardTaken: {
    backgroundColor: '#D1EAD8', 
    opacity: 1, 
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12, 
  },
  
  // Estilos para o Horário (Badge/Pill)
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A9D8F', 
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20, 
  },
  medicationTimeBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF', 
    marginLeft: 5,
  },
  
  // Ícones de Ação (Tomando, Adiar, Editar, Excluir)
  actionIcons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  actionButton: {
    padding: 2, 
  },
  
  // Corpo do Medicamento (Ícone + Bloco de Informação)
  medicationBody: {
    flexDirection: 'row',
    alignItems: 'flex-start', 
  },
  medicationIcon: {
    marginRight: 12,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '800', 
    color: '#1A1A1A',
    marginBottom: 4,
  },
  medicationNameTaken: {
    textDecorationLine: 'line-through',
    color: '#38A169', 
  },
  medicationDosage: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  // --- ESTILOS DO CARD REFATORADOS ---
  
  // Empty State styles (Mantidos)
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#B8E6E8',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 20,
    paddingVertical: 40,
    height: 440,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
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
  addButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
});