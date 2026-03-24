import React, { useState } from 'react';
import {
    StyleSheet, View, Text, ScrollView, TouchableOpacity,
    Dimensions, SafeAreaView, StatusBar, Alert
} from 'react-native';
import {
    Users, Truck, ShieldAlert, Timer,
    Info, LayoutGrid, ChevronRight
} from 'lucide-react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const COLORS = {
    darkBg: '#0F172A',
    cardBg: '#1E293B',
    primary: '#0284C7',
    success: '#0D9488',
    danger: '#EF4444',
    muted: '#94A3B8',
    accent: '#F1F5F9',
};

const AdminDashboard = () => {
    const showAuditData = (title, rawValue) => {
        Alert.alert(
            `Audit Trail: ${title}`,
            `Raw Data: ${rawValue}\nSource: Secure_GPS_Log\nIntegrity: Verified ✅`,
            [{ text: "Close", style: "cancel" }]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>COMMAND CENTER</Text>
                    <Text style={styles.headerSub}>SDG 11: Sustainable Cities</Text>
                </View>
                <TouchableOpacity style={styles.syncBtn}>
                    <Text style={styles.syncBtnText}>GENERATE LOGS</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Top Stats - Horizontal Scroll */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statScroll}>
                    <StatCard
                        title="Attendance"
                        val="92%"
                        icon={<Users color={COLORS.primary} size={20} />}
                        onPress={() => showAuditData("Attendance", "184/200 Staff Active")}
                    />
                    <StatCard
                        title="Waste Routes"
                        val="78%"
                        icon={<Truck color={COLORS.success} size={20} />}
                        onPress={() => showAuditData("Routes", "45/60 Wards Cleared")}
                    />
                    <StatCard
                        title="Tamper Alert"
                        val="02"
                        icon={<ShieldAlert color={COLORS.danger} size={20} />}
                        isAlert
                        onPress={() => showAuditData("Security", "2 Mock GPS detections blocked")}
                    />
                </ScrollView>

                {/* Analytics Section */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Efficiency Trends (24h)</Text>
                    <LineChart
                        data={{
                            labels: ["8am", "10am", "12pm", "2pm", "4pm"],
                            datasets: [{ data: [40, 70, 95, 80, 85] }]
                        }}
                        width={screenWidth - 60}
                        height={180}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chartStyle}
                    />
                </View>

                {/* Field Logs Section */}
                <Text style={styles.sectionTitle}>Live Field Status</Text>
                <View style={styles.tableCard}>
                    <UserRow name="Amit Sharma" ward="Ward 04" status="ON-SITE" color={COLORS.success} />
                    <UserRow name="Sonia Varma" ward="Ward 12" status="SPOOFING" color={COLORS.danger} />
                    <UserRow name="Rajesh Kumar" ward="Ward 09" status="IDLE" color={COLORS.primary} />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

// Reusable Stat Card Component
const StatCard = ({ title, val, icon, isAlert, onPress }) => (
    <View style={[styles.statCard, isAlert && { borderColor: COLORS.danger, borderWidth: 1 }]}>
        <View style={styles.statHeader}>
            {icon}
            <TouchableOpacity onPress={onPress}>
                <Info color={COLORS.muted} size={16} />
            </TouchableOpacity>
        </View>
        <Text style={styles.statVal}>{val}</Text>
        <Text style={styles.statTitle}>{title}</Text>
    </View>
);

// Reusable List Row
const UserRow = ({ name, ward, status, color }) => (
    <View style={styles.row}>
        <View>
            <Text style={styles.rowName}>{name}</Text>
            <Text style={styles.rowWard}>{ward}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.statusText, { color: color }]}>{status}</Text>
        </View>
        <ChevronRight color={COLORS.muted} size={18} />
    </View>
);

const chartConfig = {
    backgroundGradientFrom: COLORS.cardBg,
    backgroundGradientTo: COLORS.cardBg,
    color: (opacity = 1) => `rgba(2, 132, 199, ${opacity})`, // Using Primary Blue
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    strokeWidth: 3,
    propsForDots: { r: "4", strokeWidth: "2", stroke: COLORS.primary }
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.darkBg },
    header: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#334155'
    },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
    headerSub: { color: COLORS.success, fontSize: 10, fontWeight: '700', marginTop: 2 },
    syncBtn: { bg: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.primary },
    syncBtnText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
    scrollContent: { padding: 20 },
    statScroll: { marginBottom: 24 },
    statCard: {
        backgroundColor: COLORS.cardBg,
        width: 140,
        padding: 16,
        borderRadius: 20,
        marginRight: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8
    },
    statHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    statVal: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
    statTitle: { color: COLORS.muted, fontSize: 10, fontWeight: 'bold', uppercase: true, marginTop: 4 },
    chartCard: { backgroundColor: COLORS.cardBg, padding: 20, borderRadius: 24, marginBottom: 24 },
    chartTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
    chartStyle: { borderRadius: 16, marginVertical: 8 },
    sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    tableCard: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 10 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#334155'
    },
    rowName: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    rowWard: { color: COLORS.muted, fontSize: 10 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginHorizontal: 10 },
    statusText: { fontSize: 10, fontWeight: '900' }
});

export default AdminDashboard;