import { useState, useRef } from 'react';
import {
    View, Text, TouchableOpacity, Image, ScrollView,
    TextInput, ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FontAwesome5 } from '@expo/vector-icons';
import { uploadBeforeImage, uploadAfterImageAndVerify } from '../../src/services/taskApi';

const COLORS = {
    inkBlack: '#011627',
    seaweed: '#419d78',
    mustard: '#fed766',
    alertRed: '#e84855',
    lightGlass: 'rgba(255,255,255,0.1)',
    white: '#ffffff',
};

const STEP = {
    SETUP: 'SETUP',
    BEFORE_PREVIEW: 'BEFORE_PREVIEW',
    AFTER_CAMERA: 'AFTER_CAMERA',
    AFTER_PREVIEW: 'AFTER_PREVIEW',
    RESULT: 'RESULT',
};

export default function Camera() {
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef(null);

    // Form state
    const [taskId, setTaskId] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');

    // Workflow state
    const [step, setStep] = useState(STEP.SETUP);
    const [showCamera, setShowCamera] = useState(false);
    const [captureMode, setCaptureMode] = useState('BEFORE'); // 'BEFORE' | 'AFTER'

    // Image URIs
    const [beforeUri, setBeforeUri] = useState(null);
    const [afterUri, setAfterUri] = useState(null);

    // Results
    const [verificationResult, setVerificationResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Auth token – replace with your auth store integration
    const authToken = null; // TODO: retrieve from your auth context / AsyncStorage

    if (!permission) {
        return (
            <View style={styles.centered}>
                <Text style={styles.bodyText}>Checking camera permissions…</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.centered}>
                <FontAwesome5 name="camera-slash" size={48} color={COLORS.mustard} style={{ marginBottom: 16 }} />
                <Text style={[styles.bodyText, { textAlign: 'center', marginBottom: 16 }]}>
                    Camera access is required to capture work evidence.
                </Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
                    <Text style={styles.primaryBtnText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Camera capture ────────────────────────────────────────────────────────

    const openCamera = (mode) => {
        setCaptureMode(mode);
        setShowCamera(true);
    };

    const capturePhoto = async () => {
        if (!cameraRef.current) return;
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
            setShowCamera(false);
            if (captureMode === 'BEFORE') {
                setBeforeUri(photo.uri);
                setStep(STEP.BEFORE_PREVIEW);
            } else {
                setAfterUri(photo.uri);
                setStep(STEP.AFTER_PREVIEW);
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to capture photo. Please try again.');
        }
    };

    // ── Upload handlers ───────────────────────────────────────────────────────

    const handleUploadBefore = async () => {
        if (!taskId.trim() || !location.trim()) {
            Alert.alert('Missing Fields', 'Please enter a Task ID and Location before uploading.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await uploadBeforeImage(taskId.trim(), location.trim(), beforeUri, authToken, description);
            setStep(STEP.AFTER_CAMERA);
        } catch (e) {
            const msg = e?.response?.data?.error || e.message || 'Upload failed';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadAfterAndVerify = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await uploadAfterImageAndVerify(taskId.trim(), afterUri, authToken);
            setVerificationResult(data);
            setStep(STEP.RESULT);
        } catch (e) {
            const msg = e?.response?.data?.error || e.message || 'Verification failed';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const resetWorkflow = () => {
        setTaskId('');
        setLocation('');
        setDescription('');
        setBeforeUri(null);
        setAfterUri(null);
        setVerificationResult(null);
        setError(null);
        setStep(STEP.SETUP);
    };

    // ── Live camera view ──────────────────────────────────────────────────────

    if (showCamera) {
        return (
            <View style={styles.fill}>
                <CameraView style={styles.fill} ref={cameraRef} facing="back">
                    <View style={styles.cameraOverlay}>
                        <View style={styles.cameraHeader}>
                            <TouchableOpacity onPress={() => setShowCamera(false)} style={styles.iconBtn}>
                                <FontAwesome5 name="times" size={22} color={COLORS.white} />
                            </TouchableOpacity>
                            <Text style={styles.cameraLabel}>
                                {captureMode === 'BEFORE' ? '📷 Capture BEFORE Photo' : '📷 Capture AFTER Photo'}
                            </Text>
                        </View>
                        <View style={styles.cameraHint}>
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center' }}>
                                {captureMode === 'BEFORE'
                                    ? 'Take a clear photo of the work area before starting'
                                    : 'Take a clear photo of the same area after completing the work'}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.captureBtn} onPress={capturePhoto}>
                            <View style={styles.captureInner} />
                        </TouchableOpacity>
                    </View>
                </CameraView>
            </View>
        );
    }

    // ── STEP: SETUP ───────────────────────────────────────────────────────────

    if (step === STEP.SETUP) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.heading}>Work Verification</Text>
                <Text style={styles.subheading}>
                    Capture before & after photos. AI confirms task completion.
                </Text>

                <View style={styles.card}>
                    <Text style={styles.label}>Task ID *</Text>
                    <TextInput
                        style={styles.input}
                        value={taskId}
                        onChangeText={setTaskId}
                        placeholder="e.g. TASK-001"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        autoCapitalize="characters"
                    />

                    <Text style={[styles.label, { marginTop: 12 }]}>Work Location *</Text>
                    <TextInput
                        style={styles.input}
                        value={location}
                        onChangeText={setLocation}
                        placeholder="e.g. MG Road, Block 5"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                    />

                    <Text style={[styles.label, { marginTop: 12 }]}>Description (optional)</Text>
                    <TextInput
                        style={[styles.input, { height: 72 }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Brief description of the task"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        multiline
                    />
                </View>

                <TouchableOpacity
                    style={[styles.primaryBtn, { marginTop: 8 }]}
                    onPress={() => openCamera('BEFORE')}
                    disabled={!taskId.trim() || !location.trim()}
                >
                    <FontAwesome5 name="camera" size={18} color={COLORS.inkBlack} style={{ marginRight: 8 }} />
                    <Text style={styles.primaryBtnText}>Take BEFORE Photo</Text>
                </TouchableOpacity>

                <Text style={styles.hint}>
                    Step 1 of 2 — Photograph the area before you start work
                </Text>
            </ScrollView>
        );
    }

    // ── STEP: BEFORE_PREVIEW ──────────────────────────────────────────────────

    if (step === STEP.BEFORE_PREVIEW) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.heading}>Before Photo</Text>
                <Text style={styles.subheading}>Review your photo, then submit to start the task.</Text>

                <Image source={{ uri: beforeUri }} style={styles.previewImage} />

                {error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                    style={[styles.primaryBtn, { marginTop: 12 }]}
                    onPress={handleUploadBefore}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color={COLORS.inkBlack} />
                        : <>
                            <FontAwesome5 name="upload" size={16} color={COLORS.inkBlack} style={{ marginRight: 8 }} />
                            <Text style={styles.primaryBtnText}>Submit & Start Task</Text>
                          </>
                    }
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => openCamera('BEFORE')}
                    disabled={loading}
                >
                    <Text style={styles.secondaryBtnText}>Retake Photo</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    }

    // ── STEP: AFTER_CAMERA (task in progress) ─────────────────────────────────

    if (step === STEP.AFTER_CAMERA) {
        return (
            <View style={styles.centered}>
                <View style={styles.card}>
                    <Text style={styles.heading}>Task In Progress</Text>
                    <Text style={[styles.subheading, { textAlign: 'center' }]}>
                        Complete your work, then take the AFTER photo to verify completion.
                    </Text>

                    <View style={styles.infoRow}>
                        <FontAwesome5 name="tasks" size={16} color={COLORS.seaweed} />
                        <Text style={[styles.bodyText, { marginLeft: 8 }]}>{taskId}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <FontAwesome5 name="map-marker-alt" size={16} color={COLORS.seaweed} />
                        <Text style={[styles.bodyText, { marginLeft: 8 }]}>{location}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.primaryBtn, { marginTop: 24 }]}
                    onPress={() => openCamera('AFTER')}
                >
                    <FontAwesome5 name="camera" size={18} color={COLORS.inkBlack} style={{ marginRight: 8 }} />
                    <Text style={styles.primaryBtnText}>Take AFTER Photo</Text>
                </TouchableOpacity>

                <Text style={styles.hint}>Step 2 of 2 — Photograph the same area after completing the work</Text>
            </View>
        );
    }

    // ── STEP: AFTER_PREVIEW ───────────────────────────────────────────────────

    if (step === STEP.AFTER_PREVIEW) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.heading}>After Photo</Text>
                <Text style={styles.subheading}>Review and submit — AI will verify task completion.</Text>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { textAlign: 'center', marginBottom: 4 }]}>BEFORE</Text>
                        <Image source={{ uri: beforeUri }} style={[styles.previewImage, { flex: 0 }]} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { textAlign: 'center', marginBottom: 4 }]}>AFTER</Text>
                        <Image source={{ uri: afterUri }} style={[styles.previewImage, { flex: 0 }]} />
                    </View>
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                    style={[styles.primaryBtn, { marginTop: 16 }]}
                    onPress={handleUploadAfterAndVerify}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color={COLORS.inkBlack} />
                        : <>
                            <FontAwesome5 name="check-circle" size={16} color={COLORS.inkBlack} style={{ marginRight: 8 }} />
                            <Text style={styles.primaryBtnText}>Verify with AI</Text>
                          </>
                    }
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => openCamera('AFTER')}
                    disabled={loading}
                >
                    <Text style={styles.secondaryBtnText}>Retake After Photo</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    }

    // ── STEP: RESULT ──────────────────────────────────────────────────────────

    if (step === STEP.RESULT && verificationResult) {
        const verification = verificationResult.verification;
        const isClean = verification?.cleanup_successful;
        const statusColor = isClean ? COLORS.seaweed : COLORS.alertRed;
        const statusIcon = isClean ? 'check-circle' : 'times-circle';
        const statusText = isClean ? 'Task Verified ✅' : 'Verification Failed ❌';

        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.heading}>Verification Result</Text>

                {/* Status Banner */}
                <View style={[styles.card, { borderColor: statusColor, borderWidth: 2 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <FontAwesome5 name={statusIcon} size={32} color={statusColor} />
                        <Text style={[styles.heading, { marginLeft: 12, color: statusColor, marginBottom: 0 }]}>
                            {statusText}
                        </Text>
                    </View>
                    <Text style={styles.bodyText}>
                        {verification?.recommendation_message || 'No message available.'}
                    </Text>
                </View>

                {/* Image Comparison */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { textAlign: 'center', marginBottom: 4 }]}>
                            BEFORE — {verification?.before_prediction?.toUpperCase() || '—'}
                        </Text>
                        <Image source={{ uri: beforeUri }} style={[styles.previewImage, { flex: 0 }]} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { textAlign: 'center', marginBottom: 4 }]}>
                            AFTER — {verification?.after_prediction?.toUpperCase() || '—'}
                        </Text>
                        <Image source={{ uri: afterUri }} style={[styles.previewImage, { flex: 0 }]} />
                    </View>
                </View>

                {/* Confidence */}
                {verification?.cleanup_confidence != null && (
                    <View style={[styles.card, { marginTop: 16 }]}>
                        <Text style={styles.label}>AI Confidence Score</Text>
                        <Text style={[styles.heading, { color: statusColor }]}>
                            {(verification.cleanup_confidence * 100).toFixed(1)}%
                        </Text>
                    </View>
                )}

                {/* SLA note */}
                {verificationResult.task?.status === 'verification_failed' && (
                    <View style={[styles.card, { backgroundColor: `${COLORS.alertRed}20`, borderColor: COLORS.alertRed, borderWidth: 1, marginTop: 12 }]}>
                        <Text style={[styles.bodyText, { color: COLORS.alertRed }]}>
                            ⚠️ The work area does not appear to be sufficiently cleaned. Please redo the task and submit again.
                        </Text>
                    </View>
                )}

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 24 }]} onPress={resetWorkflow}>
                    <Text style={styles.primaryBtnText}>Start New Task</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    fill: { flex: 1 },
    container: { flex: 1, backgroundColor: COLORS.inkBlack },
    scrollContent: { padding: 20, paddingBottom: 48 },
    centered: {
        flex: 1,
        backgroundColor: COLORS.inkBlack,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    heading: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.white,
        marginBottom: 8,
    },
    subheading: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 20,
        lineHeight: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.seaweed,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    bodyText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
    errorText: { fontSize: 13, color: COLORS.alertRed, marginTop: 8 },
    hint: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 18,
    },
    card: {
        backgroundColor: COLORS.lightGlass,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        marginBottom: 12,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: COLORS.white,
        fontSize: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    previewImage: {
        width: '100%',
        aspectRatio: 4 / 3,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    primaryBtn: {
        backgroundColor: COLORS.mustard,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginBottom: 10,
    },
    primaryBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.inkBlack },
    secondaryBtn: {
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    secondaryBtnText: { fontSize: 15, color: COLORS.white },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    // Camera overlay
    cameraOverlay: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 48,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    cameraHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cameraLabel: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 16,
    },
    cameraHint: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginHorizontal: 16,
    },
    captureBtn: {
        alignSelf: 'center',
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 3,
        borderColor: COLORS.inkBlack,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

