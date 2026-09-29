import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();

  const handleStart = () => {
    router.push('/auth/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../assets/images/logo_fix.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>HEART PRAYER 365</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>시작</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 260,
    height: 300,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  button: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});