import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';

export default function Messages() {
  const [isDoctor, setIsDoctor] = useState(true);

  const toggleChat = (mode) => {
    setIsDoctor(mode);
  };

  // 임시 메시지 데이터
  const messages = [
    { id: '1', text: '안녕하세요', sender: 'user' },
    { id: '2', text: isDoctor ? '안녕하세요, 어떤 증상이 있으신가요?' : 'AI: 안녕하세요, 무엇을 도와드릴까요?', sender: 'other' },
    { id: '3', text: '최근에 두통이 심해요', sender: 'user' },
    { id: '4', text: isDoctor ? '언제부터 증상이 있었나요?' : 'AI: 두통의 빈도와 강도에 대해 자세히 설명해 주시겠어요?', sender: 'other' },
  ];

  const renderMessage = ({ item }) => (
    <View style={[styles.messageBubble, item.sender === 'user' ? styles.userMessage : styles.otherMessage]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        <TouchableOpacity style={styles.toggleButton} activeOpacity={1}>
          <View style={[styles.toggleOption, isDoctor && styles.activeToggle]}>
            <Text style={[styles.toggleText, isDoctor && styles.activeToggleText]} onPress={() => toggleChat(true)}>담당 의사</Text>
          </View>
          <View style={[styles.toggleOption, !isDoctor && styles.activeToggle]}>
            <Text style={[styles.toggleText, !isDoctor && styles.activeToggleText]} onPress={() => toggleChat(false)}>AI 상담</Text>
          </View>
        </TouchableOpacity>
      </View>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  toggleContainer: {
    alignItems: 'center',
    padding: 10,
  },
  toggleButton: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4A90E2',
    overflow: 'hidden',
  },
  toggleOption: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: 'white',
  },
  activeToggle: {
    backgroundColor: '#4A90E2',
  },
  toggleText: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  activeToggleText: {
    color: 'white',
  },
  messageList: {
    padding: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
  },
  messageText: {
    fontSize: 16,
  },
});