import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal, TextInput, Alert, ScrollView, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { usePatient } from '../contexts/PatientContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.config';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    style: {
        borderRadius: 16,
    },
    propsForLabels: {
        fontSize: 10,
        fontWeight: '500',
    },
    propsForBackgroundLines: {
        strokeWidth: 1,
        strokeDasharray: "",
        stroke: "rgba(0,0,0,0.1)",
    },
};

function VitalInputModal({ visible, onClose, title, onSubmit }) {
    const [value, setValue] = useState('');
    const [systolic, setSystolic] = useState(''); // 수축기 혈압용
    const [diastolic, setDiastolic] = useState(''); // 이완기 혈압용

    const handleSubmit = () => {
        if (title === "혈압") {
            if (!systolic || !diastolic) {
                Alert.alert("오류", "수축기와 이완기 혈압을 모두 입력해주세요.");
                return;
            }
            onSubmit([parseInt(systolic), parseInt(diastolic)]);
        } else {
            if (!value) {
                Alert.alert("오류", "값을 입력해주세요.");
                return;
            }
            onSubmit(parseInt(value));
        }
        setValue('');
        setSystolic('');
        setDiastolic('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title} 입력</Text>

                    {title === "혈압" ? (
                        <View>
                            <TextInput
                                style={styles.input}
                                placeholder="수축기 혈압"
                                value={systolic}
                                onChangeText={setSystolic}
                                keyboardType="numeric"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="이완기 혈압"
                                value={diastolic}
                                onChangeText={setDiastolic}
                                keyboardType="numeric"
                            />
                        </View>
                    ) : (
                        <TextInput
                            style={styles.input}
                            placeholder={`${title} 값 입력`}
                            value={value}
                            onChangeText={setValue}
                            keyboardType="numeric"
                        />
                    )}

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.buttonText}>취소</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.submitButton]}
                            onPress={handleSubmit}
                        >
                            <Text style={styles.buttonText}>저장</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export default function VitalChart() {
    const { patientInfo, updatePatientInfo } = usePatient();
    const [vitalsData, setVitalsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedVital, setSelectedVital] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const processVitalsData = (patientData) => {
        const processedData = {
            spo2: { labels: [], data: [] },
            bloodPressure: {
                labels: [],
                systolic: [],
                diastolic: []
            },
            bloodSugar: { labels: [], data: [] }
        };

        if (!patientData?.vitals || !Array.isArray(patientData.vitals)) {
            setVitalsData(processedData);
            return;
        }

        patientData.vitals.forEach(vital => {
            if (!vital?.data) return;

            if (vital.title === "산소 포화도") {
                const entries = Object.entries(vital.data || {});
                if (entries.length > 0) {
                    entries.sort((a, b) => new Date(a[0]) - new Date(b[0]));
                    processedData.spo2.labels = entries.map(([date]) =>
                        new Date(date).getDate() + '일'
                    ).slice(-7);
                    processedData.spo2.data = entries.map(([, value]) => value).slice(-7);
                }
            }
            else if (vital.title === "혈압") {
                const entries = Object.entries(vital.data || {});
                if (entries.length > 0) {
                    entries.sort((a, b) => new Date(a[0]) - new Date(b[0]));
                    processedData.bloodPressure.labels = entries.map(([date]) =>
                        new Date(date).getDate() + '일'
                    ).slice(-7);
                    processedData.bloodPressure.systolic = entries.map(([, value]) => value[0]).slice(-7);
                    processedData.bloodPressure.diastolic = entries.map(([, value]) => value[1]).slice(-7);
                }
            }
            else if (vital.title === "혈당") {
                const entries = Object.entries(vital.data || {});
                if (entries.length > 0) {
                    entries.sort((a, b) => new Date(a[0]) - new Date(b[0]));
                    processedData.bloodSugar.labels = entries.map(([date]) =>
                        new Date(date).getDate() + '일'
                    ).slice(-7);
                    processedData.bloodSugar.data = entries.map(([, value]) => value).slice(-7);
                }
            }
        });

        setVitalsData(processedData);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            // Firestore에서 최신 데이터 다시 가져오기
            const patientRef = doc(db, 'patients', patientInfo.id);
            const patientDoc = await getDoc(patientRef);

            if (patientDoc.exists()) {
                const newPatientData = patientDoc.data();
                updatePatientInfo({
                    id: patientInfo.id,
                    ...newPatientData
                });
                processVitalsData(newPatientData);
            }
        } catch (error) {
            console.error('데이터 새로고침 오류:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleVitalSubmit = async (value) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const patientRef = doc(db, 'patients', patientInfo.id);
            const patientDoc = await getDoc(patientRef);

            if (patientDoc.exists()) {
                const currentData = patientDoc.data();
                const vitalsIndex = currentData.vitals.findIndex(v => v.title === selectedVital);

                if (vitalsIndex !== -1) {
                    currentData.vitals[vitalsIndex].data = {
                        ...currentData.vitals[vitalsIndex].data,
                        [today]: value
                    };

                    await updateDoc(patientRef, {
                        vitals: currentData.vitals
                    });

                    // 데이터 새로고침
                    onRefresh();
                }
            }
        } catch (error) {
            console.error('데이터 저장 오류:', error);
            Alert.alert('오류', '데이터 저장 중 문제가 발생했습니다.');
        }
    };

    useEffect(() => {
        if (patientInfo) {
            processVitalsData(patientInfo);
            setLoading(false);
        }
    }, [patientInfo]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#4A90E2"]}
                        tintColor="#4A90E2"
                    />
                }
            >
                <View style={styles.chartsWrapper}>
                    <TouchableOpacity
                        style={styles.chartContainer}
                        onPress={() => {
                            setSelectedVital("산소 포화도");
                            setModalVisible(true);
                        }}
                    >
                        <Text style={styles.title}>산소포화도</Text>
                        <LineChart
                            data={{
                                labels: vitalsData?.spo2.labels.length > 0 ? vitalsData.spo2.labels : ['데이터 없음'],
                                datasets: [{
                                    data: vitalsData?.spo2.data.length > 0 ? vitalsData.spo2.data : [0],
                                    color: (opacity = 1) => `rgba(235, 87, 87, ${opacity * 0.9})`,
                                    strokeWidth: 3,
                                }],
                            }}
                            width={screenWidth - 60}
                            height={200}
                            chartConfig={{
                                ...chartConfig,
                                formatYLabel: (value) => `${Math.round(value)}%`,
                            }}
                            bezier
                            withDots={true}
                            withInnerLines={true}
                            withOuterLines={true}
                            withVerticalLabels={true}
                            withHorizontalLabels={true}
                            withVerticalLines={false}
                            segments={5}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.chartContainer}
                        onPress={() => {
                            setSelectedVital("혈압");
                            setModalVisible(true);
                        }}
                    >
                        <Text style={styles.title}>혈압</Text>
                        <LineChart
                            data={{
                                labels: vitalsData?.bloodPressure.labels.length > 0
                                    ? vitalsData.bloodPressure.labels
                                    : ['데이터 없음'],
                                datasets: [
                                    {
                                        data: vitalsData?.bloodPressure.systolic.length > 0
                                            ? vitalsData.bloodPressure.systolic
                                            : [0],
                                        color: (opacity = 1) => `rgba(235, 87, 87, ${opacity * 0.9})`,
                                        strokeWidth: 3,
                                    },
                                    {
                                        data: vitalsData?.bloodPressure.diastolic.length > 0
                                            ? vitalsData.bloodPressure.diastolic
                                            : [0],
                                        color: (opacity = 1) => `rgba(74, 144, 226, ${opacity * 0.9})`,
                                        strokeWidth: 3,
                                    }
                                ],
                                legend: ["수축기", "이완기"]
                            }}
                            width={screenWidth - 60}
                            height={200}
                            chartConfig={{
                                ...chartConfig,
                                formatYLabel: (value) => `${Math.round(value)}`,
                            }}
                            bezier
                            withDots={true}
                            withInnerLines={true}
                            withOuterLines={true}
                            withVerticalLines={false}
                            segments={5}
                            legendOffset={20}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.chartContainer}
                        onPress={() => {
                            setSelectedVital("혈당");
                            setModalVisible(true);
                        }}
                    >
                        <Text style={styles.title}>혈당</Text>
                        <LineChart
                            data={{
                                labels: vitalsData?.bloodSugar.labels.length > 0
                                    ? vitalsData.bloodSugar.labels
                                    : ['데이터 없음'],
                                datasets: [{
                                    data: vitalsData?.bloodSugar.data.length > 0
                                        ? vitalsData.bloodSugar.data
                                        : [0],
                                    color: (opacity = 1) => `rgba(45, 185, 95, ${opacity * 0.9})`,
                                    strokeWidth: 3,
                                }],
                            }}
                            width={screenWidth - 60}
                            height={200}
                            chartConfig={{
                                ...chartConfig,
                                formatYLabel: (value) => `${Math.round(value)}`,
                            }}
                            bezier
                            withDots={true}
                            withInnerLines={true}
                            withOuterLines={true}
                            withVerticalLines={false}
                            segments={5}
                        />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <VitalInputModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                title={selectedVital}
                onSubmit={handleVitalSubmit}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
    },
    scrollContainer: {
        padding: 15,
    },
    chartsWrapper: {
        gap: 20,
    },
    chartContainer: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
        paddingLeft: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    modalButton: {
        flex: 1,
        padding: 10,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#999',
    },
    submitButton: {
        backgroundColor: '#4A90E2',
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});