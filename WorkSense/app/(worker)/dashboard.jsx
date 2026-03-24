import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const COLORS = {
    inkBlack: '#011627',
    seaweed: '#419d78',
    mustard: '#fed766',
    lightGlass: 'rgba(255, 255, 255, 0.1)',
    darkGlass: 'rgba(1, 22, 39, 0.5)',
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
            description: 'Check in/out'
        },
        {
            id: 2,
            title: 'Camera',
            icon: 'camera',
            color: COLORS.mustard,
            route: '/(worker)/camera',
            description: 'Live camera'
        },
        {
            id: 3,
            title: 'Location',
            icon: 'map-marker',
            color: COLORS.seaweed,
            route: '/(worker)/map',
            description: 'Track location'
        },
    ];

    const wellnessCards = [
        {
            id: 1,
            title: 'Wellness',
            subtitle: 'AI Health Companion',
            icon: '🧠',
            description: 'Mental wellness support',
        },
        {
            id: 2,
            title: 'Stress Level',
            subtitle: 'Moderate',
            icon: '📊',
            description: 'Risk 35%',
        },
    ];

    const handleNavigate = (route) => {
        router.push(route);
    };

    return (
        <ScrollView
            style={{
                flex: 1,
                backgroundColor: COLORS.inkBlack,
            }}
            contentContainerStyle={{ paddingBottom: 40 }}
        >
            {/* Header with Gradient Background */}
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

            {/* Wellness Overview Card - Glass Morphism */}
            <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
                <View
                    style={{
                        backgroundColor: COLORS.lightGlass,
                        borderRadius: 24,
                        padding: 24,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
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
                                <FontAwesome5
                                    name={action.icon}
                                    size={24}
                                    color={action.color}
                                />
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

            {/* Wellness Cards */}
            <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 }}>
                    Wellness Hub
                </Text>
                {wellnessCards.map((card) => (
                    <View
                        key={card.id}
                        style={{
                            backgroundColor: COLORS.lightGlass,
                            borderRadius: 20,
                            padding: 20,
                            marginBottom: 12,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.2)',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 40, marginRight: 16 }}>
                            {card.icon}
                        </Text>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 }}>
                                {card.title}
                            </Text>
                            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                                {card.subtitle}
                            </Text>
                            <Text style={{ fontSize: 12, color: COLORS.mustard, marginTop: 4 }}>
                                {card.description}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Stats Section */}
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
                            Productivity
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
