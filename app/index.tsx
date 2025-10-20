import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/auth/login'); 
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#2A7C8F', '#4FB3BF', '#7DD3DD', '#B8E6E8', '#E8F7F8']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Image 
            source={require('../assets/images/Blue_pill.png')}
            style={styles.pillImage}
            resizeMode="contain"
          />
        </View>
        
        <Text style={styles.title}>
          <Text style={styles.titleBold}>Lembre</Text>
          <Text style={styles.titleLight}>Med</Text>
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  pillImage: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 48,
    letterSpacing: 1,
  },
  titleBold: {
    fontWeight: '700',
    color: '#2A5F6F',
  },
  titleLight: {
    fontWeight: '300',
    color: '#5FA8B8',
  },
});