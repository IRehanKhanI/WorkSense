import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

/**
 * Reusable button component.
 *
 * Props:
 *   title       – button label
 *   onPress     – callback
 *   variant     – 'primary' | 'secondary' | 'danger'  (default: 'primary')
 *   loading     – show spinner
 *   disabled    – disable interaction
 *   style       – extra ViewStyle overrides
 */
export default function CustomButton({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
}) {
    const bg =
        variant === 'secondary'
            ? COLORS.secondary
            : variant === 'danger'
            ? COLORS.error
            : COLORS.primary;

    return (
        <TouchableOpacity
            style={[styles.btn, { backgroundColor: bg }, disabled && styles.disabled, style]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={COLORS.white} />
            ) : (
                <Text style={styles.label}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    btn: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        color: COLORS.white,
        fontSize: FONT_SIZES.md,
        fontWeight: '700',
    },
    disabled: {
        opacity: 0.45,
    },
});
