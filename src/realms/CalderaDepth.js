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

export class CalderaDepth {
    constructor() {
        this.group = new THREE.Group();

        // Materials: Dim ambers, volcanic glow
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: '#2a1b12', // Dark, cool amber/brown
            roughness: 0.9,
            metalness: 0.2,
            flatShading: true // Gives a rocky, faceted look
        });

        // Custom Shader Injection for Fissures
        groundMaterial.onBeforeCompile = (shader) => {
            // Add uniforms
            shader.uniforms.uTime = { value: 0 };

            // Store uniforms for updates
            this.uniforms = shader.uniforms;

            // Inject Noise
            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>
                ${NOISE_GLSL}
                varying float vElevation;
                varying vec2 vUv;
                `
            );

            // Inject Displacement
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                vUv = uv;

                // Deep, sharp displacement for crust
                float noiseElevation = snoise(position.xy * 0.1) * 3.0;
                // Add jagged detail
                noiseElevation += abs(snoise(position.xy * 0.3)) * 2.0;

                transformed.z += noiseElevation;

                vElevation = noiseElevation;
                `
            );

            // Inject Color variation and Emission (Magma glow)
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `#include <common>
                varying float vElevation;
                varying vec2 vUv;
                uniform float uTime;
                ${NOISE_GLSL}
                `
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <color_fragment>',
                `
                #include <color_fragment>

                // Mix colors based on elevation
                vec3 magmaColor = vec3(1.0, 0.2, 0.0); // Bright orange/red
                vec3 darkCrust = vec3(0.1, 0.05, 0.02); // Almost black brown

                // Deep fissures are lower in elevation
                // Pulsating magma glow
                float pulse = sin(uTime * 0.5) * 0.5 + 0.5;
                float magmaFactor = smoothstep(-1.0, -3.0, vElevation);

                // Add flowing noise to magma
                float magmaNoise = snoise(vec2(vUv.x * 20.0, vUv.y * 20.0 + uTime * 0.1)) * 0.5 + 0.5;

                // Final magma glow with pulse and noise
                vec3 finalMagma = magmaColor * magmaNoise * (0.8 + pulse * 0.2) * 2.0;

                // Mix base color with magma in the deep cracks
                diffuseColor.rgb = mix(darkCrust, finalMagma, magmaFactor * 0.9);
                `
            );
        };

        // Ground
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 80, 128, 128),
            groundMaterial
        );
        ground.rotation.x = -Math.PI * 0.5;
        ground.position.y = -8; // Lowest realm
        ground.receiveShadow = true;
        this.group.add(ground);

        // Add a central soft point light to illuminate the dark crust
        const magmaLight = new THREE.PointLight('#ff4500', 0.5, 40);
        magmaLight.position.set(0, -6, 0);
        this.group.add(magmaLight);
    }

    update(time) {
        if (this.uniforms) {
            this.uniforms.uTime.value = time;
        }
    }
}
