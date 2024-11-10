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
      1: '#ebedf0',  // 1회 복용
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

  const handleConfirm = async (date) => {
    setSelectedDate(date);
    hideDatePicker();

    const notificationId = await scheduleNotification(date);

    const newAlarm = {
      id: Date.now().toString(),
      time: date,
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
    <View style={styles.alarmItem}>
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

  // // 테스트 데이터 추가
  // useEffect(() => {
  //   const testData = {
  //     '2024-11-01': 1,  // 1회 복용
  //     '2024-11-02': 2,  // 2회 복용
  //     '2024-11-03': 3,  // 3회 복용
  //     '2024-11-04': 4,  // 4회 복용
  //     '2024-11-05': 5,  // 5회 복용
  //     '2024-11-06': 1,  // 1회 복용
  //     '2024-11-07': 2,  // 2회 복용
  //     '2024-11-08': 3,  // 3회 복용
  //     '2024-11-09': 4,  // 4회 복용
  //     '2024-11-10': 5,  // 5회 복용
  //   };

  //   // medicationCounts 설정
  //   setMedicationCounts(testData);

  //   // medicationDates 설정
  //   const markedDates = {};
  //   Object.entries(testData).forEach(([date, count]) => {
  //     markedDates[date] = {
  //       selected: true,
  //       selectedColor: getColorIntensity(count)
  //     };
  //   });
  //   setMedicationDates(markedDates);
  // }, []); // 컴포넌트 마운트 시 한 번만 실행
  ////
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>약 복용 알림 설정</Text>
        <TouchableOpacity style={styles.button} onPress={showDatePicker}>
          <Text style={styles.buttonText}>날짜/시간 선택</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.alarmsContainer}>
        <Text style={styles.sectionTitle}>설정된 알람</Text>
        <FlatList
          data={alarms}
          renderItem={renderAlarmItem}
          keyExtractor={item => item.id}
          style={styles.alarmsList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>설정된 알람이 없습니다</Text>
          }
        />
      </View>

      <View style={styles.calendarContainer}>
        <Text style={styles.sectionTitle}>약 복용 기록</Text>
        <Calendar
          current={new Date().toISOString()}
          markedDates={medicationDates}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#000000',
            selectedDayBackgroundColor: '#40c463',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#00adf5',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#00adf5',
            selectedDotColor: '#ffffff',
            arrowColor: 'orange',
            monthTextColor: 'blue',
            indicatorColor: 'blue',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 16
          }}
        />
      </View>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#4A90E2',
  },
  headerText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#2980b9',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
  dateText: {
    color: 'white',
    marginTop: 10,
  },
  calendarContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  calendarHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  alarmsContainer: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  alarmsList: {
    maxHeight: 200,
  },
  alarmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  alarmToggle: {
    padding: 5,
  },
  alarmActive: {
    opacity: 1,
  },
  alarmInfo: {
    flex: 1,
    marginLeft: 10,
  },
  alarmTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  alarmDate: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
});