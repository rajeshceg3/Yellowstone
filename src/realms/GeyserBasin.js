import * as THREE from 'three';

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
        this.group.add(ground);

        // Geysers (simple cylinders/cones)
        for(let i = 0; i < 8; i++) {
            const height = 0.5 + Math.random() * 1.5;
            const radius = 0.3 + Math.random() * 0.7;
            const geyser = new THREE.Mesh(
                new THREE.CylinderGeometry(radius * 0.6, radius, height, 16, 1, true),
                geyserMaterial
            );

            // Random position but avoid center too much
            const angle = Math.random() * Math.PI * 2;
            const dist = 2 + Math.random() * 8;

            geyser.position.x = Math.sin(angle) * dist;
            geyser.position.z = Math.cos(angle) * dist;
            geyser.position.y = height * 0.5; // Sit on ground

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
