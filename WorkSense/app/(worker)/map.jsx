import { View, StyleSheet } from "react-native";
import MapView from "react-native-maps";
import { useEffect, useState } from "react";
import * as Location from "expo-location";
import MapMarker from "../../src/components/MapMarker";

export default function MapScreen() {
    const [location, setLocation] = useState(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;

            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc.coords);

            Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, timeInterval: 3000 },
                (loc) => {
                    setLocation(loc.coords);
                }
            );
        })();
    }, []);

    return (
        <View style={styles.container}>
            <MapView style={styles.map}>
                {location && <MapMarker location={location} />}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
});
