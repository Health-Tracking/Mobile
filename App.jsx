import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import Login from './components/Login.jsx';
import Home from './components/Home.jsx';
import Medications from './components/Medications.jsx';
import VitalChart from './components/VitalChart.jsx';
import Messages from './components/Messages.jsx';
import Settings from './components/Settings.jsx';

import { PatientProvider } from './contexts/PatientContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === '홈') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === '약') {
            iconName = focused ? 'medkit' : 'medkit-outline';
          } else if (route.name === '그래프') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === '메시지') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === '설정') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#F5F5F5',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginBottom: 3,
        },
      })}
    >
      <Tab.Screen name="홈" component={Home} />
      <Tab.Screen name="약" component={Medications} />
      <Tab.Screen name="그래프" component={VitalChart} />
      <Tab.Screen name="메시지" component={Messages} />
      <Tab.Screen name="설정" component={Settings} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <PatientProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </PatientProvider>
  );
}