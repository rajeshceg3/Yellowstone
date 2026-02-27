import * as THREE from 'three';
import { SteamColumn } from './effects/SteamColumn.js';

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

export class PrismaticSprings {
    constructor() {
        this.group = new THREE.Group();
        this.steamColumns = [];

        // Materials
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: '#b0a090', // Mineral ground color
            roughness: 0.8,
            metalness: 0.2,
            flatShading: false
        });

        // Custom Shader Injection for Pools
        groundMaterial.onBeforeCompile = (shader) => {
            // Inject Noise
            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>
                ${NOISE_GLSL}
                varying float vElevation;
                varying vec2 vUv;
                `
            );

            // Inject Displacement (gentle rolling)
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                vUv = uv;

                // Terrain noise
                float elevation = snoise(position.xy * 0.1) * 1.0;

                // Pools are depressions
                float poolNoise = snoise(position.xy * 0.2);
                if(poolNoise < -0.2) {
                    elevation -= 0.5; // Dig deeper for pools
                }

                transformed.z += elevation;

                vElevation = elevation;
                `
            );

            // Inject Color variation
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `#include <common>
                varying float vElevation;
                varying vec2 vUv;
                ${NOISE_GLSL}
                `
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <color_fragment>',
                `
                #include <color_fragment>

                // Colors
                vec3 mineralColor = vec3(0.7, 0.65, 0.6); // Ground
                vec3 poolCenterColor = vec3(0.0, 0.8, 0.9); // Turquoise
                vec3 poolEdgeColor = vec3(0.9, 0.5, 0.1); // Amber/Rust

                float poolNoise = snoise(vUv * 20.0); // Need to match frequency roughly with vertex but UV is different scale usually
                // Let's use world position approximation or just recompute noise?
                // Recomputing noise in fragment is expensive but fine for this demo.
                // However, we passed vElevation.

                // Pools are low elevation
                float poolFactor = smoothstep(-0.8, 0.0, vElevation);

                // Gradient: Deep pool (low) -> Edge (mid) -> Ground (high)
                vec3 poolColor = mix(poolCenterColor, poolEdgeColor, smoothstep(-1.5, -0.5, vElevation));

                diffuseColor.rgb = mix(poolColor, mineralColor, poolFactor);
                `
            );
        };

        // Ground
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(60, 60, 128, 128),
            groundMaterial
        );
        ground.rotation.x = -Math.PI * 0.5;
        ground.receiveShadow = true;
        this.group.add(ground);

        // Add some steam vents (lower, wider)
        for(let i = 0; i < 5; i++) {
            const height = 2 + Math.random() * 2;
            const radius = 1.5 + Math.random() * 1.0;
            const steam = new SteamColumn(height, radius);

            const angle = Math.random() * Math.PI * 2;
            const dist = 5 + Math.random() * 15;

            steam.mesh.position.set(
                Math.sin(angle) * dist,
                0.5,
                Math.cos(angle) * dist
            );

            this.group.add(steam.mesh);
            this.steamColumns.push(steam);
        }

        // Lighting (Realm specific - can add local lights)
        // Global light from Experience will handle main lighting, but we can add local point lights for pools?
        // Let's keep it simple for performance first.
    }

    update(time) {
        this.steamColumns.forEach(steam => steam.update(time));
    }
}
