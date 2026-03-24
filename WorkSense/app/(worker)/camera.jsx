import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import CustomButton from '../../src/components/CustomButton';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../../src/constants/theme';

export default function CameraScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [capturing, setCapturing] = useState(false);
    const [photoUri, setPhotoUri] = useState(null);
    const cameraRef = useRef(null);

    if (!permission) {
        return <LinearGradient colors={['#2C3E50', '#1A252F']} style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <LinearGradient colors={['#2C3E50', '#1A252F']} style={styles.container}>
                <Text style={styles.message}>Camera access is needed for selfie verification.</Text>
                <CustomButton title="Grant Permission" onPress={requestPermission} />
            </LinearGradient>
        );
    }

    async function takeSelfie() {
        if (!cameraRef.current) return;
        setCapturing(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
            setPhotoUri(photo.uri);
            Alert.alert(
                'Photo Captured',
                'Selfie recorded for attendance verification.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (err) {
            Alert.alert('Error', 'Could not capture photo: ' + err.message);
        } finally {
            setCapturing(false);
        }
    }

    return (
        <LinearGradient colors={['#2C3E50', '#1A252F']} style={styles.container}>
            <CameraView style={styles.camera} facing="front" ref={cameraRef}>
                <View style={styles.overlay}>
                    <BlurView intensity={30} tint="dark" style={styles.hintContainer} overflow="hidden">
                        <Text style={styles.hint}>Position your face in the frame</Text>
                    </BlurView>
                    <View style={styles.faceGuide} />
                    <CustomButton
                        title={capturing ? 'Capturing…' : 'Take Selfie'}
                        onPress={takeSelfie}
                        loading={capturing}
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
        justifyContent: 'center',
        padding: SPACING.md,
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
        marginBottom: SPACING.lg,
    },
    hint: {
        color: COLORS.white,
        fontSize: FONT_SIZES.sm,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
    },
    faceGuide: {
        width: 200,
        height: 240,
        borderWidth: 2,
        borderColor: COLORS.secondary,
        borderRadius: 100,
        marginBottom: SPACING.xl,
    },
    snapBtn: { width: 200 },
    cancelBtn: { width: 200 },
    message: {
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: SPACING.lg,
        fontSize: FONT_SIZES.md,
    },
});
