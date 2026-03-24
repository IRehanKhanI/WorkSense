import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../constants/theme';

/**
 * Custom map marker bubble used on the admin live-map.
 *
 * Props:
 *   label    – text to show inside the marker
 *   type     – 'worker' | 'vehicle' (controls colour)
 *   selected – highlights the marker
 */
export default function MapMarker({ label, type = 'worker', selected = false }) {
    const bg = type === 'vehicle' ? COLORS.secondary : COLORS.primary;

    return (
        <View style={[styles.bubble, { backgroundColor: bg }, selected && styles.selected]}>
            <Text style={styles.label} numberOfLines={1}>
                {label}
            </Text>
            <View style={[styles.pointer, { borderTopColor: bg }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    bubble: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.sm,
        maxWidth: 120,
        alignItems: 'center',
    },
    label: {
        color: COLORS.white,
        fontSize: FONT_SIZES.xs,
        fontWeight: '700',
    },
    pointer: {
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        alignSelf: 'center',
        marginTop: -1,
    },
    selected: {
        borderWidth: 2,
        borderColor: COLORS.white,
    },
});
