import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, Modal, ScrollView, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import apiClient from '../../src/constants/api';
import TaskCard from '../../src/components/TaskCard';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../../src/constants/theme';

const TASK_TYPES = [
    { label: 'Sweeping', value: 'SWEEPING' },
    { label: 'Road Repair', value: 'ROAD_REPAIR' },
    { label: 'Water Maintenance', value: 'WATER_MAINTENANCE' },
    { label: 'Garbage Collection', value: 'GARBAGE_COLLECTION' },
    { label: 'Other', value: 'OTHER' },
];

export default function ProofsTabScreen() {
    const router = useRouter();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedTaskType, setSelectedTaskType] = useState('OTHER');
    const [taskDescription, setTaskDescription] = useState('');
    const [creatingTask, setCreatingTask] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchActiveTasks();
        }, [])
    );

    async function fetchActiveTasks() {
        setLoading(true);
        try {
            const res = await apiClient.get('/tasks/');
            const fetchedData = res.data?.results ?? res.data;
            let activeTasks = Array.isArray(fetchedData) ? fetchedData : [];
            // Filter to only pending or in progress for proofs
            activeTasks = activeTasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
            setTasks(activeTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            // Fallback for offline mode 
            setTasks([
                { id: '1', task_id: 'TSK-100', title: 'Clean Main Street', description: 'Sweep from blocks A to D', status: 'PENDING', priority: 'high', due_date: new Date().toISOString() },
                { id: '2', task_id: 'TSK-101', title: 'Empty public bins', description: 'Zone 4 garbage bins', status: 'IN_PROGRESS', priority: 'medium', due_date: new Date().toISOString() },
            ]);
        } finally {
            setLoading(false);
        }
    }

    async function onRefresh() {
        setRefreshing(true);
        await fetchActiveTasks();
        setRefreshing(false);
    }

    async function handleCreateAndCaptureBeforeImage() {
        if (!taskDescription.trim()) return;

        setCreatingTask(true);
        try {
            const res = await apiClient.post('/tasks/create_task/', {
                task_type: selectedTaskType,
                description: taskDescription.trim(),
                status: 'PENDING',
            });

            const createdTask = res.data;

            // Close modal
            setShowModal(false);
            setTaskDescription('');
            setSelectedTaskType('OTHER');

            // Auto-navigate to submit-proof with BEFORE proof type
            router.push({
                pathname: '/(worker)/submit-proof',
                params: { taskId: createdTask.task_id, proofType: 'BEFORE' }
            });

        } catch (error) {
            console.error('Error creating task:', error);
            alert('Failed to create task. Please try again.');
        } finally {
            setCreatingTask(false);
        }
    }

    return (
        <LinearGradient colors={['#100D28', '#1A1B30', '#1F1B4C']} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Submit Proofs</Text>
                <Text style={styles.subtitle}>Select an active task or add a new one.</Text>
            </View>

            {/* New Task Button */}
            <TouchableOpacity
                style={styles.newTaskBtn}
                onPress={() => setShowModal(true)}
            >
                <View style={styles.newTaskBtnContent}>
                    <Ionicons name="add-circle" size={24} color={COLORS.secondary} />
                    <Text style={styles.newTaskBtnText}>Create New Task</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {loading ? (
                <ActivityIndicator color="#A855F7" style={styles.loader} />
            ) : (
                <FlatList
                    data={tasks}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => <TaskCard task={item} />}
                    ListEmptyComponent={
                        <Text style={styles.empty}>No active tasks require proofs right now.</Text>
                    }
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#A855F7"
                            colors={['#A855F7']}
                        />
                    }
                />
            )}

            {/* Create Task Modal */}
            <Modal
                visible={showModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowModal(false)}
            >
                <BlurView intensity={90} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create New Task</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                            {/* Task Type Selection */}
                            <Text style={styles.label}>Task Type</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.taskTypeScroll}>
                                {TASK_TYPES.map((type) => (
                                    <TouchableOpacity
                                        key={type.value}
                                        style={[
                                            styles.taskTypeBtn,
                                            selectedTaskType === type.value && styles.taskTypeBtnActive
                                        ]}
                                        onPress={() => setSelectedTaskType(type.value)}
                                    >
                                        <Text
                                            style={[
                                                styles.taskTypeText,
                                                selectedTaskType === type.value && styles.taskTypeTextActive
                                            ]}
                                        >
                                            {type.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Description Input */}
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="What are you working on?"
                                placeholderTextColor={COLORS.textSecondary}
                                value={taskDescription}
                                onChangeText={setTaskDescription}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />

                            {/* Info Alert */}
                            <BlurView intensity={20} style={styles.infoBox}>
                                <Ionicons name="information-circle" size={20} color={COLORS.secondary} />
                                <Text style={styles.infoText}>
                                    After creating the task, you'll immediately proceed to capture the "Before" image and your selfie.
                                </Text>
                            </BlurView>
                        </ScrollView>

                        {/* Action Buttons */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.btn, styles.btnSecondary]}
                                onPress={() => setShowModal(false)}
                            >
                                <Text style={styles.btnSecondaryText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.btn, styles.btnPrimary, creatingTask && { opacity: 0.6 }]}
                                onPress={handleCreateAndCaptureBeforeImage}
                                disabled={creatingTask}
                            >
                                {creatingTask ? (
                                    <ActivityIndicator color={COLORS.white} size="small" />
                                ) : (
                                    <Text style={styles.btnPrimaryText}>Create & Capture</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </BlurView>
            </Modal>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: SPACING.md },
    header: {
        marginBottom: SPACING.lg,
        paddingTop: SPACING.xl,
    },
    title: { fontSize: FONT_SIZES.xxl, fontWeight: '900', color: COLORS.white, marginBottom: 4 },
    subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
    newTaskBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.3)',
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
    },
    newTaskBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    newTaskBtnText: {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        color: COLORS.secondary,
    },
    list: { paddingBottom: SPACING.xxl * 2 },
    loader: { marginTop: SPACING.xxl },
    empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xxl },

    // Modal styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1A1B30',
        borderTopLeftRadius: RADIUS.lg,
        borderTopRightRadius: RADIUS.lg,
        maxHeight: '90%',
        paddingBottom: SPACING.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(148, 163, 184, 0.1)',
    },
    modalTitle: {
        fontSize: FONT_SIZES.xl,
        fontWeight: '700',
        color: COLORS.white,
    },
    modalForm: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.lg,
    },
    label: {
        fontSize: FONT_SIZES.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    taskTypeScroll: {
        marginBottom: SPACING.lg,
    },
    taskTypeBtn: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.full,
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.2)',
        marginRight: SPACING.sm,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    taskTypeBtnActive: {
        backgroundColor: COLORS.secondary,
        borderColor: COLORS.secondary,
    },
    taskTypeText: {
        fontSize: FONT_SIZES.xs,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    taskTypeTextActive: {
        color: COLORS.white,
    },
    input: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.2)',
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        color: COLORS.white,
        fontSize: FONT_SIZES.md,
        marginBottom: SPACING.lg,
        maxHeight: 120,
    },
    infoBox: {
        flexDirection: 'row',
        gap: SPACING.md,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.2)',
        marginBottom: SPACING.lg,
    },
    infoText: {
        flex: 1,
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        lineHeight: 16,
    },
    modalFooter: {
        flexDirection: 'row',
        gap: SPACING.md,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
    },
    btn: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnPrimary: {
        backgroundColor: COLORS.secondary,
    },
    btnPrimaryText: {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        color: COLORS.white,
    },
    btnSecondary: {
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.3)',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    btnSecondaryText: {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        color: COLORS.white,
    },
});
