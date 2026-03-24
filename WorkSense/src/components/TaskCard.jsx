import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

const PRIORITY_COLORS = {
    low: COLORS.success,
    medium: COLORS.warning,
    high: '#f77f00',
    urgent: COLORS.error,
};

const STATUS_COLORS = {
    pending: COLORS.textSecondary,
    in_progress: COLORS.primary,
    completed: COLORS.success,
    cancelled: COLORS.error,
};

/**
 * Card that displays a single task's summary.
 *
 * Props: task { id, title, description, priority, status, due_date, assigned_to_name }
 */
export default function TaskCard({ task }) {
    const priorityColor = PRIORITY_COLORS[task.priority] ?? COLORS.textSecondary;
    const statusColor = STATUS_COLORS[task.status] ?? COLORS.textSecondary;

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title} numberOfLines={1}>
                    {task.title}
                </Text>
                <View style={[styles.badge, { backgroundColor: priorityColor }]}>
                    <Text style={styles.badgeText}>{task.priority.toUpperCase()}</Text>
                </View>
            </View>

            {!!task.description && (
                <Text style={styles.description} numberOfLines={2}>
                    {task.description}
                </Text>
            )}

            <View style={styles.footer}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>
                    {task.status.replace('_', ' ')}
                </Text>
                {!!task.due_date && (
                    <Text style={styles.due}>
                        Due: {new Date(task.due_date).toLocaleDateString()}
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
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
