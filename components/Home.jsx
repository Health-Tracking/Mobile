import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { usePatient } from '../contexts/PatientContext';

export default function Home() {
  const { patientInfo } = usePatient();

  if (!patientInfo) {
    return (
      <View style={styles.errorContainer}>
        <Text>환자 정보를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Icon name="person-circle-outline" size={60} color="#4A90E2" />
        <Text style={styles.name}>{patientInfo.name}님</Text>
      </View>

      <View style={styles.infoContainer}>
        <InfoItem icon="male-female" label="성별" value={patientInfo.gender} />
        <InfoItem icon="calendar" label="나이" value={patientInfo.age} />
        <InfoItem icon="body" label="키" value={patientInfo.height} />
        <InfoItem icon="scale" label="체중" value={patientInfo.weight} />
        <InfoItem icon="water" label="혈액형" value={patientInfo.bloodType} />
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>건강 관리 현황</Text>

        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>생체 신호 측정</Text>
          <View style={styles.summaryGrid}>
            <SummaryItem
              icon="heart"
              label="혈압"
              count={patientInfo.vitals?.find(v => v.title === "혈압")?.data ?
                Object.keys(patientInfo.vitals.find(v => v.title === "혈압").data).length : 0}
              total={7}
            />
            <SummaryItem
              icon="pulse"
              label="산소포화도"
              count={patientInfo.vitals?.find(v => v.title === "산소 포화도")?.data ?
                Object.keys(patientInfo.vitals.find(v => v.title === "산소 포화도").data).length : 0}
              total={7}
            />
            <SummaryItem
              icon="water"
              label="혈당"
              count={patientInfo.vitals?.find(v => v.title === "혈당")?.data ?
                Object.keys(patientInfo.vitals.find(v => v.title === "혈당").data).length : 0}
              total={7}
            />
          </View>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>이번 주 약 복용</Text>
          <View style={styles.medicationSummary}>
            <Icon name="medical" size={24} color="#4A90E2" />
            <View style={styles.medicationInfo}>
              <Text style={styles.medicationText}>
                {patientInfo.medications?.length || 0}개의 알림 설정됨
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(5 / 7) * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>주간 복용률 71%</Text>
            </View>
          </View>
        </View>
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

function SummaryItem({ icon, label, count, total }) {
  const percentage = Math.round((count / total) * 100);

  return (
    <View style={styles.summaryItem}>
      <Icon name={icon} size={24} color="#4A90E2" />
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryCount}>{count}/{total}회</Text>
      <Text style={styles.summaryPercentage}>{percentage}%</Text>
    </View>
  );
}

const additionalStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  header: {
    alignItems: 'center',
    padding: 5,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 5,
  },
  infoContainer: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoTextContainer: {
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
  },
  infoValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 15,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summarySection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  summaryItem: {
    alignItems: 'center',
    width: '31%',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  summaryCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  summaryPercentage: {
    fontSize: 15,
    color: '#4A90E2',
    fontWeight: '600',
    marginTop: 2,
  },
  medicationSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  medicationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  medicationText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    height: 5,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginVertical: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 15,
    color: '#4A90E2',
    fontWeight: '600',
  },
  ...additionalStyles,
});