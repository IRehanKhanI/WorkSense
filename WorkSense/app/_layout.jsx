import { Stack } from 'expo-router';
import { useSecurityCheck } from '../src/hooks/useSecurityCheck';
import SecurityBlockScreen from '../src/components/SecurityBlockScreen';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

export default function RootLayout() {
    const { isSecure, securityIssues, loading } = useSecurityCheck();

    if (!isSecure && !loading) {
        return <SecurityBlockScreen issues={securityIssues} />;
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0F172A', '#1E293B', '#0F172A']}
                style={styles.background}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <Stack screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' }
            }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(worker)" />
                <Stack.Screen name="(admin)" />
            </Stack>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
});