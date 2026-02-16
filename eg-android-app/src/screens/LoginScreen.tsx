import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {useAuth} from '../context/AuthContext';
import {Colors} from '../utils/Colors';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

const LoginScreen = () => {
  const [email, setEmail] = useState('demo@elementalgenius.com');
  const [password, setPassword] = useState('demo123');
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState<'parent' | 'child'>('parent');
  const [childId, setChildId] = useState('1');

  const navigation = useNavigation<LoginScreenNavigationProp>();
  const {login} = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(
        email,
        password,
        loginType,
        childId ? parseInt(childId, 10) : undefined,
      );

      if (loginType === 'parent') {
        navigation.navigate('ParentDashboard');
      } else {
        navigation.navigate('Dashboard');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🌟</Text>
          <Text style={styles.title}>Elemental Genius</Text>
          <Text style={styles.subtitle}>Learning Made Fun</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                loginType === 'parent' && styles.toggleButtonActive,
              ]}
              onPress={() => setLoginType('parent')}>
              <Text
                style={[
                  styles.toggleText,
                  loginType === 'parent' && styles.toggleTextActive,
                ]}>
                Parent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                loginType === 'child' && styles.toggleButtonActive,
              ]}
              onPress={() => setLoginType('child')}>
              <Text
                style={[
                  styles.toggleText,
                  loginType === 'child' && styles.toggleTextActive,
                ]}>
                Child
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />
          </View>

          {loginType === 'child' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Child ID</Text>
              <TextInput
                style={styles.input}
                value={childId}
                onChangeText={setChildId}
                placeholder="Enter child ID"
                keyboardType="numeric"
              />
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}>
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Logging in...' : `Login as ${loginType}`}
            </Text>
          </TouchableOpacity>

          <View style={styles.demoContainer}>
            <Text style={styles.demoTitle}>Demo Credentials</Text>
            <Text style={styles.demoText}>Email: demo@elementalgenius.com</Text>
            <Text style={styles.demoText}>Password: demo123</Text>
            <Text style={styles.demoText}>Child ID: 1</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  formContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.lighter,
    borderRadius: 10,
    padding: 3,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 7,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: Colors.background,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  demoContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: Colors.lighter,
    borderRadius: 10,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 5,
  },
  demoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default LoginScreen;
