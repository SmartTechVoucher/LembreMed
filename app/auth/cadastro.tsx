import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { registerUser } from '../database/database';

export default function CadastroScreen() {
  const [name, setName] = useState(''); // ✅ ADICIONADO campo de nome
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de permissão para acessar suas fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    // Validações
    if (!name || !email || !password) { // ✅ CORRIGIDO: Validar nome também
      Alert.alert('Erro', 'Por favor, preencha nome, email e senha');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erro', 'Por favor, insira um e-mail válido');
      return;
    }

    setLoading(true);
    // ✅ CORRIGIDO: Passar o nome para registerUser
    const result = await registerUser(email, password, name, profileImage || undefined);
    setLoading(false);

    if (result.success) {
      Alert.alert(
        'Sucesso', 
        'Cadastro realizado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => router.push('/auth/login')
          }
        ]
      );
    } else {
      Alert.alert('Erro', result.error || 'Erro ao cadastrar usuário');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#2A7C8F" />
        </TouchableOpacity>
        
        <Image 
          source={require('../../assets/images/Blue_pill.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>
          <Text style={styles.titleBold}>Lembre</Text>
          <Text style={styles.titleLight}>Med</Text>
        </Text>
      </View>

      {/* Welcome Text */}
      <Text style={styles.welcomeText}>Crie sua conta</Text>

      {/* Profile Image */}
      <View style={styles.imageContainer}>
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="person-outline" size={40} color="#999" />
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={16} color="#FFF" />
          </View>
        </TouchableOpacity>
        <Text style={styles.imageText}>Foto de perfil (opcional)</Text>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        {/* ✅ ADICIONADO: Campo de Nome */}
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#999" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Nome completo *"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#999" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email *"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Senha *"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Confirmar Senha *"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <Text style={styles.requiredText}>* Campos obrigatórios</Text>

        {/* Register Button */}
        <TouchableOpacity 
          style={[styles.registerButton, loading && styles.registerButtonDisabled]} 
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.registerButtonText}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </Text>
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Já tem uma conta? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  contentContainer: {
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 10,
    zIndex: 1,
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    letterSpacing: 0.5,
  },
  titleBold: {
    fontWeight: '700',
    color: '#2A7C8F',
  },
  titleLight: {
    fontWeight: '400',
    color: '#5FA8B8',
  },
  welcomeText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  imageButton: {
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#2A9D8F',
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CCC',
    borderStyle: 'dashed',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2A9D8F',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F5F5DC',
  },
  imageText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E8F0',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  requiredText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  registerButton: {
    backgroundColor: '#2A9D8F',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#333',
  },
  loginLink: {
    fontSize: 14,
    color: '#2A9D8F',
    fontWeight: '600',
  },
});