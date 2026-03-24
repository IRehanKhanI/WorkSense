import { useEffect, useState } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../../src/constants/api';
import { logout, getStoredUser } from '../../src/services/authApi';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../../src/constants/theme';

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function init() {
            const storedUser = await getStoredUser();
            setUser(storedUser);
            fetchStats();
        }
        init();
    }, []);

    async function fetchStats() {
        setLoading(true);
        try {
            const [usersRes, tasksRes, vehiclesRes, attendanceRes] = await Promise.all([
                apiClient.get('/users/'),
                apiClient.get('/tasks/'),
                apiClient.get('/vehicles/'),
                apiClient.get('/attendance/'),
            ]);
            setStats({
                users: usersRes.data.count ?? (usersRes.data.results ?? usersRes.data).length,
                tasks: tasksRes.data.count ?? (tasksRes.data.results ?? tasksRes.data).length,
                vehicles: vehiclesRes.data.count ?? (vehiclesRes.data.results ?? vehiclesRes.data).length,
                attendance: attendanceRes.data.count ?? (attendanceRes.data.results ?? attendanceRes.data).length,
            });
        } catch {
            Alert.alert('Error', 'Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    }

    async function handleLogout() {
        await logout();
        router.replace('/(auth)/login');
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Admin Panel</Text>
                    <Text style={styles.name}>{user?.username ?? 'Admin'}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout}>
                    <Text style={styles.logout}>Logout</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator color={COLORS.primary} style={styles.loader} />
            ) : (
                <View style={styles.grid}>
                    <StatCard label="Users" value={stats?.users ?? 0} color={COLORS.primary} />
                    <StatCard label="Tasks" value={stats?.tasks ?? 0} color={COLORS.secondary} />
                    <StatCard label="Vehicles" value={stats?.vehicles ?? 0} color={COLORS.warning} />
                    <StatCard label="Attendance" value={stats?.attendance ?? 0} color={COLORS.success} />
                </View>
            )}

            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actions}>
                <ActionButton
                    label="Live Map"
                    onPress={() => router.push('/(admin)/live-map')}
                    color={COLORS.primary}
                />
                <ActionButton
                    label="Manage Users"
                    onPress={() => Alert.alert('Coming Soon', 'Full user management view.')}
                    color={COLORS.surfaceLight}
                />
                <ActionButton
                    label="Reports"
                    onPress={() => Alert.alert('Coming Soon', 'Reports generation view.')}
                    color={COLORS.surfaceLight}
                />
                <ActionButton
                    label="IoT Devices"
                    onPress={() => Alert.alert('Coming Soon', 'IoT devices management view.')}
                    color={COLORS.surfaceLight}
                />
            </View>
        </ScrollView>
    );
}

function StatCard({ label, value, color }) {
    return (
        <View style={[cardStyles.card, { borderTopColor: color }]}>
            <Text style={cardStyles.value}>{value}</Text>
            <Text style={cardStyles.label}>{label}</Text>
        </View>
    );
}

function ActionButton({ label, onPress, color }) {
    return (
        <TouchableOpacity
            style={[actionStyles.btn, { backgroundColor: color }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Text style={actionStyles.btnText}>{label}</Text>
        </TouchableOpacity>
    );
}

const cardStyles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        alignItems: 'center',
        flex: 1,
        margin: SPACING.xs,
        borderTopWidth: 4,
    },
    value: { fontSize: FONT_SIZES.xxl, fontWeight: '900', color: COLORS.text },
    label: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: SPACING.xs },
});

const actionStyles = StyleSheet.create({
    btn: {
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.sm,
        alignItems: 'center',
    },
    btnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.md },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: SPACING.md, paddingTop: SPACING.xl },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.lg,
    },
    greeting: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
    name: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text },
    logout: { color: COLORS.error, fontSize: FONT_SIZES.sm },
    loader: { marginTop: SPACING.xxl },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -SPACING.xs,
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    actions: {},
});
