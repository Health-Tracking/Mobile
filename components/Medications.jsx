import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, FlatList, Alert } from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Notifications from 'expo-notifications';

// 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function Medications() {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [medicationDates, setMedicationDates] = useState({});
  const [alarms, setAlarms] = useState([]);
  const [medicationCounts, setMedicationCounts] = useState({});

  // 알림 권한 요청
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('알림 권한이 필요합니다', '약 복용 알림을 받으시려면 알림 권한을 허용해주세요.');
        return;
      }
    } catch (error) {
      console.error('알림 권한 요청 오류:', error);
    }
  };

  // 색상 강도 계산 함수
  const getColorIntensity = (count) => {
    const colors = {
      1: '#c0e6c8',  // 1회 복용 (연한 초록색으로 변경)
      2: '#9be9a8',  // 2회 복용
      3: '#40c463',  // 3회 복용
      4: '#30a14e',  // 4회 복용
      5: '#216e39'   // 5회 이상 복용
    };
    return colors[Math.min(count, 5)] || colors[5];
  };

  // 알람 확인 시 복용 기록 추가
  const handleNotificationResponse = async (response) => {
    const date = new Date();
    const dateString = date.toISOString().split('T')[0];

    // 해당 날짜의 복용 횟수 증가
    const currentCount = medicationCounts[dateString] || 0;
    const newCount = currentCount + 1;

    setMedicationCounts(prev => ({
      ...prev,
      [dateString]: newCount
    }));

    // 달력에 표시
    setMedicationDates(prev => ({
      ...prev,
      [dateString]: {
        selected: true,
        selectedColor: getColorIntensity(newCount)
      }
    }));
  };

  // 알림 응답 리스너 설정
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    return () => subscription.remove();
  }, [medicationCounts]);

  // 알람 스케줄링 함수
  const scheduleNotification = async (date) => {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "약 복용 시간입니다",
          body: "지금 약을 복용해주세요.",
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { date: date.toISOString() }, // 날짜 정보 추가
        },
        trigger: date,
      });
      return identifier;
    } catch (error) {
      console.error('알림 스케줄링 오류:', error);
      return null;
    }
  };

  // 알람 취소 함수
  const cancelNotification = async (notificationId) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('알림 취소 오류:', error);
    }
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = async (time) => {
    // 오늘 날짜와 선택된 시간을 결합
    const today = new Date();
    const selectedDateTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      time.getHours(),
      time.getMinutes()
    );

    // 선택된 시간이 현재 시간보다 이전이면 다음 날로 설정
    if (selectedDateTime < today) {
      selectedDateTime.setDate(selectedDateTime.getDate() + 1);
    }

    setSelectedDate(selectedDateTime);
    hideDatePicker();

    const notificationId = await scheduleNotification(selectedDateTime);

    const newAlarm = {
      id: Date.now().toString(),
      time: selectedDateTime,
      active: true,
      notificationId: notificationId
    };

    const updatedAlarms = [...alarms, newAlarm].sort((a, b) => a.time - b.time);
    setAlarms(updatedAlarms);
  };

  const toggleAlarm = async (id) => {
    const alarm = alarms.find(a => a.id === id);
    if (alarm) {
      if (alarm.active) {
        // 알람 비활성화
        if (alarm.notificationId) {
          await cancelNotification(alarm.notificationId);
        }
      } else {
        // 알람 재활성화
        const notificationId = await scheduleNotification(alarm.time);
        alarm.notificationId = notificationId;
      }
    }

    setAlarms(alarms.map(alarm =>
      alarm.id === id ? { ...alarm, active: !alarm.active } : alarm
    ));
  };

  const deleteAlarm = async (id) => {
    const alarm = alarms.find(a => a.id === id);
    if (alarm?.notificationId) {
      await cancelNotification(alarm.notificationId);
    }
    setAlarms(alarms.filter(alarm => alarm.id !== id));
  };

  const renderAlarmItem = ({ item }) => (
    <View style={styles.alarmItem} key={item.id}> {/* 키 추가 */}
      <TouchableOpacity
        style={[styles.alarmToggle, item.active && styles.alarmActive]}
        onPress={() => toggleAlarm(item.id)}
      >
        <Icon name={item.active ? "alarm" : "alarm-outline"} size={24} color={item.active ? "#4A90E2" : "#999"} />
      </TouchableOpacity>
      <View style={styles.alarmInfo}>
        <Text style={styles.alarmTime}>
          {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.alarmDate}>
          {item.time.toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteAlarm(item.id)}
      >
        <Icon name="trash-outline" size={24} color="#FF4444" />
      </TouchableOpacity>
    </View>
  );

  // 테스트 데이터 추가
  useEffect(() => {
    const testData = {
      '2024-11-01': { selected: true, selectedColor: getColorIntensity(1) },
      '2024-11-02': { selected: true, selectedColor: getColorIntensity(2) },
      '2024-11-03': { selected: true, selectedColor: getColorIntensity(3) },
      '2024-11-04': { selected: true, selectedColor: getColorIntensity(4) },
      '2024-11-05': { selected: true, selectedColor: getColorIntensity(5) },
      '2024-11-06': { selected: true, selectedColor: getColorIntensity(1) },
      '2024-11-07': { selected: true, selectedColor: getColorIntensity(2) },
      '2024-11-08': { selected: true, selectedColor: getColorIntensity(3) },
      '2024-11-09': { selected: true, selectedColor: getColorIntensity(4) },
      '2024-11-10': { selected: true, selectedColor: getColorIntensity(5) },
      '2024-11-11': { selected: true, selectedColor: getColorIntensity(2) },
      '2024-11-12': { selected: true, selectedColor: getColorIntensity(2) },
      '2024-11-13': { selected: true, selectedColor: getColorIntensity(3) },
      '2024-11-14': { selected: true, selectedColor: getColorIntensity(4) }
    };

    console.log('마킹된 날짜:', testData);
    setMedicationDates(testData);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>약 복용 관리</Text>
        <Text style={styles.headerSubText}>복용 시간을 설정하고 기록을 관리하세요</Text>
      </View>

      <FlatList
        style={styles.contentContainer}
        data={[{ key: 'content' }]}
        renderItem={() => (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="time-outline" size={20} color="#4A90E2" />
                <Text style={styles.sectionTitle}>복용 알림 설정</Text>
              </View>

              <TouchableOpacity style={styles.addButton} onPress={showDatePicker}>
                <Text style={styles.addButtonText}>+ 새 알림 추가</Text>
              </TouchableOpacity>

              {alarms.map(item => (
                <React.Fragment key={item.id}>
                  {renderAlarmItem({ item })}
                </React.Fragment>
              ))} {/* 키 추가 */}
              {alarms.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Icon name="notifications-off-outline" size={24} color="#999" />
                  <Text style={styles.emptyText}>설정된 알림이 없습니다</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.recordHeader}>
                <View style={styles.sectionHeader}>
                  <Icon name="calendar-outline" size={20} color="#4A90E2" />
                  <Text style={styles.sectionTitle}>복용 기록</Text>
                </View>

                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#c0e6c8' }]} />
                    <Text style={styles.legendText}>1회</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#40c463' }]} />
                    <Text style={styles.legendText}>3회</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#216e39' }]} />
                    <Text style={styles.legendText}>5회+</Text>
                  </View>
                </View>
              </View>

              <Calendar
                current={new Date().toISOString()}
                markedDates={medicationDates}
                markingType={'dot'}
                theme={{
                  backgroundColor: '#ffffff',
                  calendarBackground: '#ffffff',
                  textSectionTitleColor: '#666',
                  selectedDayBackgroundColor: '#4A90E2',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#4A90E2',
                  dayTextColor: '#2d4150',
                  textDisabledColor: '#d9e1e8',
                  dotColor: '#4A90E2',
                  arrowColor: '#4A90E2',
                  monthTextColor: '#2d4150',
                  textDayFontSize: 14,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 14
                }}
              />
            </View>
          </>
        )}
      />

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="time"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  header: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 10,
    margin: 15,
  },
  headerText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  headerSubText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 3,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  addButton: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 15,
  },
  addButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 0,
    marginLeft: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 25,
    marginVertical: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  alarmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
  },
  alarmInfo: {
    flex: 1,
    marginLeft: 10,
  },
  alarmTime: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  alarmDate: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
  },
  deleteButton: {
    padding: 8,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
});