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

const BISON_COUNT = 6;
const WOLF_COUNT = 4;
const BISON_SPEED = 0.05;

export class LamarValley {
    constructor() {
        this.group = new THREE.Group();
        this.bison = [];

        // Materials: Muted sage
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: '#8f9e8b', // Muted sage base
            roughness: 0.95,
            metalness: 0.05,
            flatShading: false
        });

        // Custom Shader Injection for Rolling Hills Terrain
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

                // Very gentle rolling hills
                float noiseElevation = snoise(position.xy * 0.05) * 4.0;
                noiseElevation += snoise(position.xy * 0.15) * 1.5;

                transformed.z += noiseElevation;

                vElevation = noiseElevation;
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
                vec3 lowColor = vec3(0.5, 0.6, 0.5); // Deep green
                vec3 highColor = vec3(0.7, 0.75, 0.6); // Lighter sage

                float mixFactor = smoothstep(-2.0, 4.0, vElevation);
                diffuseColor.rgb = mix(lowColor, highColor, mixFactor);
                `
            );
        };

        const bisonMaterial = new THREE.MeshStandardMaterial({
            color: '#3b2f2f', // Dark brown
            roughness: 1.0,
            metalness: 0.0
        });

        const wolfMaterial = new THREE.MeshBasicMaterial({
            color: '#2b2b2b' // Dark silhouette for distant wolves
        });

        // Ground
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100, 128, 128),
            groundMaterial
        );
        ground.rotation.x = -Math.PI * 0.5;
        ground.position.y = -2; // Slightly lower ground
        ground.receiveShadow = true;
        this.group.add(ground);

        // Bison (slow-moving dark box-like shapes)
        for(let i = 0; i < BISON_COUNT; i++) {
            // Simple bulky body
            const bisonMesh = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 1.2, 2.5),
                bisonMaterial
            );

            const startX = (Math.random() - 0.5) * 30;
            const startZ = (Math.random() - 0.5) * 30;

            // Lift above ground
            bisonMesh.position.set(startX, 0.6 - 2, startZ);

            this.group.add(bisonMesh);

            this.bison.push({
                mesh: bisonMesh,
                baseX: startX,
                baseZ: startZ,
                speed: BISON_SPEED * (0.8 + Math.random() * 0.4),
                offset: Math.random() * Math.PI * 2,
                wanderRadius: 5 + Math.random() * 10
            });
        }

        // Wolves (distant, small, dark, static formations)
        const wolfGroup = new THREE.Group();
        for(let i = 0; i < WOLF_COUNT; i++) {
            const wolfMesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.6, 1.2),
                wolfMaterial
            );

            // Group them roughly together
            wolfMesh.position.set(
                (Math.random() - 0.5) * 5,
                0.3 - 2,
                (Math.random() - 0.5) * 5
            );
            wolfGroup.add(wolfMesh);
        }

        // Place wolves far away
        wolfGroup.position.set(-35, 0, -25);
        this.group.add(wolfGroup);
    }

    update(time) {
        // Very slow, grounded movement for bison
        this.bison.forEach(bison => {
            const t = time * bison.speed + bison.offset;

            // Slow winding path
            const dx = Math.sin(t) * bison.wanderRadius;
            const dz = Math.cos(t * 0.8) * bison.wanderRadius;

            bison.mesh.position.x = bison.baseX + dx;
            bison.mesh.position.z = bison.baseZ + dz;

            // Slight up and down from terrain (approximated sine wave)
            bison.mesh.position.y = (0.6 - 2) + Math.sin(bison.mesh.position.x * 0.1) * 1.5 + Math.sin(bison.mesh.position.z * 0.15) * 0.5;

            // Point in direction of movement
            const velX = Math.cos(t) * bison.speed * bison.wanderRadius;
            const velZ = -Math.sin(t * 0.8) * bison.speed * bison.wanderRadius * 0.8;
            bison.mesh.rotation.y = Math.atan2(velX, velZ);
        });
    }
}
