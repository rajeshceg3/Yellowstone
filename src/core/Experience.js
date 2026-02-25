import * as THREE from 'three';
import { CameraRig } from './CameraRig.js';
import { GeyserBasin } from '../realms/GeyserBasin.js';

const BACKGROUND_COLOR = new THREE.Color('#dcdcdc');

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
        this.scene.background = BACKGROUND_COLOR;
        this.scene.fog = new THREE.FogExp2(BACKGROUND_COLOR, 0.05);

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
        this.cameraRig.update(elapsedTime);
        if (this.geyserBasin) this.geyserBasin.update(elapsedTime);
        this.renderer.render(this.scene, this.camera);
        window.requestAnimationFrame(() => this.tick());
    }
}
