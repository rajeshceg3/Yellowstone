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
    }

    update(time) {
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
