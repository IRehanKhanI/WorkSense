import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
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
            ? 'rgba(255, 20, 147, 0.4)' // transparent accent
            : variant === 'danger'
                ? 'rgba(255, 20, 147, 0.5)' // transparent error
                : 'rgba(255, 255, 255, 0.25)'; // standard glass primary

    return (
        <TouchableOpacity
            style={[styles.container, disabled && styles.disabled, style]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            <BlurView intensity={40} tint="light" style={[styles.btn, { backgroundColor: bg }]}>
                {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                ) : (
                    <Text style={styles.label}>{title}</Text>
                )}
            </BlurView>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: RADIUS.md,
        overflow: 'hidden',
    },
    btn: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
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
