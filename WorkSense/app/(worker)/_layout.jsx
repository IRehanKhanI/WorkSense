import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';

export default function WorkerLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.secondary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    elevation: 0,
                    height: 60,
                },
                tabBarBackground: () => (
                    <BlurView
                        tint="dark"
                        intensity={40}
                        style={StyleSheet.absoluteFill}
                    />
                ),
            }}
            sceneContainerStyle={{ backgroundColor: 'transparent' }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
                }}
            />
            <Tabs.Screen
                name="attendance"
                options={{
                    title: 'Attendance',
                    tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />
                }}
            />
            <Tabs.Screen
                name="camera"
                options={{
                    title: 'Camera',
                    tabBarIcon: ({ color }) => <Ionicons name="camera" size={24} color={color} />
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: 'Map',
                    tabBarIcon: ({ color }) => <Ionicons name="navigate" size={24} color={color} />
                }}
            />
            <Tabs.Screen
                name="proofs"
                options={{
                    title: 'Proofs',
                    tabBarIcon: ({ color }) => <Ionicons name="camera-reverse" size={24} color={color} />
                }}
            />
            <Tabs.Screen
                name="reports"
                options={{
                    title: 'Reports',
                    tabBarIcon: ({ color }) => <Ionicons name="document-text" size={24} color={color} />
                }}
            />
            <Tabs.Screen
                name="submit-proof"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="task-completion-report"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
