import * as THREE from 'three';
import TRIANGULATION from './TRIANGULATION.json';

/**
 * Extract vertices, UV coordinates, and indices based on keypoints.
 * @param {HTMLImageElement} image - The image for scaling reference.
 * @param {Array<Object>} keypoints - Array of keypoints with x, y, and z.
 * @param {number} [depthScale=1] - Scaling factor for z-axis.
 * @returns {Object} - vertices, uvCoordinates, and indices for triangulated mesh.
 */
export function get3DVerticesData(image, keypoints, depthScale = 1) {
	const vertices = [];
	const uvCoordinates = [];

	keypoints.forEach(({ x, y, z }) => {
		vertices.push(x - image.width / 2, -y + image.height / 2, z * depthScale);
		uvCoordinates.push(x / image.width, 1 - y / image.height);
	});

	const indices = [];
	for (let i = 0; i < TRIANGULATION.length; i += 3) {
		indices.push(TRIANGULATION[i], TRIANGULATION[i + 1], TRIANGULATION[i + 2]);
	}

	return { vertices, uvCoordinates, indices };
}

/**
 * Creates a 3D point cloud scene to display keypoints.
 * @param {Array<number>} vertices - 3D positions for each keypoint.
 * @param {Object} config - Configuration for point cloud display.
 * @param {THREE.Scene} scene - The Three.js scene to add points to.
 */
export function createPointCloud(vertices, config, scene) {
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

	const material = new THREE.PointsMaterial({
		color: config.pointCloudColor,
		size: config.pointCloudSize
	});
	const points = new THREE.Points(geometry, material);
	scene.add(points);
}

/**
 * Creates a triangulated mesh based on vertices and indices.
 * @param {Array<number>} vertices - 3D positions for each vertex.
 * @param {Array<number>} indices - Indices for the triangulated mesh.
 * @param {Object} config - Configuration for the mesh material.
 * @param {THREE.Scene} scene - The Three.js scene to add mesh to.
 */
export function createTriangulatedMesh(vertices, indices, config, scene) {
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
	geometry.setIndex(indices);

	const material = new THREE.MeshBasicMaterial({
		color: config.triangulationColor,
		wireframe: config.triangulationWireframe
	});
	const mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);
}

/**
 * Creates an outer ring outline around the face based on the outer ring indices.
 * @param {Array<number>} vertices - 3D positions for each vertex.
 * @param {Array<number>} ringIndices - Indices for outer ring keypoints.
 * @param {Object} config - Configuration for line material.
 * @param {THREE.Scene} scene - The Three.js scene to add the ring to.
 */
export function createOuterRing(vertices, ringIndices, config, scene) {
	const ringPositions = [];
	ringIndices.forEach((idx) => {
		ringPositions.push(vertices[idx * 3], vertices[idx * 3 + 1], vertices[idx * 3 + 2]);
	});

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.Float32BufferAttribute(ringPositions, 3));

	const material = new THREE.LineBasicMaterial({
		color: config.outerRingColor,
		linewidth: config.outerRingWidth
	});

	const ring = new THREE.LineLoop(geometry, material);
	scene.add(ring);
}

/**
 * Initializes the animation loop for multiple scenes.
 * @param {Array<Object>} scenes - Array of { renderer, scene, camera, controls }.
 */
export function animateScenes(scenes) {
	function animate() {
		requestAnimationFrame(animate);
		scenes.forEach((sceneObj) => {
			sceneObj.controls.update();
			sceneObj.renderer.render(sceneObj.scene, sceneObj.camera);
		});
	}
	animate();
}
