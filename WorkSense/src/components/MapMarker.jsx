import { Marker } from "react-native-maps";

export default function MapMarker({ location }) {
    return (
        <Marker
            coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
            }}
            title="Worker"
            description="Live Location"
            pinColor="blue"
        />
    );
}
