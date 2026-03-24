import { useState } from 'react';
import {
    View, Text, TextInput, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { register } from '../../src/services/authApi';
import CustomButton from '../../src/components/CustomButton';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../../src/constants/theme';

export default function RegisterScreen() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleRegister() {
        if (!username.trim() || !email.trim() || !password.trim()) {
            Alert.alert('Validation', 'Please fill out all fields.');
            return;
        }

        setLoading(true);
        try {
            // Register as a basic WORKER role by default.
            const user = await register(username.trim(), email.trim(), password, null, 'WORKER');
            if (user.role === 'admin' || user.role === 'supervisor') {
                router.replace('/(admin)/dashboard');
            } else {
                router.replace('/(worker)/dashboard');
            }
        } catch (err) {
            const msg =
                err.response?.data?.detail ??
                err.response?.data?.non_field_errors?.[0] ??
                'Registration failed. Please try a different username or email.';
            Alert.alert('Registration Error', msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.logo}>WorkSense</Text>
                <Text style={styles.subtitle}>Create your account</Text>

                <View style={styles.card}>
                    <Text style={styles.label}>Username</Text>
                    <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="Choose a username"
                        placeholderTextColor={COLORS.textSecondary}
                    />

                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        placeholder="Enter your email"
                        placeholderTextColor={COLORS.textSecondary}
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholder="Choose a strong password"
                        placeholderTextColor={COLORS.textSecondary}
                        onSubmitEditing={handleRegister}
                    />

                    <CustomButton
                        title="Sign Up"
                        onPress={handleRegister}
                        loading={loading}
                        style={styles.btn}
                    />

                    <View style={styles.loginLinkContainer}>
                        <Text style={styles.linkPrompt}>Already have an account? </Text>
                        <Link href="/(auth)/login" style={styles.linkText}>
                            Log in here
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: COLORS.background },
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    logo: {
        fontSize: FONT_SIZES.xxxl,
        fontWeight: '900',
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xxl,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
    },
    label: {
        fontSize: FONT_SIZES.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
        marginTop: SPACING.sm,
    },
    input: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: RADIUS.sm,
        color: COLORS.text,
        fontSize: FONT_SIZES.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    btn: {
        marginTop: SPACING.lg,
        marginBottom: SPACING.md,
    },
    loginLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.sm,
    },
    linkPrompt: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.sm,
    },
    linkText: {
        color: COLORS.primary,
        fontSize: FONT_SIZES.sm,
        fontWeight: 'bold',
    },
});
