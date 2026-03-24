import apiClient from '../constants/api';

/**
 * Push a vehicle location update to the backend.
 */
export async function pushVehicleLocation(vehicleId, latitude, longitude, speedKmh = null, heading = null) {
    const response = await apiClient.post('/vehicle-locations/', {
        vehicle: vehicleId,
        latitude,
        longitude,
        speed_kmh: speedKmh,
        heading,
    });
    return response.data;
}

/**
 * Fetch the latest known locations for all active vehicles (for the live map).
 */
export async function fetchVehicles() {
    const response = await apiClient.get('/vehicles/');
    return response.data;
}

/**
 * Push a sensor reading from an IoT device.
 */
export async function pushSensorReading(deviceId, metric, value, unit = '', lat = null, lng = null) {
    const response = await apiClient.post('/sensor-readings/', {
        device: deviceId,
        metric,
        value,
        unit,
        latitude: lat,
        longitude: lng,
    });
    return response.data;
}
