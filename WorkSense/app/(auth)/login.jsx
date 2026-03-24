import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            // Replace this with your actual API call
            // const response = await loginUser(email, password);

            // Simulated login success - navigate to worker dashboard
            Alert.alert('Success', 'Login successful');
            router.replace('/(worker)/dashboard');
        } catch (error) {
            Alert.alert('Error', 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 30, color: '#333' }}>
                    WorkSense Login
                </Text>

                <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{
                        width: '100%',
                        height: 50,
                        borderWidth: 1,
                        borderColor: '#ddd',
                        borderRadius: 8,
                        paddingHorizontal: 15,
                        marginBottom: 15,
                        fontSize: 16,
                    }}
                />

                <TextInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={{
                        width: '100%',
                        height: 50,
                        borderWidth: 1,
                        borderColor: '#ddd',
                        borderRadius: 8,
                        paddingHorizontal: 15,
                        marginBottom: 25,
                        fontSize: 16,
                    }}
                />

                <TouchableOpacity
                    onPress={handleLogin}
                    disabled={loading}
                    style={{
                        width: '100%',
                        height: 50,
                        backgroundColor: loading ? '#ccc' : '#007AFF',
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 15,
                    }}
                >
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                        {loading ? 'Logging in...' : 'Login'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{
                        width: '100%',
                        height: 50,
                        borderWidth: 2,
                        borderColor: '#007AFF',
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '600' }}>
                        Sign Up
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
