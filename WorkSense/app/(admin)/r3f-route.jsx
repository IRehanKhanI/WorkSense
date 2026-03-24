import React, { useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

// Mapusa Dummy Route mapped to 3D Space (X, Z space mapping)
// Original Coords:
// { latitude: 15.5910, longitude: 73.8100 } -> Mapped around (0,0)
const ROUTE_POINTS_3D = [
    new THREE.Vector3(-5, 0, -5),
    new THREE.Vector3(-2, 0, -1),
    new THREE.Vector3(2, 0, 0),
    new THREE.Vector3(4, 0, 3),
    new THREE.Vector3(0, 0, 5),
    new THREE.Vector3(-3, 0, 4),
    new THREE.Vector3(-5, 0, -5), // Loop back
];

// Generate CatmullRomCurve for smooth road driving
const curve = new THREE.CatmullRomCurve3(ROUTE_POINTS_3D);
curve.closed = true;

function AnimatedCar() {
    const meshRef = useRef();
    const [progress, setProgress] = useState(0);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        
        // Move car slowly along the route
        const speed = 0.05; // 5% of path per second
        let nextProgress = progress + (delta * speed);
        if (nextProgress > 1) nextProgress = 0;
        
        setProgress(nextProgress);

        // Get position on the curve
        const position = curve.getPointAt(nextProgress);
        meshRef.current.position.copy(position);

        // Calculate rotation (look ahead)
        // Adding a tiny offset to find the direction to face
        const lookProgress = (nextProgress + 0.01) % 1;
        const targetPosition = curve.getPointAt(lookProgress);
        meshRef.current.lookAt(targetPosition);
    });

    return (
        <group ref={meshRef} scale={[1.5, 1.5, 1.5]} position={[0, 0.5, 0]}>
            {/* Main Chassis */}
            <mesh position={[0, 0.4, 0]}>
                <boxGeometry args={[1, 0.6, 2.5]} />
                <meshStandardMaterial color={'darkgreen'} />
            </mesh>

            {/* Cab */}
            <mesh position={[0, 0.9, 0.6]}>
                <boxGeometry args={[0.9, 0.6, 0.8]} />
                <meshStandardMaterial color={'white'} />
            </mesh>

            {/* Wheels */}
            {/* Front Left */}
            <mesh position={[-0.55, 0.2, 0.8]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
                <meshStandardMaterial color={'#111'} />
            </mesh>
            {/* Front Right */}
            <mesh position={[0.55, 0.2, 0.8]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
                <meshStandardMaterial color={'#111'} />
            </mesh>
            {/* Rear Left */}
            <mesh position={[-0.55, 0.2, -0.8]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
                <meshStandardMaterial color={'#111'} />
            </mesh>
            {/* Rear Right */}
            <mesh position={[0.55, 0.2, -0.8]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
                <meshStandardMaterial color={'#111'} />
            </mesh>

            {/* Headlights */}
            <mesh position={[-0.3, 0.5, 1.25]}>
                <boxGeometry args={[0.2, 0.1, 0.1]} />
                <meshStandardMaterial color={'yellow'} emissive={'yellow'} emissiveIntensity={2} />
            </mesh>
            <mesh position={[0.3, 0.5, 1.25]}>
                <boxGeometry args={[0.2, 0.1, 0.1]} />
                <meshStandardMaterial color={'yellow'} emissive={'yellow'} emissiveIntensity={2} />
            </mesh>
        </group>
    );
}

function Road() {
    return (
        <group>
            {/* The Thick Glowing Road Line */}
            <mesh>
                <tubeGeometry args={[curve, 100, 0.1, 8, true]} />
                <meshStandardMaterial 
                    color="cyan" 
                    emissive="cyan" 
                    emissiveIntensity={1.5} 
                    transparent 
                    opacity={0.8} 
                />
            </mesh>
            {/* 3D Map Plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color={COLORS.darkBg2} />
            </mesh>
        </group>
    );
}

// Optional Heatmap/Zones in 3D
function Hotspot({ position, color }) {
    return (
        <mesh position={[position[0], 0.01, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[3, 32]} />
            <meshStandardMaterial color={color} transparent opacity={0.5} emissive={color} emissiveIntensity={0.8} />
        </mesh>
    );
}

export default function R3FLiveMapScreen() {
    return (
        <LinearGradient colors={['#2C3E50', '#1A252F']} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>3D Live Truck Route (R3F)</Text>
                <Text style={styles.subTitle}>Simulating Mapusa Route in WebGL</Text>
            </View>
            <View style={styles.canvasContainer}>
                <Canvas camera={{ position: [0, 8, 12], fov: 45 }}>
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} />
                    
                    <Road />
                    <AnimatedCar />
                    
                    {/* Simulated Heatmap Zones for Garbage Density */}
                    <Hotspot position={[-4, 0.5, -4]} color={'red'} />
                    <Hotspot position={[3, 0.5, 2]} color={'orange'} />
                    <Hotspot position={[-1, 0.5, 4]} color={'yellow'} />
                </Canvas>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: SPACING.xxl * 1.5,
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
    },
    title: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    subTitle: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        marginTop: 5,
    },
    canvasContainer: {
        flex: 1,
        borderRadius: RADIUS.lg,
        margin: SPACING.md,
        overflow: 'hidden',
        backgroundColor: '#111820', // darker backdrop for canvas
    }
});
