import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../database/database';

export default function ConfiguracoesScreen() {
  const { user, signOut } = useAuth(); 
  
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [profileImage, setProfileImage] = useState(user?.profile_image || '');

  const handleGoBack = () => {
    router.back();
  };

  const handleSelectImageFromLibrary = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!granted) {
      Alert.alert('Permissão Negada', 'Você precisa permitir o acesso à galeria para selecionar uma foto.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], 
      quality: 1,
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      const selectedImageUri = pickerResult.assets[0].uri;
      setProfileImage(selectedImageUri);
    }
  };

  const handleAtualizar = async () => {
    const isEmailChanged = email && email !== user?.email;
    const isPasswordSet = password.length > 0;
    const isImageChanged = profileImage !== (user?.profile_image || ''); 

    if (!isEmailChanged && !isPasswordSet && !isImageChanged) {
      return Alert.alert('Nada para atualizar', 'Preencha um novo e-mail, senha ou altere a imagem de perfil.');
    }

    try {
      const result = await updateUserProfile(
        user!.id,
        isEmailChanged ? email : undefined,
        isPasswordSet ? password : undefined,
        isImageChanged ? profileImage : undefined 
      );

      if (result.success) {
        Alert.alert('Sucesso', 'Dados atualizados! Por favor, faça login novamente para aplicar as mudanças.');

        signOut();
        router.replace('/auth/login');
      } else {
        Alert.alert('Erro', result.error || 'Erro ao atualizar dados. Tente novamente.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro inesperado ao salvar.');
      console.error(error);
    }
  };

  const handleSair = () => {
    signOut();
    router.replace('/auth/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2A9D8F" />
        </TouchableOpacity>
        <Text style={styles.title}>Configurações da Conta</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.formContainer}>
        
        <Text style={[styles.label, { textAlign: 'center', marginBottom: 15 }]}>
          Clique no ícone para alterar
        </Text>
        <TouchableOpacity 
          style={styles.profileImageSection} 
          onPress={handleSelectImageFromLibrary}
        >
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image 
                source={{ uri: profileImage }} 
                style={styles.profileImage} 
                onError={() => console.log('Erro ao carregar imagem de perfil')} 
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={40} color="#999" />
              </View>
            )}
          </View>
          <Text style={styles.changeImageText}>Mudar Imagem</Text>
        </TouchableOpacity>

        {profileImage ? (
            <TouchableOpacity 
                style={styles.removeImageButton} 
                onPress={() => setProfileImage('')} 
            >
                <Ionicons name="trash-outline" size={20} color="#E76F51" />
                <Text style={styles.removeImageText}>Remover Imagem de Perfil</Text>
            </TouchableOpacity>
        ) : null}


        <Text style={[styles.label, { marginTop: 25 }]}>E-mail</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Nova Senha</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder="Digite uma nova senha"
          placeholderTextColor="#A9A9A9" 
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleAtualizar}>
          <Text style={styles.saveButtonText}>Salvar Alterações</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSair}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F5DC', 
    paddingHorizontal: 20 
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50, 
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    padding: 10,
    width: 44, 
  },
  title: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: '#2A9D8F', 
    textAlign: 'center' 
  },
  formContainer: {
    paddingTop: 10,
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 10,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#2A9D8F',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  changeImageText: {
    fontSize: 14,
    color: '#2A9D8F',
    fontWeight: '600',
    marginTop: 5,
    textDecorationLine: 'underline',
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E76F51',
    backgroundColor: '#FFEEEE',
    gap: 5,
  },
  removeImageText: {
    color: '#E76F51',
    fontWeight: '600',
    fontSize: 14,
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#333', 
    marginTop: 15 
  },
  input: { 
    backgroundColor: '#FFF', 
    padding: 12, 
    borderRadius: 10, 
    marginTop: 5, 
    borderWidth: 1, 
    borderColor: '#DDD' 
  },
  saveButton: { 
    marginTop: 30, 
    backgroundColor: '#2A9D8F', 
    padding: 15, 
    borderRadius: 12, 
    alignItems: 'center', 
    shadowColor: '#2A9D8F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  saveButtonText: { 
    color: '#FFF', 
    fontWeight: '600', 
    fontSize: 16 
  },
  logoutButton: { 
    flexDirection: 'row', 
    gap: 8, 
    backgroundColor: '#E76F51', 
    padding: 15, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 20,
    shadowColor: '#E76F51',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  logoutText: { 
    color: '#FFF', 
    fontWeight: '600', 
    fontSize: 16 
  },
});
