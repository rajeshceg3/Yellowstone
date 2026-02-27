import * as THREE from 'three';
import { CameraRig } from './CameraRig.js';
import { GeyserBasin } from '../realms/GeyserBasin.js';
import { PrismaticSprings } from '../realms/PrismaticSprings.js';

const GEYSER_COLOR = new THREE.Color('#dcdcdc');
const PRISMATIC_COLOR = new THREE.Color('#e0f0ff'); // Cool mist blue

export class Experience {
    constructor(canvas) {
        this.canvas = canvas;
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        this.clock = new THREE.Clock();

        // Scene setup
        this.scene = new THREE.Scene();
        // Atmospheric background color (matches Geyser Basin vibe: warm white/grey)
        this.scene.background = GEYSER_COLOR.clone();
        this.scene.fog = new THREE.FogExp2(GEYSER_COLOR, 0.05);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(35, this.sizes.width / this.sizes.height, 0.1, 100);
        this.camera.position.set(0, 2, 8);
        this.scene.add(this.camera);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // Camera Rig
        this.cameraRig = new CameraRig(this.camera);

        // Realms
        this.geyserBasin = new GeyserBasin();
        this.scene.add(this.geyserBasin.group);

        this.prismaticSprings = new PrismaticSprings();
        this.prismaticSprings.group.position.z = -50; // Position it further out
        this.scene.add(this.prismaticSprings.group);

        // Transition State
        this.transitionTriggered = false;

        // Resize handling
        this.boundResize = this.resize.bind(this);
        window.addEventListener('resize', this.boundResize);

        // Start loop
        this.tick();
    }

    resize() {
        this.sizes.width = window.innerWidth;
        this.sizes.height = window.innerHeight;

        this.camera.aspect = this.sizes.width / this.sizes.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    tick() {
        const elapsedTime = this.clock.getElapsedTime();

        // Auto-transition logic (Demo)
        if (!this.transitionTriggered && elapsedTime > 10) {
            this.transitionTriggered = true;
            console.log("Drifting to Prismatic Springs...");
            // Move to near Prismatic Springs
            this.cameraRig.transitionTo(
                new THREE.Vector3(0, 2, -45),
                20, // Duration in seconds (slow drift)
                elapsedTime
            );
        }

        this.cameraRig.update(elapsedTime);
        if (this.geyserBasin) this.geyserBasin.update(elapsedTime);
        if (this.prismaticSprings) this.prismaticSprings.update(elapsedTime);

        // Environmental Transition based on camera Z
        // Geyser is around 0, Prismatic is around -50.
        // Transition zone: -10 to -40
        const camZ = this.camera.position.z;

        // Normalize progress based on Z position: 0 at start (-10), 1 at end (-40)
        let progress = 0;
        if (camZ < -10) {
             progress = (camZ - (-10)) / (-40 - (-10));
             progress = Math.max(0, Math.min(1, progress));
        }

        // Interpolate Fog
        // Geyser Color -> Prismatic Color
        this.scene.background.lerpColors(GEYSER_COLOR, PRISMATIC_COLOR, progress);
        this.scene.fog.color.copy(this.scene.background);

        // Fog Density: 0.05 -> 0.04 (slightly clearer or different?)
        // Let's make it denser in the middle?
        // Mid-transition (progress 0.5) -> Density 0.08 (thick steam wall)
        // End -> 0.04

        let targetDensity = 0.05;
        if (progress < 0.5) {
            // 0 -> 0.5: 0.05 -> 0.08
            targetDensity = THREE.MathUtils.lerp(0.05, 0.08, progress * 2);
        } else {
            // 0.5 -> 1.0: 0.08 -> 0.04
            targetDensity = THREE.MathUtils.lerp(0.08, 0.04, (progress - 0.5) * 2);
        }
        this.scene.fog.density = targetDensity;


        this.renderer.render(this.scene, this.camera);
        window.requestAnimationFrame(() => this.tick());
    }
}
