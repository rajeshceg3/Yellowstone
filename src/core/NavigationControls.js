import * as THREE from 'three';

export class NavigationControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;

        // Configuration
        this.lookSpeed = 0.002;
        this.movementSpeed = 15.0; // Base speed
        this.sprintMultiplier = 2.5;
        this.acceleration = 10.0;
        this.deceleration = 10.0;

        // State
        this.isLocked = false;

        // Euler for camera rotation
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.euler.setFromQuaternion(camera.quaternion);

        // Movement state
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        // Input state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
            sprint: false
        };

        // Touch state
        this.touchLook = {
            active: false,
            identifier: null,
            lastX: 0,
            lastY: 0
        };

        this.touchMove = {
            active: false,
            identifier: null,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0
        };

        this.init();
    }

    init() {
        // Pointer Lock
        this.domElement.addEventListener('click', this.onClick.bind(this));
        document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));

        // Keyboard
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));

        // Touch
        this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this));
        this.domElement.addEventListener('touchcancel', this.onTouchEnd.bind(this));
    }

    onClick() {
        if (!this.isLocked) {
            this.domElement.requestPointerLock();
        }

        // Hide hint if it exists
        const hint = document.getElementById('instruction-hint');
        if (hint) {
            hint.style.opacity = '0';
        }
    }

    onPointerLockChange() {
        this.isLocked = document.pointerLockElement === this.domElement;
    }

    onMouseMove(event) {
        if (!this.isLocked) return;

        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        this.euler.y -= movementX * this.lookSpeed;
        this.euler.x -= movementY * this.lookSpeed;

        // Clamp vertical rotation
        this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));

        this.camera.quaternion.setFromEuler(this.euler);
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.keys.forward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.backward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.up = true;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.sprint = true;
                break;
            case 'KeyC':
            case 'ControlLeft':
            case 'ControlRight':
                this.keys.down = true;
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.keys.forward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.backward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.up = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.sprint = false;
                break;
            case 'KeyC':
            case 'ControlLeft':
            case 'ControlRight':
                this.keys.down = false;
                break;
        }
    }

    onTouchStart(event) {
        // Prevent default to stop scrolling
        if (event.cancelable) event.preventDefault();

        const halfWidth = window.innerWidth / 2;

        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];

            if (touch.clientX > halfWidth) {
                // Right side - Look
                if (!this.touchLook.active) {
                    this.touchLook.active = true;
                    this.touchLook.identifier = touch.identifier;
                    this.touchLook.lastX = touch.clientX;
                    this.touchLook.lastY = touch.clientY;
                }
            } else {
                // Left side - Move
                if (!this.touchMove.active) {
                    this.touchMove.active = true;
                    this.touchMove.identifier = touch.identifier;
                    this.touchMove.startX = touch.clientX;
                    this.touchMove.startY = touch.clientY;
                    this.touchMove.currentX = touch.clientX;
                    this.touchMove.currentY = touch.clientY;
                }
            }
        }

        // Hide hint if it exists
        const hint = document.getElementById('instruction-hint');
        if (hint) {
            hint.style.opacity = '0';
        }
    }

    onTouchMove(event) {
        if (event.cancelable) event.preventDefault();

        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];

            if (this.touchLook.active && touch.identifier === this.touchLook.identifier) {
                const deltaX = touch.clientX - this.touchLook.lastX;
                const deltaY = touch.clientY - this.touchLook.lastY;

                // Adjust touch sensitivity
                const touchSensitivity = this.lookSpeed * 2.0;

                this.euler.y -= deltaX * touchSensitivity;
                this.euler.x -= deltaY * touchSensitivity;
                this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));

                this.camera.quaternion.setFromEuler(this.euler);

                this.touchLook.lastX = touch.clientX;
                this.touchLook.lastY = touch.clientY;
            } else if (this.touchMove.active && touch.identifier === this.touchMove.identifier) {
                this.touchMove.currentX = touch.clientX;
                this.touchMove.currentY = touch.clientY;
            }
        }
    }

    onTouchEnd(event) {
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];

            if (this.touchLook.active && touch.identifier === this.touchLook.identifier) {
                this.touchLook.active = false;
                this.touchLook.identifier = null;
            } else if (this.touchMove.active && touch.identifier === this.touchMove.identifier) {
                this.touchMove.active = false;
                this.touchMove.identifier = null;
            }
        }
    }

    update(delta) {
        // Calculate intended direction based on inputs
        this.direction.set(0, 0, 0);

        // Keyboard inputs
        if (this.keys.forward) this.direction.z -= 1;
        if (this.keys.backward) this.direction.z += 1;
        if (this.keys.left) this.direction.x -= 1;
        if (this.keys.right) this.direction.x += 1;

        // Vertical movement
        if (this.keys.up) this.direction.y += 1;
        if (this.keys.down) this.direction.y -= 1;

        // Touch inputs (Virtual Joystick)
        if (this.touchMove.active) {
            const dx = this.touchMove.currentX - this.touchMove.startX;
            const dy = this.touchMove.currentY - this.touchMove.startY;

            // Max radius for virtual joystick
            const maxRadius = 50;

            // Deadzone
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 5) {
                const normalizedX = Math.max(-1, Math.min(1, dx / maxRadius));
                const normalizedY = Math.max(-1, Math.min(1, dy / maxRadius));

                this.direction.x += normalizedX;
                this.direction.z += normalizedY;
            }
        }

        // Normalize direction if length > 1
        if (this.direction.lengthSq() > 1) {
            this.direction.normalize();
        }

        // Apply speed multiplier
        let currentSpeed = this.movementSpeed;
        if (this.keys.sprint) {
            currentSpeed *= this.sprintMultiplier;
        }

        const targetVelocity = this.direction.clone().multiplyScalar(currentSpeed);

        // Apply acceleration / deceleration
        const accel = this.direction.lengthSq() > 0 ? this.acceleration : this.deceleration;

        this.velocity.x += (targetVelocity.x - this.velocity.x) * accel * delta;
        this.velocity.y += (targetVelocity.y - this.velocity.y) * accel * delta;
        this.velocity.z += (targetVelocity.z - this.velocity.z) * accel * delta;

        // Move camera
        // Right vector
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        // Forward vector (flattened to XZ plane if we don't want to fly, but we want slow drift so full 3D)
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        // Up vector
        const up = new THREE.Vector3(0, 1, 0);

        // Flatten forward and right for purely horizontal WASD movement
        forward.y = 0;
        forward.normalize();
        right.y = 0;
        right.normalize();

        // Calculate actual movement
        const moveVector = new THREE.Vector3()
            .addScaledVector(right, this.velocity.x * delta)
            .addScaledVector(up, this.velocity.y * delta)
            .addScaledVector(forward, -this.velocity.z * delta);

        this.camera.position.add(moveVector);
    }
}
