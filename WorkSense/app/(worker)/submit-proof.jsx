import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CustomButton from '../../src/components/CustomButton';
import { BASE_URL } from '../../src/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useLocationTracking from '../../src/hooks/useLocationTracking';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../../src/constants/theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function SubmitProofScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const taskId = params.taskId;
    const proofType = params.proofType || 'BEFORE';

    const [permission, requestPermission] = useCameraPermissions();
    const { location, errorMsg } = useLocationTracking();

    // 'front' for selfie, 'back' for work photo, 'uploading' for finalizing
    const [step, setStep] = useState('front');
    const [selfieUri, setSelfieUri] = useState(null);
    const [workUri, setWorkUri] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [locationMessage, setLocationMessage] = useState('Getting GPS location...');

    const cameraRef = useRef(null);

    if (!permission) {
        return (
            <LinearGradient
                colors={[COLORS.background, COLORS.cardBg]}
                style={styles.container}
            />
        );
    }

    if (!permission.granted) {
        return (
            <LinearGradient
                colors={[COLORS.background, COLORS.cardBg]}
                style={styles.container}
            >
                <BlurView intensity={30} tint="dark" style={styles.permissionCard}>
                    <Text style={styles.message}>Camera access is needed to submit proofs.</Text>
                    <CustomButton title="Grant Permission" onPress={requestPermission} />
                </BlurView>
            </LinearGradient>
        );
    }

    async function takePhoto() {
        if (!cameraRef.current) return;
        setProcessing(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
            if (step === 'front') {
                setSelfieUri(photo.uri);
                setStep('back');
            } else if (step === 'back') {
                setWorkUri(photo.uri);
                setStep('uploading');
                await uploadProofs(selfieUri, photo.uri);
            }
        } catch (err) {
            Alert.alert('Error', 'Could not capture photo: ' + err.message);
        } finally {
            setProcessing(false);
        }
    }

    async function uploadProofs(selfie, workPhoto) {
        if (!location) {
            // Location might still be loading, give it 5 more seconds
            setLocationMessage('Waiting for GPS...');
            await new Promise(resolve => setTimeout(resolve, 5000));

            if (!location) {
                // Still no location, but allow upload with 0,0 coordinates
                setLocationMessage('Using default location (no GPS)');
                console.warn('Location not available, using default coordinates');
            }
        }

        const gpsLat = location?.coords?.latitude || 0;
        const gpsLon = location?.coords?.longitude || 0;

        try {
            const formData = new FormData();
            formData.append('task_id', taskId);
            formData.append('proof_type', proofType);
            formData.append('gps_lat', String(gpsLat));
            formData.append('gps_lon', String(gpsLon));

            // Append back camera photo (Work)
            formData.append('image', {
                uri: workPhoto,
                name: `work_${Date.now()}.jpg`,
                type: 'image/jpeg',
            });

            // Append front camera photo (Selfie)
            formData.append('worker_selfie', {
                uri: selfie,
                name: `selfie_${Date.now()}.jpg`,
                type: 'image/jpeg',
            });

            const token = await AsyncStorage.getItem('access_token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Token ${token}`;
            }

            const response = await fetch(`${BASE_URL}/proofs/upload/`, {
                method: 'POST',
                headers: headers,
                body: formData,
            });

            const responseData = await response.json();
            console.log('Upload response:', responseData);;

            if (!response.ok) {
                throw new Error(JSON.stringify(responseData));
            }

            // If it was the AFTER proof, we might get an AI verification response
            if (responseData.verification) {
                const { verification_status, recommendation_message } = responseData.verification;
                if (verification_status === 'verified_clean') {
                    Alert.alert('Success!', 'Task verified successfully by AI.', [{ text: 'OK', onPress: () => router.back() }]);
                } else {
                    Alert.alert('Verification Failed', recommendation_message || 'Task is incomplete.', [{ text: 'OK', onPress: () => router.back() }]);
                }
            } else {
                Alert.alert('Success', `${proofType} proof uploaded successfully.`, [{ text: 'OK', onPress: () => router.back() }]);
            }

        } catch (error) {
            console.error('Upload Error:', error);
            Alert.alert('Error', error.message || 'Failed to upload proofs.');
            setStep('back');
        }
    }

    if (step === 'uploading') {
        return (
            <LinearGradient
                colors={[COLORS.background, COLORS.cardBg]}
                style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}
            >
                <BlurView intensity={30} tint="dark" style={styles.permissionCard}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={[styles.message, { marginTop: SPACING.md }]}>Uploading {proofType} proofs{proofType === 'AFTER' ? ' & running AI verification...' : '...'}</Text>
                    <Text style={[styles.message, { marginTop: SPACING.sm, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary }]}>{locationMessage}</Text>
                </BlurView>
            </LinearGradient>
        );
    }

    const isFront = step === 'front';
    const hasLocationLock = location && location.coords;

    return (
        <LinearGradient
            colors={[COLORS.background, COLORS.cardBg]}
            style={styles.container}
        >
            <CameraView
                style={styles.camera}
                facing={isFront ? 'front' : 'back'}
                ref={cameraRef}
            >
                <View style={styles.overlay}>
                    <BlurView intensity={30} tint="dark" style={styles.hintContainer}>
                        <Text style={styles.hintText}>
                            {isFront ? 'Step 1: Take a Selfie for verification' : `Step 2: Capture work area (${proofType})`}
                        </Text>
                        <Text style={[styles.hintText, { fontSize: FONT_SIZES.xs, marginTop: SPACING.xs, color: hasLocationLock ? COLORS.success : COLORS.warning }]}>
                            GPS: {hasLocationLock ? '✓ Locked' : '⟳ Acquiring...'}
                        </Text>
                    </BlurView>
                    {isFront && <View style={styles.faceGuide} />}
                    <CustomButton
                        title={processing ? 'Processing…' : `Capture ${isFront ? 'Selfie' : 'Work'}`}
                        onPress={takePhoto}
                        loading={processing}
                        style={styles.snapBtn}
                    />
                    <CustomButton
                        title="Cancel"
                        onPress={() => router.back()}
                        variant="danger"
                        style={styles.cancelBtn}
                    />
                </View>
            </CameraView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: SPACING.md,
    },
    permissionCard: {
        padding: SPACING.xl,
        borderRadius: RADIUS.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
    },
    camera: { flex: 1, borderRadius: RADIUS.lg, overflow: 'hidden' },
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: SPACING.xxl,
        gap: SPACING.sm,
    },
    hintContainer: {
        borderRadius: RADIUS.full,
        overflow: 'hidden',
        marginBottom: SPACING.lg,
    },
    hintText: {
        color: COLORS.white,
        fontSize: FONT_SIZES.sm,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.sm,
        textAlign: 'center',
    },
    faceGuide: {
        width: 200,
        height: 240,
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderRadius: 100,
        marginBottom: SPACING.xl,
    },
    snapBtn: { width: 200 },
    cancelBtn: { width: 200 },
    message: {
        color: COLORS.text,
        textAlign: 'center',
        marginTop: SPACING.lg,
        fontSize: FONT_SIZES.md,
    },
});