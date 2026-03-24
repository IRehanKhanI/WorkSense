
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../../src/constants/api';
import CustomButton from '../../src/components/CustomButton';
import useLocationTracking from '../../src/hooks/useLocationTracking';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../../src/constants/theme';

export default function AttendanceScreen() {
    const router = useRouter();
    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(false);
    const { location, errorMsg } = useLocationTracking();

    useEffect(() => {
        fetchTodayRecord();
    }, []);

    async function fetchTodayRecord() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await apiClient.get('/attendance/', { params: { date: today } });
            const results = res.data.results ?? res.data;
            if (results.length > 0) setRecord(results[0]);
        } catch {
            // no record yet is fine
        }
    }

    async function handleClockIn() {
        setLoading(true);
        try {
            const body = {
                latitude: location?.coords?.latitude ?? null,
                longitude: location?.coords?.longitude ?? null,
            };
            const res = await apiClient.post('/attendance/clock_in/', body);
            setRecord(res.data);
            Alert.alert('Clocked In', 'Your attendance has been recorded.');
        } catch (err) {
            Alert.alert('Error', err.response?.data?.detail ?? 'Clock-in failed.');
        } finally {
            setLoading(false);
        }
    }

    async function handleClockOut() {
        setLoading(true);
        try {
            const body = {
                latitude: location?.coords?.latitude ?? null,
                longitude: location?.coords?.longitude ?? null,
            };
            const res = await apiClient.post('/attendance/clock_out/', body);
            setRecord(res.data);
            Alert.alert('Clocked Out', 'Have a great rest of your day!');
        } catch (err) {
            Alert.alert('Error', err.response?.data?.detail ?? 'Clock-out failed.');
        } finally {
            setLoading(false);
        }
    }

    function formatTime(iso) {
        if (!iso) return '—';
        return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const canClockIn = !record?.clock_in;
    const canClockOut = !!record?.clock_in && !record?.clock_out;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.heading}>Attendance</Text>
            <Text style={styles.date}>{new Date().toDateString()}</Text>

            {errorMsg && (
                <View style={styles.warn}>
                    <Text style={styles.warnText}>Location: {errorMsg}</Text>
                </View>
            )}

            <View style={styles.card}>
                <Row label="Status" value={record?.status ?? 'Not recorded'} />
                <Row label="Clock In" value={formatTime(record?.clock_in)} />
                <Row label="Clock Out" value={formatTime(record?.clock_out)} />
                <Row
                    label="Geofence"
                    value={record?.is_geofence_valid ? 'Valid' : record ? 'Invalid' : '—'}
                    valueColor={
                        record?.is_geofence_valid
                            ? COLORS.success
                            : record
                                ? COLORS.error
                                : COLORS.textSecondary
                    }
                />
            </View>

            {canClockIn && (
                <CustomButton
                    title="Clock In"
                    onPress={handleClockIn}
                    loading={loading}
                    style={styles.action}
                />
            )}
            {canClockOut && (
                <CustomButton
                    title="Clock Out"
                    onPress={handleClockOut}
                    loading={loading}
                    style={styles.action}
                />
            )}
            {record?.clock_in && record?.clock_out && (
                <Text style={styles.done}>Attendance complete for today.</Text>
            )}

            <CustomButton
                title="Verify with Selfie"
                onPress={() => router.push('/(worker)/camera')}
                variant="secondary"
                style={styles.secondary}
            />
        </ScrollView>
    );
}

function Row({ label, value, valueColor }) {
    return (
        <View style={rowStyles.row}>
            <Text style={rowStyles.label}>{label}</Text>
            <Text style={[rowStyles.value, valueColor && { color: valueColor }]}>{value}</Text>
        </View>
    );
}

const rowStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    label: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
    value: { color: COLORS.text, fontWeight: '600', fontSize: FONT_SIZES.sm },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: SPACING.md, paddingTop: SPACING.xl },
    heading: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: '900',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    date: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.lg },
    warn: {
        backgroundColor: COLORS.warning + '33',
        borderRadius: RADIUS.sm,
        padding: SPACING.sm,
        marginBottom: SPACING.md,
    },
    warnText: { color: COLORS.warning, fontSize: FONT_SIZES.sm },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
    },
    action: { marginBottom: SPACING.sm },
    secondary: { marginTop: SPACING.md },
    done: {
        textAlign: 'center',
        color: COLORS.success,
        fontWeight: '700',
        fontSize: FONT_SIZES.md,
        marginBottom: SPACING.md,
    },
});

