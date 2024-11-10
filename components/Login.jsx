import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.config';
import { usePatient } from '../contexts/PatientContext';

export default function Login({ navigation }) {
    const [patientId, setPatientId] = useState('');
    const { updatePatientInfo } = usePatient();

    const handleLogin = async () => {
        if (!patientId.trim()) {
            Alert.alert('오류', '환자 ID를 입력해주세요.');
            return;
        }

        try {
            const patientRef = doc(db, 'patients', patientId);
            const patientDoc = await getDoc(patientRef);

            if (patientDoc.exists()) {
                const patientData = patientDoc.data();
                // Context에 환자 정보 저장
                updatePatientInfo({
                    id: patientId,
                    ...patientData
                });

                navigation.replace('MainTabs', {
                    screen: 'Home',
                    params: { patientId: patientId }
                });
            } else {
                Alert.alert('오류', '존재하지 않는 환자 ID입니다.');
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            Alert.alert('오류', '로그인 중 문제가 발생했습니다. 다시 시도해주세요.');
        }
    };

    const handleGoogleLogin = () => {
        // 구글 로그인 구현
        // console.log('구글 로그인 시도');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>로그인</Text>
            <TextInput
                style={styles.input}
                placeholder="환자 ID를 입력하세요"
                value={patientId}
                onChangeText={setPatientId}
                keyboardType="default"
                autoCapitalize="none"
            />
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.buttonText}>로그인</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
                <Icon name="logo-google" size={24} color="#fff" style={styles.googleIcon} />
                <Text style={styles.buttonText}>구글로 로그인</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F5F5F5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 15,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    loginButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
        marginBottom: 15,
    },
    googleButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#DB4437',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    googleIcon: {
        marginRight: 10,
    },
});
