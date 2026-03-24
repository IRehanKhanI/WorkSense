<<<<<<< HEAD
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, FlatList, TouchableOpacity } from 'react-native';
import { fetchVehicles } from '../../src/services/locationApi';
import MapMarker from '../../src/components/MapMarker';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../../src/constants/theme';

/**
 * Live map screen showing vehicles and their latest GPS positions.
 * Uses a simple list view since react-native-maps requires native build;
 * swap the <VehicleList> for a <MapView> when running a development build.
 */
export default function LiveMapScreen() {
    const [vehicles, setVehicles] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadVehicles();
        const interval = setInterval(loadVehicles, 15000);
        return () => clearInterval(interval);
    }, []);

    async function loadVehicles() {
        try {
            const data = await fetchVehicles();
            setVehicles(data.results ?? data);
        } catch {
            Alert.alert('Error', 'Failed to fetch vehicle locations.');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={COLORS.primary} size="large" />
                <Text style={styles.loadingText}>Loading vehicle data…</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Live Map</Text>
            <Text style={styles.sub}>
                {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} tracked · refreshes every 15 s
            </Text>

            <FlatList
                data={vehicles}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => {
                    const loc = item.latest_location;
                    const isSelected = selected?.id === item.id;
                    return (
                        <TouchableOpacity
                            style={[styles.row, isSelected && styles.rowSelected]}
                            onPress={() => setSelected(isSelected ? null : item)}
                            activeOpacity={0.8}
                        >
                            <MapMarker
                                label={item.registration}
                                type="vehicle"
                                selected={isSelected}
                            />
                            <View style={styles.info}>
                                <Text style={styles.reg}>{item.registration}</Text>
                                <Text style={styles.detail}>
                                    {item.make} {item.model}
                                    {item.assigned_driver_name
                                        ? `  •  Driver: ${item.assigned_driver_name}`
                                        : '  •  Unassigned'}
                                </Text>
                                {loc ? (
                                    <Text style={styles.coords}>
                                        {Number(loc.latitude).toFixed(5)},{'  '}
                                        {Number(loc.longitude).toFixed(5)}
                                        {loc.speed_kmh != null
                                            ? `  •  ${Number(loc.speed_kmh).toFixed(1)} km/h`
                                            : ''}
                                    </Text>
                                ) : (
                                    <Text style={styles.noLoc}>No location data</Text>
                                )}
                            </View>
                            <View style={[styles.statusDot, {
                                backgroundColor:
                                    item.status === 'active' ? COLORS.success :
                                    item.status === 'idle' ? COLORS.warning :
                                    COLORS.error,
                            }]} />
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <Text style={styles.empty}>No vehicles registered yet.</Text>
                }
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.md },
    center: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: COLORS.textSecondary, marginTop: SPACING.sm },
    heading: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: '900',
        color: COLORS.text,
        paddingTop: SPACING.xl,
        marginBottom: SPACING.xs,
    },
    sub: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: SPACING.md },
    list: { paddingBottom: SPACING.xxl },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        gap: SPACING.sm,
    },
    rowSelected: { borderWidth: 1, borderColor: COLORS.primary },
    info: { flex: 1 },
    reg: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text },
    detail: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
    coords: { fontSize: FONT_SIZES.xs, color: COLORS.primary, marginTop: 2 },
    noLoc: { fontSize: FONT_SIZES.xs, color: COLORS.error, marginTop: 2 },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xxl },
});
=======
import { View, Text } from 'react-native';

export default function LiveMap() {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Live Map</Text>
        </View>
    );
}
>>>>>>> copilot/vscode-mn4q5as7-92i0
