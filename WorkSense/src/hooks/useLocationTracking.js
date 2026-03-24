import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';

/**
 * Hook that requests foreground location permission and returns the
 * latest position.  Re-runs whenever the component mounts.
 *
 * @param {number} intervalMs  How often to refresh the position (ms). Default 15 000.
 * @returns {{ location: object|null, errorMsg: string|null, loading: boolean }}
 */
export default function useLocationTracking(intervalMs = 15000) {
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [loading, setLoading] = useState(true);
    const intervalRef = useRef(null);

    useEffect(() => {
        let active = true;

        async function requestAndFetch() {
            setLoading(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                if (active) setErrorMsg('Location permission denied.');
                if (active) setLoading(false);
                return;
            }
            try {
                const pos = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });
                if (active) setLocation(pos);
            } catch (e) {
                if (active) setErrorMsg(e.message);
            } finally {
                if (active) setLoading(false);
            }
        }

        requestAndFetch();
        intervalRef.current = setInterval(requestAndFetch, intervalMs);

        return () => {
            active = false;
            clearInterval(intervalRef.current);
        };
    }, [intervalMs]);

    return { location, errorMsg, loading };
}
