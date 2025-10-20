import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import {
  getUserMedications,
  deleteMedication,
  getMedicationNotificationId,
  markMedicationAsTaken,
  // ✅ Importa o tipo Medication diretamente do database.ts
  Medication,
} from '../database/database';
import { useFocusEffect } from '@react-navigation/native';
// ❌ REMOVIDO: Importação duplicada do tipo Medication
// import { Medication } from '../src/types';
import { cancelAlarm } from '../src/services/alarmService';
import { router } from 'expo-router';

// ⚠️ Mantenha o arquivo 'src/types' caso ele contenha outros tipos importantes para sua aplicação.

export default function MinhaContaScreen() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  // const [soundEnabled, setSoundEnabled] = useState(true); // Removido por não ser usado

  useFocusEffect(
    useCallback(() => {
      // ✅ Garantindo que o user existe antes de carregar
      if (user?.id) loadMedications();
    }, [user])
  );

  const loadMedications = async () => {
    if (!user?.id) return;
    try {
      // ✅ A função getUserMedications já retorna Medication[]
      const meds = await getUserMedications(user.id); 
      setMedications(meds);
    } catch (error) {
      console.error('Erro ao carregar medicamentos:', error);
    }
  };

  // ✅ Marcar como tomado
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
      <View style={styles.medicationHeader}>
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={18} color="#2A9D8F" />
          <Text style={styles.medicationTime}>{item.time}</Text>
        </View>

        <View style={styles.actionIcons}>
          {/* ✅ Botão Tomado */}
          <TouchableOpacity onPress={() => handleToggleTaken(item, item.taken_today === 1)}>
            <Ionicons 
              name={item.taken_today === 1 ? "checkmark-circle" : "checkmark-circle-outline"} 
              size={24} 
              color={item.taken_today === 1 ? "#4CAF50" : "#999"} 
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleEditMedication(item)}>
            <Ionicons name="create-outline" size={20} color="#2A9D8F" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleDeleteMedication(item.id, item.name)}>
            <Ionicons name="trash-outline" size={20} color="#E76F51" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.medicationBody}>
        <Ionicons 
          name="medical-outline" 
          size={24} 
          color={item.taken_today === 1 ? "#4CAF50" : "#2A9D8F"} 
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
      {/* ⚠️ Lembre-se de que a imagem precisa estar no local: assets/images/Hidden person-pana 1.png */}
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
              <Ionicons name="person" size={50} color="#999" />
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
    backgroundColor: '#F5F5DC',
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
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7B68EE',
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
    borderColor: '#F5B895',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5B895',
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
  medicationCard: {
    backgroundColor: '#B8E6E8',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  medicationCardTaken: {
    backgroundColor: '#E8F5E9',
    opacity: 0.7,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  medicationTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A9D8F',
    marginLeft: 5,
  },
  medicationBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medicationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  medicationNameTaken: {
    textDecorationLine: 'line-through',
    color: '#4CAF50',
  },
  medicationDosage: {
    fontSize: 13,
    color: '#555',
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
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
