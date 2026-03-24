import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const COLORS = {
    inkBlack: '#011627',
    seaweed: '#419d78',
    mustard: '#fed766',
    alertRed: '#e84855',
    lightGlass: 'rgba(255, 255, 255, 0.1)',
};

export default function WorkerDashboard() {
    const router = useRouter();

    const quickActions = [
        {
            id: 1,
            title: 'Attendance',
            icon: 'clock',
            color: COLORS.seaweed,
            route: '/(worker)/attendance',
            description: 'Check in/out',
        },
        {
            id: 2,
            title: 'Work Camera',
            icon: 'camera',
            color: COLORS.mustard,
            route: '/(worker)/camera',
            description: 'Before/After proof',
        },
        {
            id: 3,
            title: 'Location',
            icon: 'map-marker',
            color: COLORS.seaweed,
            route: '/(worker)/map',
            description: 'Track location',
        },
    ];

    const handleNavigate = (route) => {
        router.push(route);
    };

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: COLORS.inkBlack }}
            contentContainerStyle={{ paddingBottom: 40 }}
        >
            {/* Header */}
            <View
                style={{
                    paddingHorizontal: 20,
                    paddingTop: 40,
                    paddingBottom: 30,
                    backgroundColor: COLORS.inkBlack,
                }}
            >
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 8 }}>
                    Welcome Back
                </Text>
                <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>
                    WorkSense Dashboard
                </Text>
            </View>

            {/* Status Card */}
            <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
                <View
                    style={{
                        backgroundColor: COLORS.lightGlass,
                        borderRadius: 24,
                        padding: 24,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.2)',
                        overflow: 'hidden',
                    }}
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <View>
                            <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
                                Your Status
                            </Text>
                            <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.seaweed }}>
                                Active
                            </Text>
                        </View>
                        <View
                            style={{
                                width: 60,
                                height: 60,
                                borderRadius: 30,
                                backgroundColor: `${COLORS.seaweed}20`,
                                borderWidth: 2,
                                borderColor: COLORS.seaweed,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 28 }}>✓</Text>
                        </View>
                    </View>
                    <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20 }}>
                        You're all set for today. Keep up the great work!
                    </Text>
                </View>
            </View>

            {/* Work Verification Banner */}
            <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
                <TouchableOpacity
                    onPress={() => handleNavigate('/(worker)/camera')}
                    style={{
                        backgroundColor: COLORS.mustard,
                        borderRadius: 20,
                        padding: 20,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            width: 52,
                            height: 52,
                            borderRadius: 26,
                            backgroundColor: 'rgba(1,22,39,0.15)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 16,
                        }}
                    >
                        <FontAwesome5 name="camera" size={24} color={COLORS.inkBlack} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.inkBlack, marginBottom: 4 }}>
                            Work Verification
                        </Text>
                        <Text style={{ fontSize: 13, color: 'rgba(1,22,39,0.7)' }}>
                            Capture before & after photos — AI checks task completion
                        </Text>
                    </View>
                    <FontAwesome5 name="chevron-right" size={16} color={COLORS.inkBlack} />
                </TouchableOpacity>
            </View>

            {/* Quick Actions Section */}
            <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 }}>
                    Quick Actions
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    {quickActions.map((action) => (
                        <TouchableOpacity
                            key={action.id}
                            onPress={() => handleNavigate(action.route)}
                            style={{
                                width: (width - 52) / 2,
                                backgroundColor: COLORS.lightGlass,
                                borderRadius: 16,
                                padding: 20,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.2)',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <View
                                style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 25,
                                    backgroundColor: `${action.color}30`,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: 12,
                                }}
                            >
                                <FontAwesome5 name={action.icon} size={24} color={action.color} />
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff', textAlign: 'center' }}>
                                {action.title}
                            </Text>
                            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                                {action.description}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Today's Stats */}
            <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 }}>
                    Today's Stats
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.lightGlass,
                            borderRadius: 16,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.2)',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.seaweed, marginBottom: 4 }}>
                            8h 45m
                        </Text>
                        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                            Work Hours
                        </Text>
                    </View>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.lightGlass,
                            borderRadius: 16,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.2)',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.mustard, marginBottom: 4 }}>
                            98%
                        </Text>
                        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                            Task Completion
                        </Text>
                    </View>
                </View>
            </View>

            {/* Footer CTA */}
            <View style={{ paddingHorizontal: 20 }}>
                <TouchableOpacity
                    style={{
                        backgroundColor: COLORS.seaweed,
                        borderRadius: 16,
                        padding: 16,
                        alignItems: 'center',
                        marginBottom: 20,
                    }}
                >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                        View Full Analytics
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

