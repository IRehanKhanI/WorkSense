import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function Index() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>WorkSense</Text>

            <Link href="/(auth)/login" style={styles.link}>
                Proceed to Login
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#011627',
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#419d78',
        marginBottom: 30,
    },
    link: {
        fontSize: 18,
        fontWeight: '600',
        color: '#011627',
        backgroundColor: '#fed766',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        overflow: 'hidden',
    },
});