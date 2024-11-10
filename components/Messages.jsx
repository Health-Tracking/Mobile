import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { usePatient } from '../contexts/PatientContext';
import { doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.config';
import Icon from 'react-native-vector-icons/Ionicons';

const OPENAI_API_KEY = 'api key';

export default function Messages() {
  const { patientInfo } = usePatient();
  const [activeTab, setActiveTab] = useState('doctor'); // 'doctor' or 'ai'
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [aiMessages, setAiMessages] = useState([]); // AI 채팅 메시지용 상태
  const flatListRef = useRef();

  useEffect(() => {
    if (!patientInfo?.id) return;

    const patientRef = doc(db, 'patients', patientInfo.id);
    const unsubscribe = onSnapshot(patientRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const sortedMessages = [...(data.messages || [])].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        setMessages(sortedMessages);
      }
    });

    return () => unsubscribe();
  }, [patientInfo?.id]);

  const sendMessage = async () => {
    if (inputMessage.trim() === '' || !patientInfo?.id) return;

    try {
      const patientRef = doc(db, 'patients', patientInfo.id);
      const newMessage = {
        content: inputMessage,
        sender: patientInfo.id,
        timestamp: new Date().toISOString(),
        read: false
      };

      await updateDoc(patientRef, {
        messages: arrayUnion(newMessage)
      });

      setInputMessage(''); // 입력창 초기화
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      Alert.alert('오류', '메시지 전송에 실패했습니다.');
    }
  };

  const sendAiMessage = async () => {
    if (inputMessage.trim() === '' || !patientInfo?.id) return;

    try {
      const patientRef = doc(db, 'patients', patientInfo.id);

      // 사용자 메시지 생성
      const userMessage = {
        content: inputMessage,
        sender: patientInfo.id,
        timestamp: new Date().toISOString(),
        read: false
      };

      // Firebase에 사용자 메시지 저장
      await updateDoc(patientRef, {
        aiMessages: arrayUnion(userMessage)
      });

      setInputMessage('');

      // 로딩 메시지 UI에만 표시 (Firebase에는 저장하지 않음)
      const loadingMessage = {
        content: "응답을 생성하고 있습니다...",
        sender: 'AI',
        timestamp: new Date().toISOString(),
      };
      setAiMessages(prev => [...prev, loadingMessage]);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",  // 또는 "gpt-4"
          messages: [
            {
              role: "system",
              content: `당신은 의료 상담을 제공하는 AI 어시스턴트입니다. 
              의료, 의학, 건강, 약품과 관련된 질문에만 답변해 주세요. 
              상대가 인사를 하면 인사를 해주세요.
              그 외의 주제에 대해서는 "죄송합니다. 저는 의료/건강 관련 상담만 제공할 수 있습니다."라고 답변해 주세요.
              의학적 조언을 제공할 때는 실제 진단이나 치료는 의사와 상담해야 함을 함께 안내해 주세요.`
            },
            {
              role: "user",
              content: inputMessage
            }
          ],
          temperature: 0.3
        })
      });

      // 로딩 메시지 제거
      setAiMessages(prev => prev.filter(msg => msg.content !== "응답을 생성하고 있습니다..."));

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();

      // AI 응답 메시지 생성
      const aiMessage = {
        content: result.choices[0].message.content,
        sender: 'AI',
        timestamp: new Date().toISOString(),
        read: true
      };

      // Firebase에 AI 응답 저장
      await updateDoc(patientRef, {
        aiMessages: arrayUnion(aiMessage)
      });

    } catch (error) {
      console.error('AI 메시지 전송 오류:', error);

      const errorMessage = {
        content: "죄송합니다. 현재 서비스에 문제가 ��어 응답을 생성할 수 없습니다. 잠시 후 다시 시도해주세요.",
        sender: 'AI',
        timestamp: new Date().toISOString(),
        read: true
      };

      // Firebase에 에러 메시지 저장
      await updateDoc(patientRef, {
        aiMessages: arrayUnion(errorMessage)
      });
    }
  };

  const handleSendMessage = () => {
    if (activeTab === 'doctor') {
      sendMessage();
    } else {
      sendAiMessage();
    }
  };

  const currentMessages = activeTab === 'doctor' ? messages : aiMessages;

  const renderMessage = ({ item }) => {
    const isUserMessage = activeTab === 'doctor'
      ? item.sender === patientInfo?.id
      : item.sender === patientInfo?.id;

    let formattedTime;
    try {
      let messageDate;

      if (typeof item.timestamp === 'object' && item.timestamp.seconds) {
        messageDate = new Date(item.timestamp.seconds * 1000);
      } else if (typeof item.timestamp === 'string') {
        messageDate = new Date(item.timestamp);
      } else {
        throw new Error('Invalid timestamp format');
      }

      const hours = messageDate.getHours().toString().padStart(2, '0');
      const minutes = messageDate.getMinutes().toString().padStart(2, '0');

      const today = new Date();
      const isToday = messageDate.getDate() === today.getDate() &&
        messageDate.getMonth() === today.getMonth() &&
        messageDate.getFullYear() === today.getFullYear();

      if (isToday) {
        formattedTime = `${hours}:${minutes}`;
      } else {
        const year = messageDate.getFullYear();
        const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
        const day = messageDate.getDate().toString().padStart(2, '0');
        formattedTime = `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
      }
    } catch (error) {
      console.error('시간 변환 오류:', error);
      formattedTime = "시간 정보 없음";
    }

    return (
      <View style={[styles.messageWrapper, isUserMessage ? styles.userMessageWrapper : {}]}>
        {!isUserMessage && (
          <View style={styles.avatarContainer}>
            <Icon
              name={activeTab === 'doctor' ? "person-circle" : "logo-android"}
              size={32}
              color="#4A90E2"
            />
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isUserMessage ? styles.userMessage : styles.doctorMessage
        ]}>
          <Text style={[
            styles.messageText,
            isUserMessage ? styles.userMessageText : styles.doctorMessageText
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.timestampText,
            isUserMessage ? styles.userTimestamp : styles.doctorTimestamp
          ]}>
            {formattedTime}
          </Text>
        </View>
      </View>
    );
  };

  // AI 메시지 실시간 동기화를 위한 useEffect 추가
  useEffect(() => {
    if (!patientInfo?.id) return;

    const patientRef = doc(db, 'patients', patientInfo.id);
    const unsubscribe = onSnapshot(patientRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const sortedAiMessages = [...(data.aiMessages || [])].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        setAiMessages(sortedAiMessages);
      }
    });

    return () => unsubscribe();
  }, [patientInfo?.id]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'doctor' && styles.activeTab]}
            onPress={() => setActiveTab('doctor')}
          >
            <Icon
              name="medical"
              size={20}
              color={activeTab === 'doctor' ? '#4A90E2' : '#666'}
            />
            <Text style={[
              styles.tabText,
              activeTab === 'doctor' && styles.activeTabText
            ]}>담당 의사</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ai' && styles.activeTab]}
            onPress={() => setActiveTab('ai')}
          >
            <Icon
              name="logo-android"
              size={20}
              color={activeTab === 'ai' ? '#4A90E2' : '#666'}
            />
            <Text style={[
              styles.tabText,
              activeTab === 'ai' && styles.activeTabText
            ]}>AI 상담</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          style={styles.messagesList}
          data={currentMessages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => index.toString()}
          ref={flatListRef}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder={activeTab === 'doctor' ? "의사에게 메시지 보내기..." : "AI에게 질문하기..."}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Text style={styles.sendButtonText}>전송</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
  },
  activeTab: {
    backgroundColor: '#e6f2ff',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  keyboardAvoid: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'center',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  userMessage: {
    backgroundColor: '#4A90E2',
    borderBottomRightRadius: 4,
  },
  doctorMessage: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  doctorMessageText: {
    color: '#000',
  },
  timestampText: {
    fontSize: 10,
    marginTop: 4,
    color: '#999',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  doctorTimestamp: {
    color: '#999',
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    // backgroundColor: 'white',
    // borderTopWidth: 1,
    // borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
