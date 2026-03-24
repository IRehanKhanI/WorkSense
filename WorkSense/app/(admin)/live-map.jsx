import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, FlatList, TouchableOpacity } from 'react-native';
import MapView, { Marker, Heatmap } from 'react-native-maps';
import { fetchVehicles } from '../../src/services/locationApi';
import MapMarker from '../../src/components/MapMarker';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../../src/constants/theme';

const MOCK_GARBAGE_LOCATIONS = [
    { latitude: 15.5927, longitude: 73.8105, weight: 1 },
    { latitude: 15.5937, longitude: 73.8115, weight: 2 },
    { latitude: 15.5947, longitude: 73.8105, weight: 5 },
    { latitude: 15.5957, longitude: 73.8095, weight: 3 },
    { latitude: 15.5937, longitude: 73.8125, weight: 4 },
];

const TRUCK_ROUTE = [
    { latitude: 15.5910, longitude: 73.8100 },
    { latitude: 15.5920, longitude: 73.8110 },
    { latitude: 15.5930, longitude: 73.8120 },
    { latitude: 15.5945, longitude: 73.8105 },
    { latitude: 15.5960, longitude: 73.8090 },
    { latitude: 15.5950, longitude: 73.8080 },
];

/**
 * Live map screen showing vehicles and their latest GPS positions.
 * Uses react-native-maps to show a heatmap of garbage locations and live truck markers.
 */
export default function LiveMapScreen() {
    const [vehicles, setVehicles] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const wsRef = useRef(null);

    useEffect(() => {
        loadVehicles();

        let routeIndex = 0;
        const simulationInterval = setInterval(() => {
            setVehicles(prev => {
                const updated = [...prev];
                const simLoc = TRUCK_ROUTE[routeIndex % TRUCK_ROUTE.length];
                
                if (updated.length === 0) {
                    updated.push({
                        id: 'dummy-1',
                        registration: 'DUMP-99',
                        type: 'vehicle',
                        make: 'Dummy',
                        model: 'Garbage Truck',
                        latest_location: {
                            latitude: simLoc.latitude,
                            longitude: simLoc.longitude,
                            speed_kmh: 15.5
                        },
                        status: 'active'
                    });
                } else {
                    const dummyIndex = updated.findIndex(v => v.id === 'dummy-1');
                    if (dummyIndex !== -1) {
                        updated[dummyIndex] = {
                            ...updated[dummyIndex],
                            latest_location: {
                                latitude: simLoc.latitude,
                                longitude: simLoc.longitude,
                                speed_kmh: 15.5
                            },
                            status: 'active'
                        };
                    } else {
                        // Simulate movement for the first vehicle if no dummy exists
                        updated[0] = {
                            ...updated[0],
                            latest_location: {
                                latitude: simLoc.latitude,
                                longitude: simLoc.longitude,
                                speed_kmh: 15.5
                            },
                            status: 'active'
                        };
                    }
                }
                
                routeIndex++;
                return updated;
            });
        }, 3000);

        // Connect to WebSocket
        const ws = new WebSocket('ws://10.0.2.2:8000/ws/live-tracking/');
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connection opened');
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'location_update' || message.vehicle_id) {
                    setVehicles((prev) => {
                        return prev.map((v) => {
                            if (v.id === message.vehicle_id) {
                                return {
                                    ...v,
                                    latest_location: {
                                        latitude: message.latitude,
                                        longitude: message.longitude,
                                        speed_kmh: message.speed_kmh,
                                    },
                                    status: 'active'
                                };
                            }
                            return v;
                        });
                    });
                }
            } catch (err) {
                console.error('Error parsing WebSocket message', err);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket closed');
        };

        return () => {
            clearInterval(simulationInterval);
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
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

    const defaultRegion = {
        latitude: vehicles[0]?.latest_location?.latitude || 15.5937,
        longitude: vehicles[0]?.latest_location?.longitude || 73.8105,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Live Map</Text>
            <Text style={styles.sub}>
                {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} tracked live
            </Text>

            <View style={styles.mapContainer}>
                <MapView
                    style={styles.map}
                    initialRegion={defaultRegion}
                >
                    {/* Heatmap for garbage locations */}
                    <Heatmap
                        points={MOCK_GARBAGE_LOCATIONS}
                        radius={40}
                        opacity={0.7}
                        gradient={{
                            colors: ['#00000000', '#0000FFFF', '#00FF00FF', '#FF0000FF'],
                            startPoints: [0, 0.2, 0.5, 1],
                            colorMapSize: 256
                        }}
                    />

                    {/* Live markers for vehicles */}
                    {vehicles.map((v) => {
                        if (!v.latest_location) return null;
                        return (
                            <Marker
                                key={v.id}
                                coordinate={{
                                    latitude: Number(v.latest_location.latitude),
                                    longitude: Number(v.latest_location.longitude)
                                }}
                                title={v.registration}
                                description={`${v.make || ''} ${v.model || ''} - ${Number(v.latest_location.speed_kmh || 0).toFixed(1)} km/h`}
                                pinColor={v.status === 'active' ? COLORS.success : COLORS.warning}
                            />
                        );
                    })}
                </MapView>
            </View>

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
    container: { flex: 1, backgroundColor: 'transparent', padding: SPACING.md },
    center: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: COLORS.textSecondary, marginTop: SPACING.sm },
    heading: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: '900',
        color: COLORS.text,
        paddingTop: SPACING.xl,
        marginBottom: SPACING.xs,
    },
    sub: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: SPACING.xs },
    mapContainer: {
        height: 250,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.surface,
    },
    map: { flex: 1 },
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
