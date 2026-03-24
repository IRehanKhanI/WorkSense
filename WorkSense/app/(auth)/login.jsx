import { useState, useEffect } from 'react';
import {
    View, Text, TextInput, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../../src/services/authApi';

export default function LoginScreen() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            const saved = await AsyncStorage.getItem('last_username');
            if (saved) {
                setUsername(saved);
            }
        };
        loadProfile();
    }, []);

    async function handleLogin() {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Validation', 'Please enter your username/email and password.');
            return;
        }
        setLoading(true);
        try {
            const user = await login(username.trim(), password);
            await AsyncStorage.setItem('last_username', username.trim());
            if (user.role === 'ADMIN' || user.role === 'SUPERVISOR') {
                router.replace('/(admin)/dashboard');
            } else {
                router.replace('/(worker)/dashboard');
            }
        } catch (err) {
            const msg =
                err.response?.data?.detail ??
                err.response?.data?.non_field_errors?.[0] ??
                'Login failed. Check your credentials.';
            Alert.alert('Login Error', msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <LinearGradient colors={['#1F1633', '#1A1B30', '#101124']} style={styles.flex}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps='handled'>
                    
                    <View style={styles.header}>
                        <Text style={styles.topSmallText}>WELCOME BACK</Text>
                        <Text style={styles.logo}>WorkSense</Text>
                    </View>
                    
                    <View style={styles.card}>
                        <Text style={styles.label}>Username or Email</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize='none'
                                autoCorrect={false}
                                placeholder='you@email.com or username'
                                placeholderTextColor='#7b7c8f'
                            />
                        </View>

                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                placeholder='• • • • • • • •'
                                placeholderTextColor='#7b7c8f'
                                onSubmitEditing={handleLogin}
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.btn, loading && { opacity: 0.7 }]} 
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            <Text style={styles.btnText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.registerLinkContainer}>
                        <Text style={styles.linkPrompt}>New to WorkSense? </Text>
                        <Link href='/(auth)/register' style={styles.linkText}>Create an account</Link>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    topSmallText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
        color: '#f6a5b4',
        marginBottom: 8,
    },
    logo: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    label: {
        fontSize: 13,
        color: '#d1d1d1',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        backgroundColor: '#1b1c31',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 20,
    },
    input: {
        color: '#ffffff',
        fontSize: 15,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    btn: {
        backgroundColor: '#9e0b3c',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    btnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    registerLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
    },
    linkPrompt: {
        color: '#8b8c9f',
        fontSize: 14,
    },
    linkText: {
        color: '#f6a5b4',
        fontSize: 14,
        fontWeight: '600',
    },
});
