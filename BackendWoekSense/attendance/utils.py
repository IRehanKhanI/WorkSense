from geopy.distance import geodesic

def is_within_geofence(user_lat, user_lon, zone_center_lat, zone_center_lon, radius_km):
    """
    Check if user's GPS coordinates are within the zone's geofence
    
    Args:
        user_lat, user_lon: User's current coordinates
        zone_center_lat, zone_center_lon: Zone center coordinates
        radius_km: Zone radius in kilometers
    
    Returns:
        bool: True if within geofence
    """
    user_coords = (user_lat, user_lon)
    zone_coords = (zone_center_lat, zone_center_lon)
    distance_km = geodesic(user_coords, zone_coords).kilometers
    return distance_km <= radius_km


def validate_clock_in(user, lat, lon, vpn_flag, dev_mode_flag, assigned_zone=None):
    """
    Comprehensive validation for clock-in
    
    Args:
        user: Django User object
        lat, lon: GPS coordinates
        vpn_flag: Boolean indicating if VPN detected
        dev_mode_flag: Boolean indicating if dev mode detected
        assigned_zone: WorkZone object (optional)
    
    Returns:
        dict: {
            'is_valid': bool,
            'status': 'ACCEPTED' or 'REJECTED',
            'is_within_geofence': bool,
            'vpn_detected': bool,
            'dev_mode_detected': bool,
            'rejection_reason': str or None
        }
    """
    result = {
        'is_valid': True,
        'status': 'ACCEPTED',
        'is_within_geofence': True,
        'vpn_detected': vpn_flag,
        'dev_mode_detected': dev_mode_flag,
        'rejection_reason': None
    }
    
    # Check for VPN
    if vpn_flag:
        result['is_valid'] = False
        result['status'] = 'REJECTED'
        result['rejection_reason'] = 'VPN detected. Please disable VPN.'
        return result
    
    # Check for dev mode
    if dev_mode_flag:
        result['is_valid'] = False
        result['status'] = 'REJECTED'
        result['rejection_reason'] = 'Developer mode detected. Please disable it.'
        return result
    
    # Check geofence
    if assigned_zone:
        if not assigned_zone.is_within_zone(lat, lon):
            result['is_valid'] = False
            result['is_within_geofence'] = False
            result['status'] = 'REJECTED'
            result['rejection_reason'] = f'Outside assigned work zone. Distance: {get_distance_from_zone(lat, lon, assigned_zone)}'
            return result
    
    return result


def get_distance_from_zone(lat, lon, zone):
    """Get distance from coordinates to zone center in km"""
    user_coords = (lat, lon)
    zone_coords = (zone.center_lat, zone.center_lon)
    distance_km = geodesic(user_coords, zone_coords).kilometers
    return f"{distance_km:.2f}km"
