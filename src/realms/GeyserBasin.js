import * as THREE from 'three';

const GEYSER_COUNT = 8;
const GEYSER_MIN_HEIGHT = 0.5;
const GEYSER_HEIGHT_RANGE = 1.5;
const GEYSER_MIN_RADIUS = 0.3;
const GEYSER_RADIUS_RANGE = 0.7;
const GEYSER_MIN_DIST = 2;
const GEYSER_DIST_RANGE = 8;
const GEYSER_TOP_RADIUS_RATIO = 0.6;

export class GeyserBasin {
    constructor() {
        this.group = new THREE.Group();

        // Materials matching "Warm whites, mineral pastels"
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: '#e8e4dc', // Warm white/grey
            roughness: 0.9,
            metalness: 0.1
        });

        const geyserMaterial = new THREE.MeshStandardMaterial({
            color: '#dcdcdc',
            roughness: 0.9,
            side: THREE.DoubleSide
        });

        // Ground
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(60, 60, 64, 64),
            groundMaterial
        );
        ground.rotation.x = -Math.PI * 0.5;
        ground.receiveShadow = true;
        this.group.add(ground);

        // Geysers (simple cylinders/cones)
        for(let i = 0; i < GEYSER_COUNT; i++) {
            const height = GEYSER_MIN_HEIGHT + Math.random() * GEYSER_HEIGHT_RANGE;
            const radius = GEYSER_MIN_RADIUS + Math.random() * GEYSER_RADIUS_RANGE;
            const geyser = new THREE.Mesh(
                new THREE.CylinderGeometry(radius * GEYSER_TOP_RADIUS_RATIO, radius, height, 16, 1, true),
                geyserMaterial
            );

            // Random position but avoid center too much
            const angle = Math.random() * Math.PI * 2;
            const dist = GEYSER_MIN_DIST + Math.random() * GEYSER_DIST_RANGE;

            geyser.position.x = Math.sin(angle) * dist;
            geyser.position.z = Math.cos(angle) * dist;
            geyser.position.y = height * 0.5; // Sit on ground
            geyser.castShadow = true;

            this.group.add(geyser);
        }

        // Lighting (Realm specific)
        const ambientLight = new THREE.AmbientLight('#ffffff', 0.6);
        this.group.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight('#fff0dd', 2);
        directionalLight.position.set(10, 15, 10);
        directionalLight.castShadow = true;
        this.group.add(directionalLight);
    }

    update(time) {
        // Placeholder for future updates (steam, etc)
    }
}
