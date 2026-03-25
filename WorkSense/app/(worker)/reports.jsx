import { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import apiClient from '../../src/constants/api';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../../src/constants/theme';

export default function ReportsScreen() {
    const router = useRouter();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchReports();
        }, [])
    );

    async function fetchReports() {
        setLoading(true);
        try {
            const res = await apiClient.get('/reports/my_reports/');
            const fetchedReports = res.data?.results ?? res.data;
            setReports(Array.isArray(fetchedReports) ? fetchedReports : []);
        } catch (error) {
            console.error('Error fetching reports:', error);
            setReports([]);
        } finally {
            setLoading(false);
        }
    }

    async function onRefresh() {
        setRefreshing(true);
        await fetchReports();
        setRefreshing(false);
    }

    function navigateToReport(report) {
        router.push({
            pathname: '/(worker)/task-completion-report',
            params: { taskId: report.task_id }
        });
    }

    function renderReportCard(report) {
        const formatTime = (dateString) => {
            try {
                return new Date(dateString).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
            } catch {
                return '-';
            }
        };

        const getSLAColor = () => {
            return report.sla_met ? COLORS.success : COLORS.error;
        };

        const getQualityColor = (score) => {
            if (score >= 80) return COLORS.success;
            if (score >= 50) return COLORS.warning;
            return COLORS.error;
        };

        return (
            <BlurView intensity={20} style={styles.card}>
                <TouchableOpacity
                    onPress={() => navigateToReport(report)}
                    activeOpacity={0.7}
                    style={styles.cardTouch}
                >
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                        <View style={styles.taskIdentifier}>
                            <View style={[styles.taskTypeBadge, { backgroundColor: `${COLORS.secondary}20` }]}>
                                <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
                            </View>
                            <View style={styles.taskInfo}>
                                <Text style={styles.taskId}>{report.task_id}</Text>
                                <Text style={styles.date}>{formatTime(report.created_at)}</Text>
                            </View>
                        </View>
                        <View style={[styles.slaStatusBadge, { backgroundColor: `${getSLAColor()}20` }]}>
                            <Ionicons
                                name={report.sla_met ? 'checkmark' : 'close'}
                                size={16}
                                color={getSLAColor()}
                            />
                            <Text style={[styles.slaStatusText, { color: getSLAColor() }]}>
                                {report.sla_met ? 'MET' : 'EXCEEDED'}
                            </Text>
                        </View>
                    </View>

                    {/* Metrics Row */}
                    <View style={styles.metricsRow}>
                        <View style={styles.metric}>
                            <Text style={styles.metricLabel}>Time</Text>
                            <Text style={styles.metricValue}>{report.actual_duration_minutes} min</Text>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={styles.metric}>
                            <Text style={styles.metricLabel}>Similarity</Text>
                            <Text style={[
                                styles.metricValue,
                                { color: getQualityColor(report.image_similarity_percentage) }
                            ]}>
                                {report.image_similarity_percentage}%
                            </Text>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={styles.metric}>
                            <Text style={styles.metricLabel}>Distance</Text>
                            <Text style={styles.metricValue}>{report.gps_distance_meters.toFixed(0)}m</Text>
                        </View>
                    </View>

                    {/* Image Quality Preview */}
                    <View style={styles.qualityPreview}>
                        <View style={styles.qualityItem}>
                            <Text style={styles.qualityLabel}>Before</Text>
                            <View style={[
                                styles.qualityIndicator,
                                { backgroundColor: getQualityColor(report.before_image_quality_score) }
                            ]}>
                                <Text style={styles.qualityNumber}>
                                    {report.before_image_quality_score}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.qualityItem}>
                            <Text style={styles.qualityLabel}>After</Text>
                            <View style={[
                                styles.qualityIndicator,
                                { backgroundColor: getQualityColor(report.after_image_quality_score) }
                            ]}>
                                <Text style={styles.qualityNumber}>
                                    {report.after_image_quality_score}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Summary Text Preview */}
                    <Text style={styles.summaryPreview} numberOfLines={2}>
                        {report.sla_analysis_text}
                    </Text>

                    {/* View Full Report Button */}
                    <View style={styles.viewMoreBtn}>
                        <Text style={styles.viewMoreText}>View Full Report</Text>
                        <Ionicons name="arrow-forward" size={16} color={COLORS.secondary} />
                    </View>
                </TouchableOpacity>
            </BlurView>
        );
    }

    return (
        <LinearGradient colors={['#100D28', '#1A1B30', '#1F1B4C']} style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Completion Reports</Text>
                    <Text style={styles.subtitle}>Review all your completed tasks</Text>
                </View>
                <View style={styles.reportCount}>
                    <Text style={styles.reportCountText}>{reports.length}</Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator color="#A855F7" size="large" style={styles.loader} />
            ) : (
                <FlatList
                    data={reports}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => renderReportCard(item)}
                    ListEmptyComponent={
                        <BlurView intensity={20} style={styles.emptyContainer}>
                            <Ionicons name="file-tray-full" size={48} color={COLORS.textSecondary} />
                            <Text style={styles.emptyTitle}>No Reports Yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Complete tasks with before/after images to generate reports
                            </Text>
                        </BlurView>
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
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: SPACING.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingTop: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: '900',
        color: COLORS.white,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
    },
    reportCount: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.full,
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.secondary,
    },
    reportCountText: {
        fontSize: FONT_SIZES.lg,
        fontWeight: '700',
        color: COLORS.secondary,
    },

    list: {
        paddingBottom: SPACING.xxl * 2,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    card: {
        marginBottom: SPACING.md,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.1)',
    },
    cardTouch: {
        padding: SPACING.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    taskIdentifier: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        flex: 1,
    },
    taskTypeBadge: {
        width: 32,
        height: 32,
        borderRadius: RADIUS.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    taskInfo: {
        flex: 1,
    },
    taskId: {
        fontSize: FONT_SIZES.md,
        fontWeight: '700',
        color: COLORS.white,
    },
    date: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    slaStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: RADIUS.full,
    },
    slaStatusText: {
        fontSize: FONT_SIZES.xs,
        fontWeight: '600',
    },

    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: SPACING.md,
        marginBottom: SPACING.md,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: RADIUS.sm,
    },
    metric: {
        flex: 1,
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    metricValue: {
        fontSize: FONT_SIZES.md,
        fontWeight: '700',
        color: COLORS.white,
    },
    metricDivider: {
        width: 1,
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        marginHorizontal: SPACING.sm,
    },

    qualityPreview: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.md,
    },
    qualityItem: {
        flex: 1,
        alignItems: 'center',
    },
    qualityLabel: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    qualityIndicator: {
        width: '100%',
        paddingVertical: SPACING.sm,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: RADIUS.sm,
    },
    qualityNumber: {
        fontSize: FONT_SIZES.md,
        fontWeight: '700',
        color: COLORS.white,
    },

    summaryPreview: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        lineHeight: 16,
        marginBottom: SPACING.md,
    },

    viewMoreBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(148, 163, 184, 0.1)',
    },
    viewMoreText: {
        fontSize: FONT_SIZES.sm,
        fontWeight: '600',
        color: COLORS.secondary,
    },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.xxl,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.md,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.1)',
        paddingVertical: SPACING.xxl,
    },
    emptyTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: '700',
        color: COLORS.white,
        marginTop: SPACING.md,
    },
    emptySubtitle: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.sm,
    },
});
