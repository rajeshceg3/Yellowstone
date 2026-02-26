import * as THREE from 'three';
import { SteamColumn } from './effects/SteamColumn.js';

const GEYSER_COUNT = 8;
const GEYSER_MIN_HEIGHT = 0.5;
const GEYSER_HEIGHT_RANGE = 1.5;
const GEYSER_MIN_RADIUS = 0.3;
const GEYSER_RADIUS_RANGE = 0.7;
const GEYSER_MIN_DIST = 2;
const GEYSER_DIST_RANGE = 8;
const GEYSER_TOP_RADIUS_RATIO = 0.6;

// GLSL Noise function
const NOISE_GLSL = `
// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

export class GeyserBasin {
    constructor() {
        this.group = new THREE.Group();
        this.steamColumns = [];

        // Materials matching "Warm whites, mineral pastels"
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: '#e8e4dc', // Warm white/grey
            roughness: 0.9,
            metalness: 0.1,
            flatShading: false
        });

        // Custom Shader Injection for Terrain
        groundMaterial.onBeforeCompile = (shader) => {
            // Inject Noise
            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>
                ${NOISE_GLSL}
                varying float vElevation;
                `
            );

            // Inject Displacement
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>

                // Terrain noise
                float elevation = snoise(position.xy * 0.15) * 1.5;
                elevation += snoise(position.xy * 0.5) * 0.3;

                transformed.z += elevation;

                vElevation = elevation;
                `
            );

            // Inject Color variation
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `#include <common>
                varying float vElevation;
                `
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <color_fragment>',
                `
                #include <color_fragment>

                // Mix colors based on elevation
                vec3 lowColor = vec3(0.68, 0.85, 0.9); // Pale cyan/blue for dips
                vec3 highColor = vec3(0.95, 0.92, 0.88); // Warm white/ochre for peaks

                float mixFactor = smoothstep(-1.0, 1.5, vElevation);
                diffuseColor.rgb = mix(lowColor, highColor, mixFactor);
                `
            );
        };

        const geyserMaterial = new THREE.MeshStandardMaterial({
            color: '#dcdcdc',
            roughness: 0.9,
            side: THREE.DoubleSide
        });

        // Ground
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(60, 60, 128, 128),
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
            // Lift slightly to avoid being buried too deep in noise dips,
            // though exact matching requires CPU noise evaluation.
            geyser.position.y = (height * 0.5) + 0.5;

            geyser.castShadow = true;
            this.group.add(geyser);

            // Add Steam
            const steamHeight = height * 4.0 + Math.random() * 3.0;
            const steam = new SteamColumn(steamHeight, radius);
            steam.mesh.position.copy(geyser.position);
            steam.mesh.position.y += height * 0.5; // Start at top of geyser
            this.group.add(steam.mesh);
            this.steamColumns.push(steam);
        }

        // Lighting (Realm specific)
        const ambientLight = new THREE.AmbientLight('#ffffff', 0.8); // Increased from 0.6
        this.group.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight('#fff0dd', 1.5); // Decreased from 2
        directionalLight.position.set(10, 15, 10);
        directionalLight.castShadow = true;
        this.group.add(directionalLight);
    }

    update(time) {
        this.steamColumns.forEach(steam => steam.update(time));
    }
}
