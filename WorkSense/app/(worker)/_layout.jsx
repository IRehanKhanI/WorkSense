import { Stack } from 'expo-router';

export default function WorkerLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="attendance" />
            <Stack.Screen name="camera" />
            <Stack.Screen name="map" />
        </Stack>
    );
}
