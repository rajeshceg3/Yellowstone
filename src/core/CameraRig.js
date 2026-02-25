import * as THREE from 'three';

export class CameraRig {
    constructor(camera) {
        this.camera = camera;
        this.time = 0;

        // Base position to return to or drift around
        this.basePosition = this.camera.position.clone();
    }

    update() {
        this.time += 0.002; // Slow time scale for "drift"

        // Gentle floating movement
        // Using different frequencies for x, y, z to avoid looping feeling
        const driftX = Math.sin(this.time * 0.5) * 0.5;
        const driftY = Math.sin(this.time * 0.3) * 0.2;
        const driftZ = Math.cos(this.time * 0.4) * 0.5;

        this.camera.position.x = this.basePosition.x + driftX;
        this.camera.position.y = this.basePosition.y + driftY;
        this.camera.position.z = this.basePosition.z + driftZ;
    }
}
