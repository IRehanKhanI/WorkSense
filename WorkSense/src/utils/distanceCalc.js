const EARTH_RADIUS_M = 6371000;

function toRad(deg) {
    return (deg * Math.PI) / 180;
}

/**
 * Haversine formula – returns distance in metres between two GPS coordinates.
 *
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} distance in metres
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

/**
 * Returns true if the given coordinate is within radiusMetres of the centre.
 */
export function isWithinGeofence(lat, lng, centreLat, centreLng, radiusMetres) {
    return haversineDistance(lat, lng, centreLat, centreLng) <= radiusMetres;
}
