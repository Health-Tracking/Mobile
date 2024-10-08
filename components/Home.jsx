import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function Home() {
  // 이 데이터는 실제로는 서버나 로컬 저장소에서 가져와야 합니다
  const patientInfo = {
    name: '홍길동',
    gender: '남성',
    age: 45,
    height: 175,
    weight: 70,
    bloodType: 'A+',
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Icon name="person-circle-outline" size={80} color="#4A90E2" />
        <Text style={styles.name}>{patientInfo.name}님</Text>
      </View>

      <View style={styles.infoContainer}>
        <InfoItem icon="male-female" label="성별" value={patientInfo.gender} />
        <InfoItem icon="calendar" label="나이" value={`${patientInfo.age}세`} />
        <InfoItem icon="body" label="키" value={`${patientInfo.height}cm`} />
        <InfoItem icon="scale" label="체중" value={`${patientInfo.weight}kg`} />
        <InfoItem icon="water" label="혈액형" value={patientInfo.bloodType} />
      </View>

      <View style={styles.goalContainer}>
        <Text style={styles.goalTitle}>앱 사용 목표</Text>
        <Text style={styles.goalText}>
          이 앱은 귀하의 일상적인 건강 상태를 기록하고 관리하는 데 도움을 줍니다.
          혈압, 산소 포화도, 혈당 등의 생체 정보를 정기적으로 기록하여
          담당 의사의 진료에 유용한 정보를 제공할 수 있습니다.
        </Text>
      </View>
    </ScrollView>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <View style={styles.infoItem}>
      <Icon name={icon} size={24} color="#4A90E2" />
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  infoContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoTextContainer: {
    marginLeft: 15,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  goalContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  goalText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});