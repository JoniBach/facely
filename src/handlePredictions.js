import * as tf from '@tensorflow/tfjs';
// Import only the CPU backend
import '@tensorflow/tfjs-backend-cpu';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import TRIANGULATION from './TRIANGULATION.json';
import OUTERRING from './OUTERRING.json';

/**
 * Initialize CPU backend and face landmarks detector
 * @returns {Promise<Object>} - A promise that resolves to the face detector model
 */
async function initializeDetector() {
	try {
		// console.log('Initializing CPU backend...');
		await tf.setBackend('cpu'); // Force use of CPU
		await tf.ready();
		// console.log('CPU backend initialized successfully.');

		// console.log('Initializing face landmarks detector...');
		const detector = await faceLandmarksDetection.createDetector(
			faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
			{
				runtime: 'tfjs',
				maxFaces: 1,
				modelType: 'short', // Use a smaller model for better CPU performance
				enableSmoothing: true
			}
		);
		// console.log('Detector initialized successfully.');
		return detector;
	} catch (error) {
		console.error('Failed to initialize CPU or detector:', error);
		throw error;
	}
}

/**
 * Perform facial landmark detection on an image and generate visualization data.
 * @param {string} imageUrl - The URL of the image to process
 * @param {Object} [config={}] - Configuration options for visual customization
 * @returns {Promise<Object>} - An object with visualization images as data URLs, vertices, and indices
 */
export async function handlePredictions(imageUrl, config = {}) {
	try {
		// console.log('Loading image from URL:', imageUrl);
		const image = await loadImage(imageUrl);
		const width = image.width;
		const height = image.height;

		if (!width || !height) {
			console.error('Failed to load image, dimensions are invalid.');
			return { error: 'Failed to load image, dimensions are invalid.' };
		}

		const detector = await initializeDetector();
		// console.log('Running face detection...');
		const predictions = await detector.estimateFaces(image, {
			flipHorizontal: false
		});

		if (!predictions || !predictions.length) {
			console.warn('No faces detected in the image.');
			return { error: 'No faces detected' };
		}

		const keypoints = predictions[0].keypoints;

		if (!keypoints || keypoints.length === 0) {
			console.error('No keypoints detected.');
			return { error: 'No keypoints detected' };
		}

		const { vertices, indices } = calculateVerticesAndIndices(keypoints, width, height);
		if (!vertices || !indices) {
			console.error('Failed to calculate vertices or indices.');
			return { error: 'Failed to calculate vertices or indices' };
		}

		// console.log('Generating visualization canvases...');
		const keypointsCanvas = createCanvas(width, height);
		const outerRingCanvas = createCanvas(width, height);
		const triangulationCanvas = createCanvas(width, height);
		const combinedCanvas = createCanvas(width, height);

		drawKeypoints(
			keypointsCanvas.getContext('2d'),
			keypoints,
			config.pointSize || 2,
			config.pointColor || 'red'
		);
		drawOuterRing(
			outerRingCanvas.getContext('2d'),
			keypoints,
			config.outerRingColor || 'blue',
			config.outerRingWidth || 2
		);
		drawTriangulation(
			triangulationCanvas.getContext('2d'),
			keypoints,
			config.triangulationColor || 'green',
			config.triangulationWidth || 1
		);
		drawCombinedOverlay(combinedCanvas.getContext('2d'), keypoints, config);

		// console.log('Visualization completed successfully.');
		return {
			keypointsImage: keypointsCanvas.toDataURL(),
			outerRingImage: outerRingCanvas.toDataURL(),
			triangulationImage: triangulationCanvas.toDataURL(),
			combinedImage: combinedCanvas.toDataURL(),
			vertices,
			indices
		};
	} catch (error) {
		console.error('Error during prediction processing:', error);
		return { error: error.message };
	}
}

/**
 * Utility function to create and configure a new canvas
 * @param {number} width - Width of the canvas
 * @param {number} height - Height of the canvas
 * @returns {HTMLCanvasElement} - The created canvas
 */
function createCanvas(width, height) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	return canvas;
}

/**
 * Utility function to load an image from a URL
 * @param {string} url - The URL of the image to load
 * @returns {Promise<HTMLImageElement>} - A promise that resolves to the loaded image
 */
function loadImage(url) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'Anonymous';
		img.src = url;
		img.onload = () => resolve(img);
		img.onerror = () => {
			console.error('Failed to load image from URL:', url);
			reject(new Error('Failed to load image from URL'));
		};
	});
}

/**
 * Draw keypoints on the given canvas context
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
 * @param {Array<Object>} keypoints - Array of facial keypoints
 * @param {number} [pointSize=2] - Radius of the keypoints
 * @param {string} [pointColor='red'] - Color of the keypoints
 */
