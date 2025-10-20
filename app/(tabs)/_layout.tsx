import React from 'react';
import { Tabs } from 'expo-router';
import { Image } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true, // Mostra o texto do rótulo
        tabBarStyle: {
          backgroundColor: '#f6f6d8ff',
          borderTopColor: '#000000ff',
          height: 65,
          paddingBottom: 5,
        },
        tabBarActiveTintColor: '#2A7C8F', // Cor ativa (ícones e texto)
        tabBarInactiveTintColor: '#9E9E9E', // Cor inativa
      }}
    >
      {/* 1. Tela Principal (Início) */}
      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Início', // Rótulo na Tab Bar
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

      {/* 2. Tela de Adicionar Medicamento */}
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

      {/* 3. Tela de Histórico */}
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

      {/* 4. NOVO: Tela de Configurações */}
      <Tabs.Screen
        name="configuracoes" 
        options={{
          title: 'Config.', // <--- ESTE RÓTULO JÁ ESTAVA NA VERSÃO ANTERIOR
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

      {/* Mantém a rota 'minha-conta' oculta, caso ela seja usada para navegação interna */}
      <Tabs.Screen
        name="minha-conta"
        options={{
          href: null, // Continua escondida da Tab Bar
        }}
      />
    </Tabs>
  );
}
