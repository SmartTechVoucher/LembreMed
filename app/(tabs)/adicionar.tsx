import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { addMedication } from '../database/database';
import { cancelAlarm, listScheduledAlarms, scheduleMedicationAlarm, testAlarmNow } from '../src/services/alarmService';


const formatTime = (date: Date) =>
  date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const formatDate = (date: Date) => date.toLocaleDateString('pt-BR');

const getInitialTime = () => {
  const now = new Date();
  const initial = new Date();
  
  if (now.getMinutes() === 0) {
      initial.setHours(now.getHours(), 0, 0, 0);
  } else {
      initial.setHours(now.getHours() + 1, 0, 0, 0);
  }

  if (initial.getTime() <= now.getTime()) {
      initial.setDate(initial.getDate() + 1);
  }
  
  return initial;
};


export default function AdicionarMedicamentoScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('Diariamente');
  
  const [time, setTime] = useState(getInitialTime()); 
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [observations, setObservations] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const frequencyOptions = [
    'Diariamente',
    'A cada 12 horas',
    'A cada 8 horas',
    'A cada 6 horas',
    'Semanal',
    'Mensal',
  ];

  const onTimeChange = (_: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const newTime = new Date();
      newTime.setHours(selectedTime.getHours());
      newTime.setMinutes(selectedTime.getMinutes());
      newTime.setSeconds(0);
      newTime.setMilliseconds(0);
      setTime(newTime);
      
      console.log('⏰ Horário selecionado:', newTime.toLocaleTimeString());
    }
  };

  const onStartDateChange = (_: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) setStartDate(selectedDate);
  };

  const onEndDateChange = (_: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) setEndDate(selectedDate);
  };

  const handleAddMedication = async () => {
    if (!medicationName.trim() || !dosage.trim() || (!frequency.trim() && !selectedFrequency) || !user) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios e autentique o usuário.');
      return;
    }

    setLoading(true);
    try {
      console.log('📝 Cadastrando medicamento...');
      console.log('   Horário selecionado:', time.toLocaleTimeString());

      const { id: alarmId, scheduledDate } = await scheduleMedicationAlarm(
        medicationName.trim(),
        dosage.trim(),
        time 
      );

      if (!alarmId || !scheduledDate) {
        setLoading(false);
        Alert.alert('Erro', 'Não foi possível agendar o alarme. Verifique as permissões.');
        return;
      }

      console.log('✅ Alarme agendado com ID:', alarmId);
      console.log('✅ Alarme disparará em:', scheduledDate.toLocaleString());

      const result = await addMedication(
        user.id,
        medicationName.trim(),
        dosage.trim(),
        frequency.trim() || selectedFrequency,
        formatTime(time),
        observations.trim() || undefined,
        formatDate(startDate),
        formatDate(endDate),
        alarmId
      );

      setLoading(false);

      if (result.success) {
        await listScheduledAlarms();

        const isToday = scheduledDate.toDateString() === new Date().toDateString();
        const scheduledTimeStr = formatTime(scheduledDate);
        let message = `Medicamento adicionado com sucesso!\n\n⏰ Alarme configurado para: ${scheduledTimeStr}`;
        
        if (!isToday) {
            message += `\n📅 O primeiro toque será amanhã.`;
        } else {
            message += `\n📅 O primeiro toque será hoje.`;
        }

        Alert.alert('Sucesso! 🎉', message, [
          {
            text: 'OK',
            onPress: () => {
              setMedicationName('');
              setDosage('');
              setFrequency('');
              setObservations('');
              setTime(getInitialTime());
              router.back();
            },
          },
        ]);
      } else {
        await cancelAlarm(alarmId); 
        Alert.alert('Erro', result.error || 'Erro ao adicionar medicamento no banco de dados. O alarme foi cancelado.');
      }
    } catch (error) {
      setLoading(false);
      console.error('❌ Erro geral ao adicionar medicamento:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o medicamento');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2A7C8F" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => {
            testAlarmNow();
            Alert.alert('Teste', 'Alarme de teste agendado para tocar em 2 segundos! 🔊');
          }}
        >
          <Ionicons name="volume-high" size={20} color="#2A9D8F" />
          <Text style={styles.testButtonText}>Testar Som</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Adicionar Medicamento</Text>
        <Text style={styles.subtitle}>
          Informe os detalhes{'\n'}para receber lembretes no horário certo.
        </Text>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Nome do Medicamento <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Paracetamol"
            placeholderTextColor="#999"
            value={medicationName}
            onChangeText={setMedicationName}
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Dosagem <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 500mg"
            placeholderTextColor="#999"
            value={dosage}
            onChangeText={setDosage}
            keyboardType="numeric" 
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Frequência <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.frequencyRow}>
            <TextInput
              style={[styles.input, styles.frequencyInput]}
              placeholder="Ex: 3"
              placeholderTextColor="#999"
              value={frequency}
              onChangeText={setFrequency}
              keyboardType="numeric"
            />
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedFrequency}
                onValueChange={(value) => setSelectedFrequency(value)}
                style={styles.picker}
              >
                {frequencyOptions.map((option) => (
                  <Picker.Item key={option} label={option} value={option} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Horário <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={20} color="#2A9D8F" />
            <Text style={styles.timeText}>{formatTime(time)}</Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={onTimeChange}
            />
          )}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Observações (Opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ex: Tomar após as refeições"
            placeholderTextColor="#999"
            value={observations}
            onChangeText={setObservations}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Período de Uso (Opcional)</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <TextInput
                style={styles.dateInput}
                placeholder="dd/mm/aaaa"
                placeholderTextColor="#999"
                value={formatDate(startDate)}
                editable={false}
              />
              <Ionicons name="calendar-outline" size={20} color="#2A9D8F" />
            </TouchableOpacity>

            <Text style={styles.dateLabel}>até</Text>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <TextInput
                style={styles.dateInput}
                placeholder="dd/mm/aaaa"
                placeholderTextColor="#999"
                value={formatDate(endDate)}
                editable={false}
              />
              <Ionicons name="calendar-outline" size={20} color="#2A9D8F" />
            </TouchableOpacity>
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={onStartDateChange}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={onEndDateChange}
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.addButton, loading && styles.addButtonDisabled]}
          onPress={handleAddMedication}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>
            {loading ? 'Adicionando...' : 'Adicionar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#B8E6E8' },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 50,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    testButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 5,
    },
    testButtonText: { color: '#2A9D8F', fontSize: 12, fontWeight: '600' },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 25, paddingBottom: 40 },
    title: { fontSize: 24, fontWeight: '700', color: '#000', marginBottom: 10 },
    subtitle: { fontSize: 14, color: '#666', marginBottom: 30, lineHeight: 20 },
    fieldContainer: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 8 },
    required: { color: '#E76F51' },
    input: {
      backgroundColor: '#FFF',
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: 12,
      fontSize: 14,
      color: '#333',
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    textArea: { height: 100, paddingTop: 12 },
    frequencyRow: { flexDirection: 'row', gap: 10 },
    frequencyInput: { flex: 1 },
    pickerContainer: {
      flex: 2,
      backgroundColor: '#FFF',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    picker: { height: 56, color: '#9e9e9e' },
    timeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF',
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      gap: 10,
    },
    timeText: { fontSize: 14, color: '#333', fontWeight: '500' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dateButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF',
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      gap: 10,
    },
    dateInput: { flex: 1, fontSize: 14, color: '#333', padding: 0 },
    dateLabel: { fontSize: 14, color: '#666' },
    addButton: {
      backgroundColor: '#2A9D8F',
      borderRadius: 25,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 10,
    },
    addButtonDisabled: { opacity: 0.6 },
    addButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    cancelButton: {
      backgroundColor: '#F5F5DC',
      borderRadius: 25,
      paddingVertical: 15,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#2A9D8F',
    },
    cancelButtonText: { color: '#2A9D8F', fontSize: 16, fontWeight: '600' },
  });
