import * as THREE from 'three';

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

const EAGLE_COUNT = 3;
const EAGLE_SPEED = 0.5;

export class GrandCanyon {
    constructor() {
        this.group = new THREE.Group();
        this.eagles = [];

        // Materials: Golden ochres
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: '#d4b872', // Golden ochre base
            roughness: 0.9,
            metalness: 0.1,
            flatShading: false
        });

        // Custom Shader Injection for Canyon Terrain
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

                // Base V-shape canyon based on x position
                float distFromCenter = abs(position.x);
                // The further from center, the higher it goes
                float baseElevation = pow(distFromCenter * 0.2, 1.5) * 2.0;

                // Add noise for rugged cliffs
                float noiseElevation = snoise(position.xy * 0.15) * 2.0;
                noiseElevation += snoise(position.xy * 0.5) * 0.5;

                float totalElevation = baseElevation + noiseElevation;

                // Lower the center river bed slightly
                if (distFromCenter < 5.0) {
                    totalElevation -= smoothstep(5.0, 0.0, distFromCenter) * 2.0;
                }

                transformed.z += totalElevation;

                vElevation = totalElevation;
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
                vec3 lowColor = vec3(0.5, 0.6, 0.65); // Cool mist blue for river
                vec3 highColor = vec3(0.85, 0.65, 0.3); // Bright golden ochre for peaks

                float mixFactor = smoothstep(-2.0, 8.0, vElevation);
                diffuseColor.rgb = mix(lowColor, highColor, mixFactor);
                `
            );
        };

        const eagleMaterial = new THREE.MeshBasicMaterial({
            color: '#1a1a1a', // Dark silhouette
            side: THREE.DoubleSide
        });

        // Ground
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 80, 256, 256),
            groundMaterial
        );
        ground.rotation.x = -Math.PI * 0.5;
        ground.position.y = -5; // Move canyon down a bit
        ground.receiveShadow = true;
        this.group.add(ground);

        // Eagles (simple birds)
        for(let i = 0; i < EAGLE_COUNT; i++) {
            // Very simple bird shape (V shape using two thin boxes or one cone)
            const eagle = new THREE.Mesh(
                new THREE.ConeGeometry(0.5, 1.5, 3), // Simple triangle shape
                eagleMaterial
            );

            // Flatten to look like wings
            eagle.scale.set(1, 0.1, 1);
            eagle.rotation.x = Math.PI * 0.5; // Flat

            const startX = (Math.random() - 0.5) * 40;
            const startZ = (Math.random() - 0.5) * 40;
            const height = 15 + Math.random() * 10;

            eagle.position.set(startX, height, startZ);

            this.group.add(eagle);

            this.eagles.push({
                mesh: eagle,
                baseX: startX,
                baseZ: startZ,
                height: height,
                offset: Math.random() * Math.PI * 2,
                radius: 10 + Math.random() * 15,
                speed: EAGLE_SPEED * (0.5 + Math.random() * 0.5)
            });
        }
    }

    update(time) {
        // Slowly glide eagles in large circles
        this.eagles.forEach(eagle => {
            const t = time * eagle.speed + eagle.offset;
            eagle.mesh.position.x = eagle.baseX + Math.sin(t) * eagle.radius;
            eagle.mesh.position.z = eagle.baseZ + Math.cos(t) * eagle.radius;
            // Slight height variation
            eagle.mesh.position.y = eagle.height + Math.sin(t * 0.5) * 2.0;

            // Point in direction of movement
            const dx = Math.cos(t) * eagle.radius;
            const dz = -Math.sin(t) * eagle.radius;
            eagle.mesh.rotation.y = Math.atan2(dx, dz);
        });
    }
}
