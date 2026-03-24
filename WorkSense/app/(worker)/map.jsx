import { View, StyleSheet } from "react-native";
import MapView, { Heatmap, Marker } from "react-native-maps";
import { useEffect, useState, useRef } from "react";
import * as Location from "expo-location";
import { COLORS } from '../../src/constants/theme';

const MOCK_GARBAGE_LOCATIONS = [
    { latitude: 15.5927, longitude: 73.8105, weight: 1 },
    { latitude: 15.5937, longitude: 73.8115, weight: 3 },
    { latitude: 15.5947, longitude: 73.8105, weight: 5 },
    { latitude: 15.5957, longitude: 73.8095, weight: 4 },
    { latitude: 15.5937, longitude: 73.8125, weight: 2 },
];

const TRUCK_ROUTE = [
    { latitude: 15.5910, longitude: 73.8100 },
    { latitude: 15.5920, longitude: 73.8110 },
    { latitude: 15.5930, longitude: 73.8120 },
    { latitude: 15.5945, longitude: 73.8105 },
    { latitude: 15.5960, longitude: 73.8090 },
    { latitude: 15.5950, longitude: 73.8080 },
];

export default function MapScreen() {
    const [location, setLocation] = useState(null);
    const [truckLocations, setTruckLocations] = useState({});
    const wsRef = useRef(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;

            // Optional: comment out dynamic location if you want to mock being in Mapusa
            // let loc = await Location.getCurrentPositionAsync({});
            // setLocation(loc.coords);
            
            // Setting user location mock to Mapusa
            setLocation({ latitude: 15.5940, longitude: 73.8110 });

            Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, timeInterval: 3000 },
                (loc) => {
                    // Update user location dynamically (if they are in mapusa)
                    // setLocation(loc.coords);
                }
            );
        })();

        // Mock Live Truck Data Loop
        let routeIndex = 0;
        const simulationInterval = setInterval(() => {
            const simLoc = TRUCK_ROUTE[routeIndex % TRUCK_ROUTE.length];
            setTruckLocations(prev => ({
                ...prev,
                'dummy-truck': {
                    id: 'dummy-truck',
                    latitude: simLoc.latitude,
                    longitude: simLoc.longitude,
                    speed_kmh: 15.5
                }
            }));
            routeIndex++;
        }, 3000);

        // Connect to WebSocket for Actual Live Data
        const ws = new WebSocket('ws://10.0.2.2:8000/ws/live-tracking/');
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'location_update' || message.vehicle_id) {
                    setTruckLocations(prev => ({
                        ...prev,
                        [message.vehicle_id]: {
                            id: message.vehicle_id,
                            latitude: message.latitude,
                            longitude: message.longitude,
                            speed_kmh: message.speed_kmh
                        }
                    }));
                }
            } catch (err) {
                console.error(err);
            }
        };

        return () => {
            clearInterval(simulationInterval);
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const defaultRegion = {
        latitude: 15.5937,
        longitude: 73.8105,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
    };

    return (
        <View style={styles.container}>
            <MapView 
                style={styles.map}
                initialRegion={defaultRegion}
                showsUserLocation={true}
            >
                {/* Heatmap showing high garbage/citizen-complaint zones */}
                <Heatmap
                    points={MOCK_GARBAGE_LOCATIONS}
                    radius={50}
                    opacity={0.7}
                    gradient={{
                        colors: ['#00000000', '#0000FFFF', '#00FF00FF', '#FF0000FF'],
                        startPoints: [0, 0.2, 0.5, 1],
                        colorMapSize: 256
                    }}
                />

                {/* Worker's own location pin (if they aren't using showsUserLocation)*/}
                {location && (
                    <Marker
                        coordinate={{
                            latitude: location.latitude,
                            longitude: location.longitude
                        }}
                        title="You"
                        description="Your current location"
                        pinColor="blue"
                    />
                )}

                {/* Live Garbage Truck Locations */}
                {Object.values(truckLocations).map((truck) => (
                    <Marker
                        key={truck.id}
                        coordinate={{
                            latitude: Number(truck.latitude),
                            longitude: Number(truck.longitude)
                        }}
                        title={`Garbage Truck ${truck.id === 'dummy-truck' ? '(Test)' : ''}`}
                        description={truck.speed_kmh ? `${Number(truck.speed_kmh).toFixed(1)} km/h` : ''}
                        pinColor="green"
                    />
                ))}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
});
