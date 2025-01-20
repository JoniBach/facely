// ThreeDScene.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * Initializes the main Three.js scene, including grid and lighting
 * @returns {THREE.Scene} - The main scene object
 */
const initializeMainScene = () => {
	const scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0x202020, 30, 80);
	addGridHelper(scene);
	addLighting(scene);
	return scene;
};

/**
 * Initializes the main camera
 * @param {number} aspectRatio - Aspect ratio of the renderer (width / height)
 * @returns {THREE.PerspectiveCamera} - The main camera
 */
const initializeMainCamera = (aspectRatio) => {
	const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
	camera.position.set(0, 10, 20); // Positioned slightly above and back from the origin
	return camera;
};

/**
 * Initializes the WebGL renderer
 * @param {HTMLCanvasElement} canvas - The canvas element to render on
 * @param {number} width - Width of the renderer
 * @param {number} height - Height of the renderer
 * @param {number} backgroundColor - Background color for the renderer
 * @returns {THREE.WebGLRenderer} - The initialized renderer
 */
const initializeRenderer = (
	canvas,
	width = window.innerWidth,
	height = window.innerHeight,
	backgroundColor
) => {
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setSize(width, height); // Set renderer size to fill the entire viewport or specified dimensions
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setClearColor(backgroundColor);
	return renderer;
};

/**
 * Sets up orbit controls for the camera
 * @param {THREE.PerspectiveCamera} camera - The camera to control
 * @param {THREE.WebGLRenderer} renderer - The renderer attached to the canvas
 * @returns {OrbitControls} - The controls for the camera
 */
const setupOrbitControls = (camera, renderer) => {
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true; // Adds smoothness to the controls
	controls.dampingFactor = 0.05;
	return controls;
};

/**
 * Creates and adds a grid helper to the scene
 * @param {THREE.Scene} scene - The main scene
 */
const addGridHelper = (scene) => {
	const gridHelper = new THREE.GridHelper(100, 100, 0x888888, 0x444444);
	scene.add(gridHelper);
};

/**
 * Adds ambient and directional lighting to the scene
 * @param {THREE.Scene} scene - The main scene
 */
const addLighting = (scene) => {
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
	scene.add(ambientLight);

	const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7); // Stronger directional light
	directionalLight.position.set(5, 10, 7.5);
	scene.add(directionalLight);
};

/**
 * Handles window resizing for the camera and renderer
 * @param {THREE.PerspectiveCamera} camera - The main camera
 * @param {THREE.WebGLRenderer} renderer - The renderer
 * @param {HTMLCanvasElement} canvas - The canvas element
 */
const handleResize = (camera, renderer) => {
	const width = window.innerWidth;
	const height = window.innerHeight;

	camera.aspect = width / height;
	camera.updateProjectionMatrix();
	renderer.setSize(width, height); // Use the full viewport dimensions
};

/**
 * Starts the animation loop for rendering the scene
 * @param {THREE.WebGLRenderer} renderer - The renderer
 * @param {THREE.Scene} scene - The main scene
 * @param {THREE.PerspectiveCamera} camera - The main camera
 * @param {OrbitControls} controls - Camera controls
 */
const startAnimationLoop = (renderer, scene, camera, controls) => {
	const animate = () => {
		requestAnimationFrame(animate);
		controls.update(); // Apply damping (if enabled)
		renderer.render(scene, camera);
	};
	animate();
};

/**
 * Main function to create and initialize the 3D scene
 * @param {Object} params - Configuration parameters
 * @param {HTMLCanvasElement} params.canvas - The canvas element to use for rendering
 * @param {number} [params.width=window.innerWidth] - Width of the renderer
 * @param {number} [params.height=window.innerHeight] - Height of the renderer
 * @param {number} [params.backgroundColor=0x202020] - Background color for the renderer
 * @returns {THREE.Scene} - The initialized main scene
 */
export function createThreeDScene({
	canvas,
	width = window.innerWidth,
	height = window.innerHeight,
	backgroundColor = 0x202020
}) {
	if (!canvas) throw new Error('A canvas element must be provided');

	// Initialize scene, camera, and renderer
	const mainScene = initializeMainScene();
	const mainCamera = initializeMainCamera(width / height);
	const renderer = initializeRenderer(canvas, width, height, backgroundColor);

	// Set up camera controls
	const controls = setupOrbitControls(mainCamera, renderer);

	// Initial call to ensure correct dimensions on load
	handleResize(mainCamera, renderer); // Force resize to set initial dimensions

	// Handle window resize
	window.addEventListener('resize', () => handleResize(mainCamera, renderer));

	// Start the rendering loop
	startAnimationLoop(renderer, mainScene, mainCamera, controls);

	return mainScene; // Return the scene so that objects can be added to it
}
