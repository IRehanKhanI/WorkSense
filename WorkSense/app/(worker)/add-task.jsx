import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../src/constants/api';
import CustomButton from '../../src/components/CustomButton';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../../src/constants/theme';

const TASK_TYPES = [
    { id: 'SWEEPING', label: 'Sweeping' },
    { id: 'ROAD_REPAIR', label: 'Road Repair' },
    { id: 'WATER_MAINTENANCE', label: 'Water Maint.' },
    { id: 'GARBAGE_COLLECTION', label: 'Garbage' },
    { id: 'OTHER', label: 'Other' },
];

export default function AddTaskScreen() {
    const router = useRouter();
    const [selectedType, setSelectedType] = useState('SWEEPING');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        if (!description.trim()) {
            Alert.alert('Required', 'Please enter a description of the work.');
            return;
        }

        setLoading(true);
        try {
            await apiClient.post('/tasks/create_task/', {
                task_type: selectedType,
                description: description.trim(),
                status: 'IN_PROGRESS', // Worker is immediately doing it
            });
            Alert.alert('Task Created', 'You have successfully self-assigned this task.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.detail || 'Failed to create task.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <LinearGradient colors={['#100D28', '#1A1B30', '#1F1B4C']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.title}>Log Active Work</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={styles.label}>What type of work is this?</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                    {TASK_TYPES.map(type => {
                        const isSelected = selectedType === type.id;
                        return (
                            <TouchableOpacity
                                key={type.id}
                                onPress={() => setSelectedType(type.id)}
                                style={[
                                    styles.chip,
                                    isSelected && styles.chipSelected
                                ]}
                            >
                                <Text style={[
                                    styles.chipText,
                                    isSelected && styles.chipTextSelected
                                ]}>{type.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <Text style={[styles.label, { marginTop: SPACING.xl }]}>Description of Work</Text>
                <BlurView intensity={20} tint="dark" style={styles.inputCard}>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Sweeping sidewalks around the town square."
                        placeholderTextColor={COLORS.textSecondary}
                        multiline
                        numberOfLines={4}
                        value={description}
                        onChangeText={setDescription}
                    />
                </BlurView>

                <CustomButton
                    title="Start Task"
                    onPress={handleSubmit}
                    loading={loading}
                    style={styles.submitBtn}
                />
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.xl * 1.5,
        paddingBottom: SPACING.md,
    },
    backBtn: {
        padding: SPACING.xs,
        marginRight: SPACING.sm,
    },
    title: {
        fontSize: FONT_SIZES.xl,
        fontWeight: '900',
        color: COLORS.white,
    },
    content: {
        padding: SPACING.md,
    },
    label: {
        fontSize: FONT_SIZES.md,
        fontWeight: '700',
        color: COLORS.white,
        marginBottom: SPACING.sm,
    },
    chipContainer: {
        flexDirection: 'row',
        marginBottom: SPACING.xs,
    },
    chip: {
        paddingHorizontal: SPACING.md,
        paddingVertical: 10,
        borderRadius: RADIUS.full,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginRight: SPACING.sm,
    },
    chipSelected: {
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderColor: '#A855F7',
    },
    chipText: {
        color: COLORS.textSecondary,
        fontWeight: '600',
        fontSize: FONT_SIZES.sm,
    },
    chipTextSelected: {
        color: '#E9D5FF',
    },
    inputCard: {
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.1)',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    input: {
        color: COLORS.white,
        padding: SPACING.md,
        minHeight: 120,
        textAlignVertical: 'top',
        fontSize: FONT_SIZES.md,
    },
    submitBtn: {
        marginTop: SPACING.xxl,
    }
});