function drawKeypoints(ctx, keypoints, pointSize = 2, pointColor = 'red') {
	if (!ctx || !Array.isArray(keypoints)) {
		console.error('Invalid context or keypoints data for drawing.');
		return;
	}
	ctx.fillStyle = pointColor;
	keypoints.forEach(({ x, y }) => {
		if (typeof x === 'number' && typeof y === 'number') {
			ctx.beginPath();
			ctx.arc(x, y, pointSize, 0, 2 * Math.PI);
			ctx.fill();
		} else {
			console.warn('Invalid keypoint coordinates:', { x, y });
		}
	});
}

/**
 * Draw the outer ring around the face
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
 * @param {Array<Object>} keypoints - Array of facial keypoints
 * @param {string} [outerRingColor='blue'] - Color of the outer ring
 * @param {number} [outerRingWidth=2] - Width of the outer ring lines
 */
function drawOuterRing(ctx, keypoints, outerRingColor = 'blue', outerRingWidth = 2) {
	if (!OUTERRING || !Array.isArray(OUTERRING)) {
		console.error('OUTERRING is not defined or is not an array.');
		return;
	}

	ctx.strokeStyle = outerRingColor;
	ctx.lineWidth = outerRingWidth;
	ctx.beginPath();

	OUTERRING.forEach((index, i) => {
		const { x, y } = keypoints[index];
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	});

	ctx.closePath();
	ctx.stroke();
}

/**
 * Draw triangulation lines connecting keypoints
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
 * @param {Array<Object>} keypoints - Array of facial keypoints
 * @param {string} [triangulationColor='green'] - Color of the triangulation lines
 * @param {number} [triangulationWidth=1] - Width of the triangulation lines
 */
function drawTriangulation(ctx, keypoints, triangulationColor = 'green', triangulationWidth = 1) {
	if (!ctx || !Array.isArray(keypoints) || !Array.isArray(TRIANGULATION)) {
		console.error('Invalid context, keypoints, or triangulation data for drawing.');
		return;
	}

	ctx.strokeStyle = triangulationColor;
	ctx.lineWidth = triangulationWidth;

	for (let i = 0; i < TRIANGULATION.length; i += 3) {
		const [i1, i2, i3] = [TRIANGULATION[i], TRIANGULATION[i + 1], TRIANGULATION[i + 2]];
		const p1 = keypoints[i1];
		const p2 = keypoints[i2];
		const p3 = keypoints[i3];

		if (p1 && p2 && p3) {
			ctx.beginPath();
			ctx.moveTo(p1.x, p1.y);
			ctx.lineTo(p2.x, p2.y);
			ctx.lineTo(p3.x, p3.y);
			ctx.closePath();
			ctx.stroke();
		} else {
			console.warn('Invalid keypoints for triangulation:', { p1, p2, p3 });
		}
	}
}

/**
 * Draw a combined overlay with keypoints, outer ring, and triangulation
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
 * @param {Array<Object>} keypoints - Array of facial keypoints
 * @param {Object} config - Configuration options for visual customization
 */
function drawCombinedOverlay(ctx, keypoints, config) {
	drawTriangulation(
		ctx,
		keypoints,
		config.triangulationColor || 'green',
		config.triangulationWidth || 1
	);
	drawOuterRing(ctx, keypoints, config.outerRingColor || 'blue', config.outerRingWidth || 2);
	drawKeypoints(ctx, keypoints, config.pointSize || 2, config.pointColor || 'red');
}

/**
 * Calculate 3D vertices and indices from keypoints
 * @param {Array<Object>} keypoints - Array of facial keypoints
 * @param {number} width - Width of the image
 * @param {number} height - Height of the image
 * @returns {Object} - An object containing vertices and indices for 3D rendering
 */
function calculateVerticesAndIndices(keypoints, width, height) {
	if (!Array.isArray(keypoints)) {
		console.error('Invalid keypoints data:', keypoints);
		return { vertices: null, indices: null };
	}

	const vertices = [];
	keypoints.forEach(({ x, y, z }) => {
		vertices.push(x - width / 2, -(y - height / 2), z || 0);
	});

	if (!Array.isArray(TRIANGULATION)) {
		console.error('TRIANGULATION data is invalid:', TRIANGULATION);
		return { vertices: null, indices: null };
	}

	const indices = [];
	for (let i = 0; i < TRIANGULATION.length; i += 3) {
		indices.push(TRIANGULATION[i], TRIANGULATION[i + 1], TRIANGULATION[i + 2]);
	}

	return { vertices, indices };
}
