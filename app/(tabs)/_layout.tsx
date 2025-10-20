import { Tabs } from 'expo-router';
import React from 'react';
import { Image } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true, 
        tabBarStyle: {
          backgroundColor: '#f6f6d8ff',
          borderTopColor: '#000000ff',
          height: 65,
          paddingBottom: 5,
        },
        tabBarActiveTintColor: '#2A7C8F',
        tabBarInactiveTintColor: '#9E9E9E', 
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Início', 
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/icons/home.png')}
              style={{
                width: 28,
                height: 28,
                tintColor: focused ? '#2A7C8F' : '#9E9E9E',
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="adicionar"
        options={{
          title: 'Adicionar',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/icons/adicionarReal.png')}
              style={{
                width: 32,
                height: 32,
                tintColor: focused ? '#2A7C8F' : '#9E9E9E',
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="historico"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/icons/calendarioReal.png')}
              style={{
                width: 26,
                height: 26,
                tintColor: focused ? '#2A7C8F' : '#9E9E9E',
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="configuracoes" 
        options={{
          title: 'Config.',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/icons/config.png')} 
              style={{
                width: 26,
                height: 26,
                tintColor: focused ? '#2A7C8F' : '#9E9E9E',
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="minha-conta"
        options={{
          href: null, 
        }}
      />
    </Tabs>
  );
}
