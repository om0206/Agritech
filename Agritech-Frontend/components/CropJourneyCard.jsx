import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL, getAuthToken } from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

const CropJourneyCard = ({ farmerId, theme }) => {
  const [journeyId, setJourneyId] = useState(null);
  const [cropName, setCropName] = useState(null);
  const [sowingDate, setSowingDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [careSchedule, setCareSchedule] = useState([]);
  const [wateringTasks, setWateringTasks] = useState([]);
  const [fertilizerTasks, setFertilizerTasks] = useState([]);
  const [showLogs, setShowLogs] = useState('all'); // 'all', 'water', 'fertilizer'
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    completion_percentage: 0,
  });
  const [hasTriedToGenerate, setHasTriedToGenerate] = useState(false);

  useEffect(() => {
    if (farmerId) {
      fetchCurrentJourney();
    }
  }, [farmerId]);

  useEffect(() => {
    if (journeyId && !hasTriedToGenerate) {
      fetchCareSchedule().then(() => {
        setHasTriedToGenerate(true);
      });
      fetchPendingNotifications();
    }
  }, [journeyId]);

  const fetchCurrentJourney = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/farmers/${farmerId}/journey/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.currentJourney) {
        setJourneyId(data.currentJourney.id);
        setCropName(data.currentJourney.crop_name);
        setSowingDate(data.currentJourney.crop_sowing_date);
      }
    } catch (error) {
      console.error('Error fetching journey:', error);
    }
  };

  const fetchCareSchedule = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await fetch(
        `${API_URL}/farmers/${farmerId}/journey/${journeyId}/care-schedule`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setCareSchedule(data.all_schedule || []);
      setWateringTasks(data.watering_schedule || []);
      setFertilizerTasks(data.fertilizer_schedule || []);
      setStats(data.stats || {});

      // Auto-generate plan if it doesn't exist (first time only)
      if ((!data.all_schedule || data.all_schedule.length === 0) && !hasTriedToGenerate) {
        console.log('📋 Auto-generating crop care plan...');
        await autoGeneratePlan();
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      Alert.alert('Error', 'Failed to load crop plan');
    } finally {
      setLoading(false);
    }
  };

  const autoGeneratePlan = async () => {
    try {
      setGenerating(true);
      const token = await getAuthToken();

      const planResponse = await fetch(
        `${API_URL}/farmers/${farmerId}/journey/${journeyId}/generate-plan`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (planResponse.ok) {
        const planData = await planResponse.json();
        console.log('✅ Auto-generated plan! Tasks:', planData.total_tasks);
        // Refetch the schedule to display the newly generated plan
        await fetchCareScheduleOnly();
      } else {
        console.error('Failed to auto-generate plan');
      }
    } catch (error) {
      console.error('Error auto-generating plan:', error);
    } finally {
      setGenerating(false);
    }
  };

  const fetchCareScheduleOnly = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${API_URL}/farmers/${farmerId}/journey/${journeyId}/care-schedule`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setCareSchedule(data.all_schedule || []);
      setWateringTasks(data.watering_schedule || []);
      setFertilizerTasks(data.fertilizer_schedule || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching updated schedule:', error);
    }
  };

  const fetchPendingNotifications = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${API_URL}/farmers/${farmerId}/notifications/pending`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markTaskCompleted = async (taskId) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${API_URL}/farmers/${farmerId}/care-schedule/${taskId}/complete`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        Alert.alert('✅ Task Completed!', 'Great job! Your care task has been marked as done.');
        fetchCareSchedule();
      } else {
        Alert.alert('Error', 'Failed to update task');
      }
    } catch (error) {
      console.error('Error marking task completed:', error);
      Alert.alert('Error', 'Failed to mark task as completed');
    }
  };

  const skipTask = async (taskId) => {
    Alert.alert(
      'Skip Task?',
      'Are you sure you want to skip this task?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Skip',
          onPress: async () => {
            try {
              const token = await getAuthToken();
              const response = await fetch(
                `${API_URL}/farmers/${farmerId}/care-schedule/${taskId}/skip`,
                {
                  method: 'PUT',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (response.ok) {
                Alert.alert('⏭️ Task Skipped');
                fetchCareSchedule();
              }
            } catch (error) {
              console.error('Error skipping task:', error);
            }
          },
        },
      ]
    );
  };

  const getDisplayTasks = () => {
    if (showLogs === 'water') return wateringTasks;
    if (showLogs === 'fertilizer') return fertilizerTasks;
    return careSchedule;
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return theme?.accent || '#FF9800';
      case 'skipped':
        return '#999999';
      default:
        return '#2196F3';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'pending':
        return 'clock-outline';
      case 'skipped':
        return 'skip-forward';
      default:
        return 'help-circle';
    }
  };

  if (!journeyId) {
    return (
      <View style={[styles.card, { backgroundColor: theme?.background }]}>
        <Text style={[styles.noJourneyText, { color: theme?.text }]}>
          No active crop journey. Select a crop to get started!
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* Journey Header */}
      <View style={[styles.card, { backgroundColor: theme?.background }]}>
        <View style={styles.headerRow}>
          <MaterialCommunityIcons
            name="leaf"
            size={24}
            color={theme?.accent || '#4CAF50'}
          />
          <View style={styles.headerInfo}>
            <Text style={[styles.cropName, { color: theme?.text }]}>
              {cropName}
            </Text>
            {sowingDate && (
              <Text style={[styles.sowingDate, { color: theme?.textSecondary }]}>
                Sowing: {new Date(sowingDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Progress Stats */}
      {stats.total_tasks > 0 && (
        <View style={[styles.statsSection, { backgroundColor: theme?.background }]}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                {stats.completed_tasks}
              </Text>
              <Text style={[styles.statLabel, { color: theme?.textSecondary }]}>
                Completed
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme?.accent || '#FF9800' }]}>
                {stats.pending_tasks}
              </Text>
              <Text style={[styles.statLabel, { color: theme?.textSecondary }]}>
                Pending
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#2196F3' }]}>
                {stats.completion_percentage}%
              </Text>
              <Text style={[styles.statLabel, { color: theme?.textSecondary }]}>
                Complete
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Generate Plan Button */}
      {generating && (
        <View
          style={{ marginHorizontal: 16, marginVertical: 12, alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={theme?.accent || '#4CAF50'} />
          <Text style={[styles.generatingText, { color: theme?.textSecondary }]}>
            Creating your personalized crop care plan...
          </Text>
        </View>
      )}

      {/* Filter Tabs */}
      {careSchedule.length > 0 && (
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              showLogs === 'all' && {
                borderBottomColor: theme?.accent,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setShowLogs('all')}
          >
            <Text style={[styles.filterText, { color: theme?.text }]}>
              All ({careSchedule.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              showLogs === 'water' && {
                borderBottomColor: theme?.accent,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setShowLogs('water')}
          >
            <Text style={[styles.filterText, { color: theme?.text }]}>
              Water ({wateringTasks.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              showLogs === 'fertilizer' && {
                borderBottomColor: theme?.accent,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setShowLogs('fertilizer')}
          >
            <Text style={[styles.filterText, { color: theme?.text }]}>
              Fertilizer ({fertilizerTasks.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Care Schedule List */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme?.accent || '#4CAF50'}
          style={{ marginVertical: 20 }}
        />
      ) : (
        <FlatList
          data={getDisplayTasks()}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View
              style={[
                styles.taskCard,
                {
                  backgroundColor:
                    item.care_type === 'water'
                      ? theme?.lightBlue || '#E3F2FD'
                      : theme?.lightOrange || '#FFF3E0',
                  borderLeftColor: getStatusBadgeColor(item.status),
                  borderLeftWidth: 4,
                },
              ]}
            >
              <View style={styles.taskHeader}>
                <View style={styles.taskTypeSection}>
                  <MaterialCommunityIcons
                    name={
                      item.care_type === 'water' ? 'water-drop' : 'leaf-circle'
                    }
                    size={24}
                    color={
                      item.care_type === 'water' ? '#2196F3' : '#FF9800'
                    }
                  />
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskType, { color: theme?.text }]}>
                      {item.care_type === 'water' ? '💧 Water' : '🌱 Fertilizer'}
                    </Text>
                    <Text style={[styles.taskDate, { color: theme?.textSecondary }]}>
                      {new Date(item.planned_date).toLocaleDateString()} (Day{' '}
                      {item.planned_day_from_sowing})
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBadgeColor(item.status) },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={getStatusIcon(item.status)}
                    size={16}
                    color="white"
                  />
                </View>
              </View>

              <View style={styles.taskDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme?.textSecondary }]}>
                    Type:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme?.text }]}>
                    {item.care_type === 'water' ? 'Water' : 'Fertilizer'}
                  </Text>
                </View>
                {item.care_type === 'fertilizer' && item.fertilizer_type && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme?.textSecondary }]}>
                      Fertilizer:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme?.text }]}>
                      {item.fertilizer_type}
                    </Text>
                  </View>
                )}
                {item.reason && (
                  <Text style={[styles.reason, { color: theme?.textSecondary }]}>
                    💡 {item.reason}
                  </Text>
                )}
              </View>

              {item.status === 'pending' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.completeBtn,
                      { backgroundColor: '#4CAF50' },
                    ]}
                    onPress={() => markTaskCompleted(item.id)}
                  >
                    <MaterialCommunityIcons name="check" size={18} color="white" />
                    <Text style={styles.actionBtnText}>Done</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.skipBtn, { backgroundColor: '#999999' }]}
                    onPress={() => skipTask(item.id)}
                  >
                    <MaterialCommunityIcons
                      name="skip-forward"
                      size={18}
                      color="white"
                    />
                    <Text style={styles.actionBtnText}>Skip</Text>
                  </TouchableOpacity>
                </View>
              )}

              {item.status === 'completed' && item.completed_date && (
                <Text
                  style={[
                    styles.completedText,
                    { color: '#4CAF50' },
                  ]}
                >
                  ✅ Completed on {new Date(item.completed_date).toLocaleDateString()}
                </Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme?.textSecondary }]}>
              Generating your personalized crop care plan...
            </Text>
          }
        />
      )}

      {/* Pending Notifications */}
      {notifications.length > 0 && (
        <View
          style={[
            styles.notificationSection,
            { backgroundColor: theme?.background },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme?.text }]}>
            📋 Upcoming Reminders ({notifications.length})
          </Text>
          {notifications.map((notif) => (
            <View
              key={notif.id}
              style={[
                styles.notificationItem,
                {
                  backgroundColor: theme?.lightAccent || '#F1F8E9',
                },
              ]}
            >
              <Text
                style={[styles.notificationMessage, { color: theme?.text }]}
              >
                {notif.message}
              </Text>
              <Text
                style={[
                  styles.notificationDate,
                  { color: theme?.textSecondary },
                ]}
              >
                {new Date(notif.scheduled_date).toLocaleDateString()}
                {notif.scheduled_time && ` at ${notif.scheduled_time}`}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sowingDate: {
    fontSize: 12,
    marginTop: 4,
  },
  noJourneyText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statsSection: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 12,
    borderRadius: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  generatingText: {
    marginTop: 8,
    fontSize: 12,
  },
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  taskTypeSection: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  taskInfo: {
    flex: 1,
  },
  taskType: {
    fontWeight: '600',
    fontSize: 14,
  },
  taskDate: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  taskDetails: {
    gap: 6,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  reason: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  completeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  skipBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  actionBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 13,
  },
  notificationSection: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  notificationItem: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  notificationMessage: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 11,
  },
});

export default CropJourneyCard;
