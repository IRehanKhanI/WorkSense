import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

const PRIORITY_COLORS = {
    low: COLORS.success,
    medium: COLORS.warning,
    high: COLORS.secondary,
    urgent: COLORS.error,
};

const STATUS_COLORS = {
    pending: COLORS.textSecondary,
    in_progress: COLORS.secondary,
    completed: COLORS.success,
    cancelled: COLORS.error,
};

/**
 * Card that displays a single task's summary.
 *
 * Props: task { id, title, description, priority, status, due_date, assigned_to_name }
 */
export default function TaskCard({ task }) {
    const router = useRouter();
    const priorityColor = PRIORITY_COLORS[task?.priority] ?? COLORS.textSecondary;
    const statusColor = STATUS_COLORS[task?.status] ?? COLORS.textSecondary;

    const handleProof = (type) => {
        router.push({
            pathname: '/(worker)/submit-proof',
            params: { taskId: task.task_id, proofType: type }
        });
    };

    return (
        <BlurView intensity={30} tint="dark" style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title} numberOfLines={1}>
                    {task?.task_type ?? 'Untitled Task'} - {task?.task_id}
                </Text>
                <View style={[styles.badge, { backgroundColor: priorityColor }]}>
                    <Text style={styles.badgeText}>{String(task?.priority || 'NONE').toUpperCase()}</Text>
                </View>
            </View>

            {!!task?.description && (
                <Text style={styles.description} numberOfLines={2}>
                    {task.description}
                </Text>
            )}

            <View style={styles.footer}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {String(task?.status || 'Unknown').replace(/_/g, ' ')}
                    </Text>
                </View>
                {task?.status === 'PENDING' && (
                    <TouchableOpacity style={styles.proofBtn} onPress={() => handleProof('BEFORE')}>
                        <Text style={styles.proofBtnText}>Before Proof</Text>
                    </TouchableOpacity>
                )}
                {task?.status === 'IN_PROGRESS' && (
                    <TouchableOpacity style={styles.proofBtn} onPress={() => handleProof('AFTER')}>
                        <Text style={styles.proofBtnText}>After Proof</Text>
                    </TouchableOpacity>
                )}
                {!!task?.due_date && (
                    <Text style={styles.due}>
                        Due: {new Date(task.due_date).toLocaleDateString()}
                    </Text>
                )}
            </View>
        </BlurView>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderLeftWidth: 4,
        borderLeftColor: '#8B5CF6',
        borderColor: 'rgba(148, 163, 184, 0.1)',
        borderWidth: 1,
        overflow: 'hidden'
    },
    proofBtn: {
        backgroundColor: '#8B5CF6',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: RADIUS.sm,
        marginLeft: 'auto',
    },
    proofBtnText: {
        color: COLORS.white,
        fontSize: FONT_SIZES.xs,
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    title: {
        flex: 1,
        fontSize: FONT_SIZES.md,
        fontWeight: '700',
        color: COLORS.text,
        marginRight: SPACING.sm,
    },
    badge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: RADIUS.full,
    },
    badgeText: {
        fontSize: FONT_SIZES.xs,
        fontWeight: '800',
        color: COLORS.white,
    },
    description: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: RADIUS.full,
    },
    statusText: {
        fontSize: FONT_SIZES.sm,
        textTransform: 'capitalize',
        flex: 1,
    },
    due: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
    },
});
