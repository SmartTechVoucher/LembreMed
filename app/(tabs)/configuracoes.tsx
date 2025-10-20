import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';
// Importa a função de atualização de perfil que criamos no database.ts
import { updateUserProfile } from '../database/database'; 
import * as ImagePicker from 'expo-image-picker'; // 👈 Importa o Image Picker

export default function ConfiguracoesScreen() {
  const { user, signOut } = useAuth(); 
  
  // States
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [profileImage, setProfileImage] = useState(user?.profile_image || '');

  // Função para navegar de volta
  const handleGoBack = () => {
    router.back();
  };

  /**
   * 🖼️ Abre a galeria de fotos para selecionar uma imagem de perfil usando expo-image-picker.
   */
  const handleSelectImageFromLibrary = async () => {
    // 1. Solicitar Permissões (Opcional, mas recomendado)
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!granted) {
      Alert.alert('Permissão Negada', 'Você precisa permitir o acesso à galeria para selecionar uma foto.');
      return;
    }

    // 2. Abrir a galeria
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Permite cortar para um formato 1:1
      aspect: [1, 1], 
      quality: 1,
    });

    // 3. Processar resultado
    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      const selectedImageUri = pickerResult.assets[0].uri;
      setProfileImage(selectedImageUri);
    }
  };


  // 💾 Função segura para atualizar TUDO (Email, Senha, Imagem)
  const handleAtualizar = async () => {
    // 1. Verifica se houve alteração em E-mail, Senha OU Imagem
    const isEmailChanged = email && email !== user?.email;
    const isPasswordSet = password.length > 0;
    // user?.profile_image pode ser null, então usamos || '' para comparação segura
    const isImageChanged = profileImage !== (user?.profile_image || ''); 

    if (!isEmailChanged && !isPasswordSet && !isImageChanged) {
      return Alert.alert('Nada para atualizar', 'Preencha um novo e-mail, senha ou altere a imagem de perfil.');
    }

    // 2. Chama a função ADAPTADA do banco de dados
    try {
      const result = await updateUserProfile(
        user!.id,
        isEmailChanged ? email : undefined,
        isPasswordSet ? password : undefined,
        isImageChanged ? profileImage : undefined 
      );

      if (result.success) {
        Alert.alert('Sucesso', 'Dados atualizados! Por favor, faça login novamente para aplicar as mudanças.');
        
        // Força o logout por segurança após alteração de dados sensíveis
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

  // 🚪 Função para sair
  const handleSair = () => {
    signOut();
    router.replace('/auth/login');
  };

  return (
    <View style={styles.container}>
      {/* ⬅️ Cabeçalho com Botão de Voltar */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2A9D8F" />
        </TouchableOpacity>
        <Text style={styles.title}>Configurações da Conta</Text>
        <View style={styles.backButton} /> {/* Placeholder para centralizar */}
      </View>

      <View style={styles.formContainer}>
        
        {/* 📸 Seção da Imagem de Perfil (Agora Clicável) */}
        <Text style={[styles.label, { textAlign: 'center', marginBottom: 15 }]}>
          Clique no ícone para alterar
        </Text>
        <TouchableOpacity 
          style={styles.profileImageSection} 
          onPress={handleSelectImageFromLibrary} // 👈 Chama o ImagePicker aqui
        >
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              // Se tiver uma URI, tenta carregar
              <Image 
                source={{ uri: profileImage }} 
                style={styles.profileImage} 
                onError={() => console.log('Erro ao carregar imagem de perfil')} 
              />
            ) : (
              // Placeholder se não tiver URI
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={40} color="#999" />
              </View>
            )}
          </View>
          <Text style={styles.changeImageText}>Mudar Imagem</Text>
        </TouchableOpacity>
        {/* Fim da Seção de Imagem */}

        {/* 🆕 Botão explícito para Remover Imagem do Perfil (Visível apenas se houver imagem) */}
        {profileImage ? (
            <TouchableOpacity 
                style={styles.removeImageButton} 
                onPress={() => setProfileImage('')} // Limpa a URI para salvar NULL no DB
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
          placeholderTextColor="#A9A9A9" // 👈 CORREÇÃO: Garante que o placeholder seja visível
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
  // 📸 ESTILOS NOVOS PARA A IMAGEM DE PERFIL
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
    borderColor: '#2A9D8F', // Cor de destaque
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
  // 🆕 ESTILO DO BOTÃO DE REMOVER IMAGEM
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E76F51',
    backgroundColor: '#FFEEEE', // Fundo levemente vermelho
    gap: 5,
  },
  removeImageText: {
    color: '#E76F51',
    fontWeight: '600',
    fontSize: 14,
  },
  // FIM DOS ESTILOS NOVOS
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
