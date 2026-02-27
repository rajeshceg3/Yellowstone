import * as THREE from 'three';

const DRIFT_SPEED = 0.12;
const DRIFT_FREQ_X = 0.5;
const DRIFT_AMP_X = 0.5;
const DRIFT_FREQ_Y = 0.3;
const DRIFT_AMP_Y = 0.2;
const DRIFT_FREQ_Z = 0.4;
const DRIFT_AMP_Z = 0.5;

export class CameraRig {
    constructor(camera) {
        this.camera = camera;
        this.basePosition = this.camera.position.clone();

        // Transition variables
        this.isTransitioning = false;
        this.transitionStartTime = 0;
        this.transitionDuration = 0;
        this.startPosition = new THREE.Vector3();
        this.targetPosition = new THREE.Vector3();
    }

    transitionTo(targetPosition, duration, time) {
        this.isTransitioning = true;
        this.transitionStartTime = time;
        this.transitionDuration = duration;
        this.startPosition.copy(this.basePosition);
        this.targetPosition.copy(targetPosition);
    }

    update(time) {
        // Handle Transition
        if (this.isTransitioning) {
            const elapsed = time - this.transitionStartTime;
            const progress = Math.min(elapsed / this.transitionDuration, 1.0);

            // Smoothstep for ease-in-out feel
            const smoothProgress = progress * progress * (3 - 2 * progress);

            this.basePosition.lerpVectors(this.startPosition, this.targetPosition, smoothProgress);

            if (progress >= 1.0) {
                this.isTransitioning = false;
            }
        }

        const t = time * DRIFT_SPEED;

        // Gentle floating movement
        // Using different frequencies for x, y, z to avoid looping feeling
        const driftX = Math.sin(t * DRIFT_FREQ_X) * DRIFT_AMP_X;
        const driftY = Math.sin(t * DRIFT_FREQ_Y) * DRIFT_AMP_Y;
        const driftZ = Math.cos(t * DRIFT_FREQ_Z) * DRIFT_AMP_Z;

        this.camera.position.x = this.basePosition.x + driftX;
        this.camera.position.y = this.basePosition.y + driftY;
        this.camera.position.z = this.basePosition.z + driftZ;
    }
}
