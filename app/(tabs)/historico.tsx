import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getHistoryStats, getMedicationHistory } from '../database/database';

interface HistoryItem {
  id: number;
  medication_name: string;
  dosage: string;
  scheduled_time: string;
  taken_time: string | null;
  status: 'taken' | 'missed';
  date: string;
}

interface Stats {
  total: number;
  taken: number;
  missed: number;
  percentage: number;
}

export default function HistoricoScreen() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, taken: 0, missed: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadHistory();
        loadStats();
      }
    }, [user])
  );

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getMedicationHistory(user.id, 50);
      setHistory(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    try {
      const data = await getHistoryStats(user.id);
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <View style={[
      styles.historyCard,
      item.status === 'taken' ? styles.historyCardTaken : styles.historyCardMissed
    ]}>
      <View style={styles.historyHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.dateText}>{item.date}</Text>
        </View>

        <View style={[
          styles.statusBadge,
          item.status === 'taken' ? styles.statusTaken : styles.statusMissed
        ]}>
          <Ionicons 
            name={item.status === 'taken' ? 'checkmark-circle' : 'close-circle'} 
            size={16} 
            color="#FFF" 
          />
          <Text style={styles.statusText}>
            {item.status === 'taken' ? 'Tomado' : 'Perdido'}
          </Text>
        </View>
      </View>

      <View style={styles.historyBody}>
        <Ionicons 
          name="medical" 
          size={24} 
          color={item.status === 'taken' ? '#4CAF50' : '#E76F51'} 
        />
        <View style={styles.historyInfo}>
          <Text style={styles.historyName}>{item.medication_name}</Text>
          <Text style={styles.historyDosage}>{item.dosage}</Text>
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>
              Agendado: <Text style={styles.timeValue}>{item.scheduled_time}</Text>
            </Text>
            {item.taken_time && (
              <Text style={styles.timeLabel}>
                Tomado: <Text style={styles.timeValue}>{item.taken_time}</Text>
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={80} color="#CCC" />
      <Text style={styles.emptyTitle}>Nenhum histórico ainda</Text>
      <Text style={styles.emptySubtitle}>
        Comece a marcar seus medicamentos como tomados{'\n'}para ver seu histórico aqui!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A9D8F" />
        <Text style={styles.loadingText}>Carregando histórico...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Histórico</Text>
      </View>

      {stats.total > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>{stats.percentage}%</Text>
            <Text style={styles.statsLabel}>Aderência</Text>
          </View>

          <View style={styles.statsCard}>
            <Text style={[styles.statsNumber, { color: '#4CAF50' }]}>
              {stats.taken}
            </Text>
            <Text style={styles.statsLabel}>Tomados</Text>
          </View>

          <View style={styles.statsCard}>
            <Text style={[styles.statsNumber, { color: '#E76F51' }]}>
              {stats.missed}
            </Text>
            <Text style={styles.statsLabel}>Perdidos</Text>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>{stats.total}</Text>
            <Text style={styles.statsLabel}>Total</Text>
          </View>
        </View>
      )}

      {history.length > 0 ? (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.historyList}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2A7C8F',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A9D8F',
    marginBottom: 5,
  },
  statsLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  historyList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  historyCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyCardTaken: {
    borderLeftColor: '#4CAF50',
  },
  historyCardMissed: {
    borderLeftColor: '#E76F51',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusTaken: {
    backgroundColor: '#4CAF50',
  },
  statusMissed: {
    backgroundColor: '#E76F51',
  },
  statusText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '600',
  },
  historyBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  historyInfo: {
    marginLeft: 12,
    flex: 1,
  },
  historyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  historyDosage: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  timeInfo: {
    gap: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: '#999',
  },
  timeValue: {
    fontWeight: '600',
    color: '#2A9D8F',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});