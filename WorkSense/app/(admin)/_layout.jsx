import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';

export default function AdminLayout() {
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
                name="live-map"
                options={{
                    title: 'Live Map',
                    tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />
                }}
            />
            <Tabs.Screen
                name="r3f-route"
                options={{
                    title: '3D Route',
                    tabBarIcon: ({ color }) => <Ionicons name="bus" size={24} color={color} />
                }}
            />
        </Tabs>
    );
}
