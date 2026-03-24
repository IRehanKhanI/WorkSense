import { useState, useEffect } from 'react';

// Optional imports: Only work in native builds, will fail in Expo Go
let JailMonkey = null;
let useIsVpnActive = () => false;

try {
    JailMonkey = require('jail-monkey').default;
    const vpnDetector = require('react-native-vpn-detector');
    useIsVpnActive = vpnDetector.useIsVpnActive || (() => false);
} catch (e) {
    console.warn("Security native modules not found (likely running in Expo Go). Bypassing security checks.");
}

export function useSecurityCheck() {
    const [isSecure, setIsSecure] = useState(true);
    const [securityIssues, setSecurityIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Call the original or fallback hook unconditionally
    const isVpnActive = useIsVpnActive();

    useEffect(() => {
        let mounted = true;

        const performChecks = async () => {
            if (!JailMonkey) {
                if (mounted) setLoading(false);
                return; // End early for Expo Go
            }
            try {
                const issues = [];

                // 1. Check VPN
                if (isVpnActive) {
                    issues.push('Active VPN connection detected.');
                }

                // 2. Check Mock Locations
                if (JailMonkey.canMockLocation()) {
                    issues.push('Mock Location is enabled.');
                }

                // 3. Check ADB/Developer Mode
                if (JailMonkey.AdbEnabled()) {
                    issues.push('USB Debugging (ADB) is enabled.');
                }

                // 4. Check Development Settings (Android only)
                try {
                    const isDevMode = await JailMonkey.isDevelopmentSettingsMode();
                    if (isDevMode) {
                        issues.push('Developer Mode is enabled.');
                    }
                } catch (e) {
                    // Ignore error if not supported
                }

                // 5. Check if Debugged
                try {
                    const isDebugged = await JailMonkey.isDebuggedMode();
                    if (isDebugged) {
                        issues.push('App is running in Debug Mode.');
                    }
                } catch (e) {
                    // Ignore error
                }

                // Check general jailbreak / root
                if (JailMonkey.isJailBroken()) {
                    issues.push('Device is rooted or jailbroken.');
                }

                if (mounted) {
                    if (issues.length > 0) {
                        setSecurityIssues(issues);
                        setIsSecure(false);
                    } else {
                        setSecurityIssues([]);
                        setIsSecure(true);
                    }
                    setLoading(false);
                }
            } catch (error) {
                console.error("Security check error:", error);
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        performChecks();
    }, [isVpnActive]);

    return { isSecure, securityIssues, loading };
}