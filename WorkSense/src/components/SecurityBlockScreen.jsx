import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ShieldAlert } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function SecurityBlockScreen({ issues = [] }) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient
                colors={['#0F172A', '#1E293B']}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <BlurView intensity={30} tint="dark" style={styles.glassCard}>
                        <View style={styles.iconContainer}>
                            <ShieldAlert size={64} color={COLORS.error} strokeWidth={2} />
                        </View>
                        
                        <Text style={styles.title}>Security Alert</Text>
                        <Text style={styles.subtitle}>
                            Please disable the following settings to use the app:
                        </Text>
                        
                        <View style={styles.issuesContainer}>
                            {issues.map((issue, index) => (
                                <View key={index} style={styles.issueRow}>
                                    <View style={styles.bullet} />
                                    <Text style={styles.issueText}>{issue}</Text>
                                </View>
                            ))}
                        </View>
                        
                        <Text style={styles.instructions}>
                            If you have recently turned them off, try restarting the app.
                        </Text>
                    </BlurView>
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: SPACING.lg,
    },
    glassCard: {
        padding: SPACING.xl,
        borderRadius: RADIUS.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        width: '100%',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.error,
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
    },
    title: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: 'bold',
        color: COLORS.error,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
        marginBottom: SPACING.xl,
        textAlign: 'center',
        opacity: 0.9,
    },
    issuesContainer: {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: SPACING.lg,
        borderRadius: RADIUS.lg,
        marginBottom: SPACING.xl,
    },
    issueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    bullet: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        marginRight: SPACING.md,
    },
    issueText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.white,
        flex: 1,
    },
    instructions: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textLight,
        textAlign: 'center',
        marginTop: SPACING.md,
    }
});