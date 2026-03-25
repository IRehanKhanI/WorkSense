import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import apiClient, { BASE_URL } from '../../src/constants/api';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../../src/constants/theme';

export default function TaskCompletionReportScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const taskId = params.taskId;

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState({
        time: true,
        location: true,
        quality: true,
        sla: true,
        recommendations: true,
    });

    useEffect(() => {
        if (taskId) {
            fetchCompletionReport();
        }
    }, [taskId]);

    async function fetchCompletionReport() {
        setLoading(true);
        try {
            const res = await apiClient.get('/reports/get_report/', {
                params: { task_id: taskId }
            });
            setReport(res.data);
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    }

    function toggleSection(section) {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    }

    function renderMetricBadge(label, value, unit = '', icon = null, color = COLORS.secondary) {
        return (
            <BlurView intensity={20} style={styles.metricBadge}>
                <View style={styles.metricContent}>
                    {icon && <Ionicons name={icon} size={20} color={color} />}
                    <View style={styles.metricText}>
                        <Text style={styles.metricLabel}>{label}</Text>
                        <Text style={[styles.metricValue, { color: color }]}>
                            {value} {unit}
                        </Text>
                    </View>
                </View>
            </BlurView>
        );
    }

    function renderReportSection(title, content, section, icon, bgColor) {
        const isExpanded = expandedSections[section];
        return (
            <BlurView intensity={30} style={styles.section}>
                <TouchableOpacity
                    style={[styles.sectionHeader, { borderBottomColor: bgColor }]}
                    onPress={() => toggleSection(section)}
                    activeOpacity={0.7}
                >
                    <View style={styles.sectionTitleContent}>
                        <View style={[styles.sectionIcon, { backgroundColor: `${bgColor}20` }]}>
                            <Ionicons name={icon} size={18} color={bgColor} />
                        </View>
                        <Text style={styles.sectionTitle}>{title}</Text>
                    </View>
                    <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={COLORS.textSecondary}
                    />
                </TouchableOpacity>

                {isExpanded && (
                    <Text style={styles.sectionContent}>{content}</Text>
                )}
            </BlurView>
        );
    }

    if (loading) {
        return (
            <LinearGradient colors={['#100D28', '#1A1B30', '#1F1B4C']} style={styles.container}>
                <ActivityIndicator color="#A855F7" size="large" style={styles.loader} />
            </LinearGradient>
        );
    }

    if (!report) {
        return (
            <LinearGradient colors={['#100D28', '#1A1B30', '#1F1B4C']} style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={48} color={COLORS.error} />
                    <Text style={styles.errorText}>Report not found</Text>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Text style={styles.backBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#100D28', '#1A1B30', '#1F1B4C']} style={styles.container}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Task Completion Report</Text>
                    <View style={styles.slaStatus}>
                        <Ionicons
                            name={report.sla_met ? 'checkmark-circle' : 'alert-circle'}
                            size={24}
                            color={report.sla_met ? COLORS.success : COLORS.error}
                        />
                    </View>
                </View>

                {/* Task Info */}
                <BlurView intensity={25} style={styles.taskInfoCard}>
                    <View style={styles.taskIdRow}>
                        <Text style={styles.taskIdLabel}>Task ID</Text>
                        <Text style={styles.taskId}>{report.task_id}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.slaRow}>
                        <Text style={styles.slaLabel}>SLA Status</Text>
                        <Text style={[
                            styles.slaValue,
                            { color: report.sla_met ? COLORS.success : COLORS.error }
                        ]}>
                            {report.sla_met ? '✓ MET' : '✗ EXCEEDED'}
                        </Text>
                    </View>
                </BlurView>

                {/* Key Metrics */}
                <View style={styles.metricsGrid}>
                    {renderMetricBadge(
                        'Time Taken',
                        report.actual_duration_minutes,
                        'min',
                        'time',
                        '#60A5FA'
                    )}
                    {renderMetricBadge(
                        'SLA Target',
                        report.sla_threshold_minutes,
                        'min',
                        'hourglass',
                        '#F59E0B'
                    )}
                    {renderMetricBadge(
                        'Image Match',
                        report.image_similarity_percentage,
                        '%',
                        'images',
                        '#34D399'
                    )}
                    {renderMetricBadge(
                        'GPS Distance',
                        report.gps_distance_meters,
                        'm',
                        'location',
                        '#A78BFA'
                    )}
                </View>

                {/* 5-Category Report Sections */}
                <View style={styles.reportSections}>
                    {renderReportSection(
                        'Time Analysis',
                        report.time_analysis_text,
                        'time',
                        'stopwatch',
                        '#60A5FA'
                    )}

                    {renderReportSection(
                        'Location',
                        report.location_analysis_text,
                        'location',
                        'map',
                        '#A78BFA'
                    )}

                    {renderReportSection(
                        'Task Quality',
                        report.quality_analysis_text,
                        'quality',
                        'checkmark-done',
                        '#34D399'
                    )}

                    {renderReportSection(
                        'SLA Performance',
                        report.sla_analysis_text,
                        'sla',
                        'trending-up',
                        '#F59E0B'
                    )}

                    {renderReportSection(
                        'Recommendations',
                        report.recommendations_text,
                        'recommendations',
                        'bulb',
                        '#EC4899'
                    )}
                </View>

                {/* Image Quality Details */}
                <BlurView intensity={25} style={styles.imageQualityCard}>
                    <Text style={styles.cardTitle}>Image Quality Details</Text>
                    <View style={styles.qualityRow}>
                        <View style={styles.qualityItem}>
                            <Text style={styles.qualityLabel}>Before Image</Text>
                            <View style={styles.qualityScore}>
                                <Text style={styles.qualityScoreText}>
                                    {report.before_image_quality_score}/100
                                </Text>
                            </View>
                        </View>
                        <View style={styles.qualityItem}>
                            <Text style={styles.qualityLabel}>After Image</Text>
                            <View style={styles.qualityScore}>
                                <Text style={styles.qualityScoreText}>
                                    {report.after_image_quality_score}/100
                                </Text>
                            </View>
                        </View>
                    </View>
                </BlurView>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.btn, styles.btnSecondary]}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={20} color={COLORS.white} />
                        <Text style={styles.btnSecondaryText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btn, styles.btnPrimary]}
                        onPress={() => router.push('/(worker)/reports')}
                    >
                        <Ionicons name="document-text" size={20} color={COLORS.white} />
                        <Text style={styles.btnPrimaryText}>View All Reports</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: SPACING.md,
        paddingBottom: SPACING.xxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        paddingTop: SPACING.md,
    },
    headerTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: '700',
        color: COLORS.white,
    },
    slaStatus: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },

    taskInfoCard: {
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.1)',
        marginBottom: SPACING.lg,
        overflow: 'hidden',
    },
    taskIdRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    taskIdLabel: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    taskId: {
        fontSize: FONT_SIZES.md,
        fontWeight: '700',
        color: COLORS.secondary,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        marginVertical: SPACING.sm,
    },
    slaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    slaLabel: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    slaValue: {
        fontSize: FONT_SIZES.md,
        fontWeight: '700',
    },

    metricsGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
        justifyContent: 'space-between',
    },
    metricBadge: {
        width: '48%',
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.1)',
        overflow: 'hidden',
    },
    metricContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACING.sm,
    },
    metricText: {
        flex: 1,
    },
    metricLabel: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    metricValue: {
        fontSize: FONT_SIZES.lg,
        fontWeight: '700',
    },

    reportSections: {
        gap: SPACING.md,
        marginBottom: SPACING.lg,
    },
    section: {
        borderRadius: RADIUS.md,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.1)',
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
    },
    sectionTitleContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        flex: 1,
    },
    sectionIcon: {
        width: 32,
        height: 32,
        borderRadius: RADIUS.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        color: COLORS.white,
    },
    sectionContent: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        padding: SPACING.md,
        lineHeight: 20,
    },

    imageQualityCard: {
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.1)',
        marginBottom: SPACING.lg,
        overflow: 'hidden',
    },
    cardTitle: {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        color: COLORS.white,
        marginBottom: SPACING.md,
    },
    qualityRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: SPACING.md,
    },
    qualityItem: {
        flex: 1,
        alignItems: 'center',
    },
    qualityLabel: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },
    qualityScore: {
        width: '100%',
        paddingVertical: SPACING.md,
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.3)',
    },
    qualityScoreText: {
        fontSize: FONT_SIZES.lg,
        fontWeight: '700',
        color: COLORS.secondary,
    },

    actionButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
        paddingBottom: SPACING.lg,
    },
    btn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
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

    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    errorText: {
        fontSize: FONT_SIZES.lg,
        fontWeight: '600',
        color: COLORS.error,
        marginVertical: SPACING.md,
    },
    backBtn: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.secondary,
        borderRadius: RADIUS.md,
        marginTop: SPACING.lg,
    },
    backBtnText: {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        color: COLORS.white,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
