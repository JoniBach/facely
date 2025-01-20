import '@tensorflow/tfjs-backend-webgl';
import * as depthEstimation from '@tensorflow-models/depth-estimation';
import * as THREE from 'three';

/**
 * Generates a depth map from the uploaded image file.
 * @param {File} imageFile - The uploaded image file.
 * @param {Object} config - Configuration object for depth estimation.
 * @param {number} config.minDepth - Minimum depth value.
 * @param {number} config.maxDepth - Maximum depth value.
 * @param {Array<number>} [config.outputDepthRange=[0, 1]] - Output range for the depth map.
 * @param {boolean} [config.invertDepthMap=false] - Whether to invert the depth map.
 * @param {string} [config.format='image/png'] - Desired output file format (e.g., 'image/png').
 * @returns {Promise<Blob>} A promise resolving to a Blob of the generated depth map.
 */
export async function handleDepthEstimation(imageFile, config) {
	try {
		const imageBitmap = await createImageBitmap(imageFile);

		// Initialize the depth estimator model
		const depthEstimator = await depthEstimation.createEstimator(
			depthEstimation.SupportedModels.ARPortraitDepth
		);

		// Estimate depth with the provided configuration
		const depthMap = await depthEstimator.estimateDepth(imageBitmap, {
			minDepth: config.minDepth,
			maxDepth: config.maxDepth,
			outputDepthRange: config.outputDepthRange || [0, 1]
		});

		// Create a canvas to draw the depth map
		const canvas = document.createElement('canvas');
		canvas.width = imageBitmap.width;
		canvas.height = imageBitmap.height;

		const ctx = canvas.getContext('2d');
		const depthImageSource = await depthMap.toCanvasImageSource();

		// Draw the depth map onto the canvas
		ctx.drawImage(depthImageSource, 0, 0);

		// If invertDepthMap is true, invert the depth map
		if (config.invertDepthMap) {
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const data = imageData.data;

			// Invert the pixel values
			for (let i = 0; i < data.length; i += 4) {
				data[i] = 255 - data[i]; // Invert Red
				data[i + 1] = 255 - data[i + 1]; // Invert Green
				data[i + 2] = 255 - data[i + 2]; // Invert Blue
				// Alpha (data[i + 3]) remains unchanged
			}

			ctx.putImageData(imageData, 0, 0);
		}

		// Convert the canvas to a Blob
		return new Promise((resolve, reject) => {
			canvas.toBlob((blob) => {
				if (blob) {
					resolve(blob); // Resolve with the Blob
				} else {
					reject(new Error('Failed to generate Blob from depth map.'));
				}
			}, config.depthMapFormat || 'image/png');
		});
	} catch (error) {
		console.error('Error estimating depth map:', error);
		throw error;
	}
}

/**
 * Applies a displacement map to the UV-mapped face model and adds it to the scene.
 * @param {THREE.Scene} scene - The Three.js scene.
 * @param {Object} visualizations - Prediction data with vertices and indices.
 * @param {HTMLImageElement} textureImage - The original UV texture image.
 * @param {Blob} depthMapBlob - Blob containing the depth map.
 * @param {Object} config - Configuration options, including scale factor for displacement.
 */

export async function applyDisplacementToUVFace(
	scene,
	visualizations,
	textureImage,
	depthMapBlob,
	config
) {
	const { vertices, indices } = visualizations;

	if (!vertices || !indices) {
		console.error('Vertices or indices missing for UV mapping.');
		return;
	}

	// Convert depth map blob to a texture
	const depthMapUrl = URL.createObjectURL(depthMapBlob);
	const depthMapTexture = await new THREE.TextureLoader().loadAsync(depthMapUrl);

	// Create a high-resolution geometry
	let faceGeometry = new THREE.BufferGeometry();
	const adjustedVertices = vertices.map(
		(v, i) => (i % 3 === 2 && config.invertDepth ? -v : v) * config.scaleFactor
	);

	faceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(adjustedVertices, 3));
	faceGeometry.setIndex(indices);

	// Generate UV mapping for the texture
	const uvs = [];
	for (let i = 0; i < vertices.length; i += 3) {
		const x = vertices[i] / textureImage.width + 0.5;
		const y = vertices[i + 1] / textureImage.height + 0.5;
		uvs.push(x, y);
	}
	faceGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

	// Subdivide geometry for better displacement
	faceGeometry = faceGeometry.toNonIndexed(); // Ensure the geometry is not indexed
	faceGeometry.computeVertexNormals(); // Compute vertex normals for proper lighting

	// Load the UV texture
	const uvTexture = new THREE.Texture(textureImage);
	uvTexture.needsUpdate = true;

	// Create the material with the displacement map
	const faceMaterial = new THREE.MeshStandardMaterial({
		map: uvTexture,
		displacementMap: depthMapTexture,
		displacementScale: config.scaleFactor, // Adjust scale for displacement depth
		side: THREE.DoubleSide
	});

	// Create the mesh and apply displacement
	const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
	faceMesh.rotation.x = -Math.PI / 2; // Align the mesh
	faceMesh.position.y = config.baseElevation;

	// Add the mesh to the scene
	scene.add(faceMesh);
	console.log('Displacement applied to UV-mapped 3D face model.');
	return faceMesh; // Return the mesh for further manipulation if needed
}
