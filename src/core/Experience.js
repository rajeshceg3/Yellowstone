import * as THREE from 'three';
import { NavigationControls } from './NavigationControls.js';
import { GeyserBasin } from '../realms/GeyserBasin.js';
import { PrismaticSprings } from '../realms/PrismaticSprings.js';
import { GrandCanyon } from '../realms/GrandCanyon.js';
import { LamarValley } from '../realms/LamarValley.js';
import { CalderaDepth } from '../realms/CalderaDepth.js';
import { AudioSystem } from './AudioSystem.js';

const GEYSER_COLOR = new THREE.Color('#dcdcdc');
const PRISMATIC_COLOR = new THREE.Color('#e0f0ff'); // Cool mist blue
const CANYON_COLOR = new THREE.Color('#8ca6b5'); // Cool mist blues / golden ochres
const VALLEY_COLOR = new THREE.Color('#c2d1c7'); // Muted sage / early morning haze
const CALDERA_COLOR = new THREE.Color('#3d2817'); // Dim ambers / volcanic glow through fog

const DWELL_TIME = 15;
const TRANSITION_DURATION = 20;
const CYCLE_TIME = DWELL_TIME + TRANSITION_DURATION;

const REALM_NAMES = ["Geyser Basin", "Prismatic Spring", "Grand Canyon", "Lamar Valley", "Caldera Depth"];
const REALM_COLORS = [GEYSER_COLOR, PRISMATIC_COLOR, CANYON_COLOR, VALLEY_COLOR, CALDERA_COLOR];

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

        // Navigation Controls
        this.navigationControls = new NavigationControls(this.camera, this.canvas);

        // Realms
        this.geyserBasin = new GeyserBasin();
        this.scene.add(this.geyserBasin.group);

        this.prismaticSprings = new PrismaticSprings();
        this.prismaticSprings.group.position.z = -50;
        this.scene.add(this.prismaticSprings.group);

        this.grandCanyon = new GrandCanyon();
        this.grandCanyon.group.position.z = -100;
        this.scene.add(this.grandCanyon.group);

        this.lamarValley = new LamarValley();
        this.lamarValley.group.position.z = -150;
        this.scene.add(this.lamarValley.group);

        this.calderaDepth = new CalderaDepth();
        this.calderaDepth.group.position.z = -200;
        this.scene.add(this.calderaDepth.group);

        // Transition State
        this.currentRealmIndex = 0;

        // Audio System
        this.audioSystem = new AudioSystem();

        this.hasEntered = false;

        // UI Initialization
        const enterButton = document.getElementById('enter-button');
        if (enterButton) {
            enterButton.addEventListener('click', () => {
                this.hasEntered = true;

                // Init audio
                if (this.audioSystem) {
                    this.audioSystem.init();
                }

                // Hide intro screen
                const introScreen = document.getElementById('intro-screen');
                if (introScreen) {
                    introScreen.style.opacity = '0';
                    introScreen.style.pointerEvents = 'none';
                    setTimeout(() => introScreen.remove(), 2000);
                }

                // Show initial cinematic title
                this.showCinematicTitle(REALM_NAMES[0]);
            });
        }

        // Resize handling
        this.boundResize = this.resize.bind(this);
        window.addEventListener('resize', this.boundResize);

        // Start loop
        this.tick();
    }

    showCinematicTitle(title) {
        const titleEl = document.getElementById('cinematic-title');
        const titleTextEl = document.getElementById('cinematic-title-text');

        if (!titleEl || !titleTextEl) return;

        titleTextEl.innerText = title;
        titleEl.style.opacity = '1';

        // Clear existing timeout if present to avoid overlap
        if (this.titleTimeout) {
            clearTimeout(this.titleTimeout);
        }

        this.titleTimeout = setTimeout(() => {
            titleEl.style.opacity = '0';
        }, 4000); // Wait 4 seconds then fade out
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
        const delta = this.clock.getDelta(); // This will give us time since last frame for physics
        const elapsedTime = this.clock.elapsedTime;

        // We use an internal delta for navigation to be independent of clock getElapsedTime calls
        const currentDelta = delta > 0.1 ? 0.016 : delta;

        this.navigationControls.update(currentDelta || 0.016);

        if (this.geyserBasin) this.geyserBasin.update(elapsedTime);
        if (this.prismaticSprings) this.prismaticSprings.update(elapsedTime);
        if (this.grandCanyon) this.grandCanyon.update(elapsedTime);
        if (this.lamarValley) this.lamarValley.update(elapsedTime);
        if (this.calderaDepth) this.calderaDepth.update(elapsedTime);

        // Environmental Transition based on camera Z
        const camZ = this.camera.position.z;

        // Determine which two realms we are between based on camZ
        // Each realm is 50 units apart: 0, -50, -100, -150, -200

        // Find which interval we are in
        let intervalIndex = Math.max(0, Math.min(3, Math.floor(-camZ / 50)));
        let startZ = -(intervalIndex * 50) - 10; // Start transition a bit early
        let endZ = -(intervalIndex * 50) - 40;   // End before reaching next realm center

        let progress = 0;
        if (camZ < startZ && camZ > endZ) {
             progress = (camZ - startZ) / (endZ - startZ);
        } else if (camZ <= endZ) {
            progress = 1.0;
        }

        // Color interpolation
        const startColor = REALM_COLORS[intervalIndex];
        const endColor = REALM_COLORS[intervalIndex + 1];

        this.scene.background.lerpColors(startColor, endColor, progress);
        this.scene.fog.color.copy(this.scene.background);

        // Fog Density: Thick steam wall in the middle of transition
        let targetDensity = 0.05;
        if (progress > 0 && progress < 1) {
            if (progress < 0.5) {
                targetDensity = THREE.MathUtils.lerp(0.05, 0.08, progress * 2);
            } else {
                targetDensity = THREE.MathUtils.lerp(0.08, 0.04, (progress - 0.5) * 2);
            }
        } else if (progress === 1) {
            targetDensity = 0.04; // Baseline for next realm
        }

        // In deep caldera we want thicker baseline fog
        if (camZ < -190) {
            targetDensity = THREE.MathUtils.lerp(0.04, 0.06, (-camZ - 190) / 10);
        }

        this.scene.fog.density = targetDensity;

        // Audio Volumes update
        if (this.audioSystem) {
            this.audioSystem.updateVolumes(intervalIndex, progress);
        }

        // Update UI Text
        let activeNameIndex = intervalIndex;
        if (progress > 0.5) activeNameIndex++;

        const regionNameEl = document.getElementById('region-name');

        // Initial setup for region name to avoid undefined logic check
        if (this.hasEntered && regionNameEl && regionNameEl.innerText.toUpperCase() !== REALM_NAMES[activeNameIndex].toUpperCase() && !this.isFadingText) {
            // Simple fade out/in effect for corner text
            this.isFadingText = true;
            regionNameEl.style.opacity = 0;
            setTimeout(() => {
                regionNameEl.innerText = REALM_NAMES[activeNameIndex];
                regionNameEl.style.opacity = 1;
                this.isFadingText = false;
            }, 1000);

            // Also trigger the cinematic center text when entering a new realm
            this.showCinematicTitle(REALM_NAMES[activeNameIndex]);
        }

        this.renderer.render(this.scene, this.camera);
        window.requestAnimationFrame(() => this.tick());
    }
}
