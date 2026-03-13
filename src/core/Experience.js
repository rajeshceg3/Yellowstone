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

        // UI State
        this.isActive = false; // Only true once user clicks "Enter"

        // Handle Intro Screen
        const enterButton = document.getElementById('enter-button');
        const introScreen = document.getElementById('intro-screen');
        const uiOverlay = document.getElementById('ui-overlay');

        if (enterButton) {
            enterButton.addEventListener('click', () => {
                if (this.audioSystem) {
                    this.audioSystem.init();
                }

                this.isActive = true;

                if (introScreen) {
                    introScreen.style.opacity = '0';
                    setTimeout(() => {
                        introScreen.style.display = 'none';
                        if (uiOverlay) {
                            uiOverlay.style.opacity = '1';
                        }
                    }, 2000);
                }
            }, { once: true });
        }

        // Resize handling
        this.boundResize = this.resize.bind(this);
        window.addEventListener('resize', this.boundResize);

        // Inactivity tracking
        this.lastInteractionTime = Date.now();
        this.uiVisible = true;
        this.uiOverlayElement = document.getElementById('ui-overlay');

        const resetInteractionTimer = () => {
            if (!this.isActive) return;
            this.lastInteractionTime = Date.now();
            if (!this.uiVisible && this.uiOverlayElement) {
                this.uiVisible = true;
                this.uiOverlayElement.style.opacity = '1';
            }
        };

        window.addEventListener('mousemove', resetInteractionTimer);
        window.addEventListener('keydown', resetInteractionTimer);
        window.addEventListener('touchstart', resetInteractionTimer);
        window.addEventListener('touchmove', resetInteractionTimer);

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
        const realmColors = [GEYSER_COLOR, PRISMATIC_COLOR, CANYON_COLOR, VALLEY_COLOR, CALDERA_COLOR];
        const realmNames = ["Geyser Basin", "Prismatic Spring", "Grand Canyon", "Lamar Valley", "Caldera Depth"];
        const realmSubtitles = ["Surface Heat", "Microbial Life", "Golden Echoes", "Open Plains", "Ancient Magma"];

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
        const startColor = realmColors[intervalIndex];
        const endColor = realmColors[intervalIndex + 1];

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
        const regionSubtitleEl = document.getElementById('region-subtitle');

        if (regionNameEl && regionNameEl.innerText.toUpperCase() !== realmNames[activeNameIndex].toUpperCase() && !this.isFadingText) {
            // Cinematic fade out/in effect with tracking
            this.isFadingText = true;

            // Remove the reveal class if it exists and fade out
            regionNameEl.style.opacity = 0;
            if (regionSubtitleEl) regionSubtitleEl.style.opacity = 0;

            setTimeout(() => {
                regionNameEl.classList.remove('cinematic-reveal');
                regionNameEl.style.letterSpacing = '0.1em'; // Reset tracking after fade out

                // Allow a tiny reflow before re-adding the class to ensure animation restarts
                requestAnimationFrame(() => {
                    regionNameEl.innerText = realmNames[activeNameIndex];
                    if (regionSubtitleEl) {
                        regionSubtitleEl.innerText = realmSubtitles[activeNameIndex];
                        regionSubtitleEl.style.opacity = 0.6;
                    }
                    // Trigger the cinematic reveal animation
                    regionNameEl.classList.add('cinematic-reveal');
                    this.isFadingText = false;
                });
            }, 1000);
        }

        // Compass Rotation
        const compassGlyph = document.getElementById('compass-glyph');
        if (compassGlyph) {
            // Convert camera Y rotation to degrees
            const degrees = THREE.MathUtils.radToDeg(this.camera.rotation.y);
            compassGlyph.style.transform = `rotate(${degrees}deg)`;
        }

        // Inactivity UI Fade
        if (this.isActive && this.uiVisible) {
            const idleTime = Date.now() - this.lastInteractionTime;
            if (idleTime > 8000) { // 8 seconds of inactivity
                this.uiVisible = false;
                if (this.uiOverlayElement) {
                    this.uiOverlayElement.style.opacity = '0';
                }
            }
        }

        this.renderer.render(this.scene, this.camera);
        window.requestAnimationFrame(() => this.tick());
    }
}
