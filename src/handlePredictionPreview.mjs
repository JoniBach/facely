import * as THREE from 'three';

/**
 * Configuration for visualization styles.
 * @typedef {Object} VisualizationConfig
 * @property {number} pointSize - Size of the keypoint dots.
 * @property {string} pointColor - Color of the keypoint dots.
 * @property {string} outerRingColor - Color of the outer ring.
 * @property {number} outerRingWidth - Width of the outer ring lines.
 * @property {string} triangulationColor - Color of the triangulation lines.
 * @property {number} triangulationWidth - Width of the triangulation lines.
 */

/**
 * Load a texture from a URL.
 * @param {string} url - The URL of the image.
 * @returns {Promise<THREE.Texture>} A promise that resolves with the loaded texture.
 */
export function loadTexture(url) {
	return new Promise((resolve, reject) => {
		const loader = new THREE.TextureLoader();
		loader.load(url, resolve, undefined, reject);
	});
}

/**
 * Create a plane mesh for a given texture with specified dimensions.
 * @param {THREE.Texture} texture - The texture to apply to the plane.
 * @param {number} width - The width of the plane.
 * @param {number} height - The height of the plane.
 * @param {number} positionY - The Y position of the plane in the scene.
 * @returns {THREE.Mesh} The created plane mesh.
 */
export function createPlaneMesh(texture, width, height, positionY) {
	const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
	const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
	plane.rotation.x = -Math.PI / 2; // Rotate to lay flat
	plane.position.set(0, positionY, 0);
	return plane;
}

/**
 * Add an image overlay to the Three.js scene.
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @param {string} imageUrl - URL of the overlay image.
 * @param {number} baseWidth - Width of the plane.
 * @param {number} baseHeight - Height of the plane.
 * @param {number} positionY - Y-axis position offset for stacking layers.
 * @returns {Promise<void>} A promise that resolves when the overlay is added.
 */
export async function addOverlay(scene, imageUrl, baseWidth, baseHeight, positionY) {
	try {
		const texture = await loadTexture(imageUrl);
		const plane = createPlaneMesh(texture, baseWidth, baseHeight, positionY);
		scene.add(plane);
	} catch (error) {
		console.error(`Error loading texture from ${imageUrl}:`, error);
	}
}

/**
 * Add multiple overlays (e.g., triangulation, outer ring, keypoints) to the scene in a specified order.
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @param {Object} visualizations - Object containing URLs for each overlay.
 * @param {boolean} showTriangulation - Whether to show the triangulation overlay.
 * @param {boolean} showOuterRing - Whether to show the outer ring overlay.
 * @param {boolean} showKeypoints - Whether to show the keypoints overlay.
 * @param {number} imageAspectRatio - Aspect ratio (width / height) of the image.
 * @param {number} baseHeight - Base height for the plane.
 * @returns {Promise<void>} A promise that resolves when all overlays are added.
 */
export async function addOverlaysToScene(
	scene,
	visualizations,
	showTriangulation,
	showOuterRing,
	showKeypoints,
	imageAspectRatio,
	baseHeight = 10
) {
	const baseWidth = baseHeight * imageAspectRatio;
	let positionY = 0.01;

	if (showTriangulation && visualizations.triangulationImage) {
		await addOverlay(scene, visualizations.triangulationImage, baseWidth, baseHeight, positionY);
		positionY += 0.005;
	}

	if (showOuterRing && visualizations.outerRingImage) {
		await addOverlay(scene, visualizations.outerRingImage, baseWidth, baseHeight, positionY);
		positionY += 0.005;
	}

	if (showKeypoints && visualizations.keypointsImage) {
		await addOverlay(scene, visualizations.keypointsImage, baseWidth, baseHeight, positionY);
	}
}

/**
 * Handle uploading an image and converting it to a URL.
 * @param {Event} event - The file upload event.
 * @returns {string} The image URL created from the uploaded file.
 */
export function handleImageUpload(event) {
	const imageFile = event.detail.file;
	return URL.createObjectURL(imageFile);
}

/**
 * Remove all overlay images from the Three.js scene.
 * @param {THREE.Scene} scene - The main Three.js scene.
 */
export function clearScene(scene) {
	scene.children = scene.children.filter((child) => !(child.isMesh && child.material.map));
}
