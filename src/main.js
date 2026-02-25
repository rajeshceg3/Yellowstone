import './style.css';
import { Experience } from './core/Experience.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas.webgl');
    if (canvas) {
        const experience = new Experience(canvas);
    }
});
