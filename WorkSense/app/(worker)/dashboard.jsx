import { useEffect, useState } from 'react';
import {
    View, Text, FlatList, StyleSheet,
    ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../../src/constants/api';
import { logout, getStoredUser } from '../../src/services/authApi';
import TaskCard from '../../src/components/TaskCard';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../../src/constants/theme';

export default function WorkerDashboard() {
    const router = useRouter();
    const [tasks, setTasks] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function init() {
            const storedUser = await getStoredUser();
            setUser(storedUser);
            fetchTasks();
        }
        init();
    }, []);

    async function fetchTasks() {
        setLoading(true);
        try {
            const res = await apiClient.get('/tasks/');
            setTasks(res.data.results ?? res.data);
        } catch {
            Alert.alert('Error', 'Failed to load tasks.');
        } finally {
            setLoading(false);
        }
    }

    async function handleLogout() {
        await logout();
        router.replace('/(auth)/login');
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello,</Text>
                    <Text style={styles.name}>{user?.username ?? 'Worker'}</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.attendanceBtn}
                        onPress={() => router.push('/(worker)/attendance')}
                    >
                        <Text style={styles.attendanceBtnText}>Attendance</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={styles.sectionTitle}>My Tasks</Text>

            {loading ? (
                <ActivityIndicator color={COLORS.primary} style={styles.loader} />
            ) : (
                <FlatList
                    data={tasks}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => <TaskCard task={item} />}
                    ListEmptyComponent={
                        <Text style={styles.empty}>No tasks assigned yet.</Text>
                    }
                    onRefresh={fetchTasks}
                    refreshing={loading}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.md },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.lg,
        paddingTop: SPACING.lg,
    },
    greeting: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
    name: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text },
    headerRight: { alignItems: 'flex-end', gap: SPACING.sm },
    attendanceBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.sm,
    },
    attendanceBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.sm },
    logoutText: { color: COLORS.error, fontSize: FONT_SIZES.sm },
    sectionTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    list: { paddingBottom: SPACING.xxl },
    loader: { marginTop: SPACING.xxl },
    empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xxl },
});
