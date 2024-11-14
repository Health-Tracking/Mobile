import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function Settings() {
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert(
      "로그아웃",
      "정말 로그아웃 하시겠습니까?",
      [
        {
          text: "취소",
          style: "cancel"
        },
        {
          text: "로그아웃",
          onPress: () => {
            // 여기서 로그인 상태나 토큰을 초기화하는 로직을 추가할 수 있습니다
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  const settingItems = [
    { icon: 'notifications-outline', title: '알림 설정' },
    { icon: 'lock-closed-outline', title: '개인정보 보호' },
    { icon: 'language-outline', title: '언어 설정' },
    { icon: 'help-circle-outline', title: '도움말' },
    { icon: 'information-circle-outline', title: '앱 정보' },
    { icon: 'log-out-outline', title: '로그아웃', onPress: handleLogout },
  ];

  const renderSettingItem = (item, index) => (
    <TouchableOpacity
      key={index}
      style={styles.settingItem}
      onPress={item.onPress}
    >
      <Ionicons name={item.icon} size={24} color="#4A90E2" />
      <Text style={styles.settingText}>{item.title}</Text>
      <Ionicons name="chevron-forward-outline" size={24} color="#4A90E2" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.profileButton}>
        <Text style={styles.profileButtonText}>프로필 수정</Text>
      </TouchableOpacity>
      <View style={styles.settingsList}>
        {settingItems.map(renderSettingItem)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  profileButton: {
    backgroundColor: '#4A90E2',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  profileButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsList: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E1E1E1',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  settingText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
  },
});