import { useState } from 'react';
import {
    View, Text, TextInput, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { register } from '../../src/services/authApi';

export default function RegisterScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleRegister() {
        if (!name.trim() || !email.trim() || !password.trim()) {
            Alert.alert('Validation', 'Please fill out all required fields.');
            return;
        }

        setLoading(true);
        try {
            // Note: Our authApi uses username, but the UI expects Full Name. 
            // We use the name field as the username for this API logic seamlessly.
            const user = await register(name.trim(), email.trim(), password, phone.trim(), 'WORKER');
            await AsyncStorage.setItem('last_username', name.trim());
            if (user.role === 'ADMIN' || user.role === 'SUPERVISOR') {
                router.replace('/(admin)/dashboard');
            } else {
                router.replace('/(worker)/dashboard');
            }
        } catch (err) {
            let msg = 'Registration failed. Please try a different email or name.';
            if (err.response && err.response.data) {
                const data = err.response.data;
                const errors = [];
                if (data.username) errors.push('Name/Username: ' + data.username[0]);
                if (data.email) errors.push('Email: ' + data.email[0]);
                if (data.phone_device_id) errors.push('Phone: ' + data.phone_device_id[0]);
                if (data.detail) errors.push(data.detail);
                if (data.non_field_errors) errors.push(data.non_field_errors[0]);
                
                if (errors.length > 0) {
                    msg = errors.join('\n');
                }
            }
            Alert.alert('Registration Error', msg);
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
                        <Text style={styles.topSmallText}>JOIN NOW</Text>
                        <Text style={styles.logo}>WorkSense</Text>
                        <Text style={styles.subtitle}>Your AI Health Companion</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.label}>Full Name *</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize='words'
                                autoCorrect={false}
                                placeholder='John Doe'
                                placeholderTextColor='#7b7c8f'
                            />
                        </View>

                        <Text style={styles.label}>Email Address *</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize='none'
                                autoCorrect={false}
                                keyboardType='email-address'
                                placeholder='you@email.com'
                                placeholderTextColor='#7b7c8f'
                            />
                        </View>

                        <Text style={styles.label}>Password *</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                placeholder='• • • • • • • •'
                                placeholderTextColor='#7b7c8f'
                            />
                        </View>

                        <View style={styles.divider}>
                            <Text style={styles.dividerText}>Emergency Contacts (Optional)</Text>
                        </View>

                        <Text style={styles.label}>SMS Alert Number</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType='phone-pad'
                                placeholder='9890702314'
                                placeholderTextColor='#7b7c8f'
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.btn, loading && { opacity: 0.7 }]} 
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            <Text style={styles.btnText}>{loading ? 'Creating...' : 'Create Account'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.loginLinkContainer}>
                        <Text style={styles.linkPrompt}>Already have an account? </Text>
                        <Link href='/login' style={styles.linkText}>Sign In here</Link>
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
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
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
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#8b8c9f',
        marginTop: 4,
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
        marginBottom: 16,
    },
    input: {
        color: '#ffffff',
        fontSize: 15,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    divider: {
        alignItems: 'center',
        marginVertical: 16,
    },
    dividerText: {
        color: '#f6a5b4',
        fontSize: 14,
        fontWeight: '600',
    },
    btn: {
        backgroundColor: '#9e0b3c',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    btnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loginLinkContainer: {
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
