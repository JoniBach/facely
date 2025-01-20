import {
	add3DObjectsToScene,
	addEdgesMeshToScene,
	addFacesMeshToScene,
	addVerticesMeshToScene,
	generateUVTexturedFace,
	getEdgesMesh,
	getFacesMesh,
	getVerticesMesh
} from './handle3DObjects.js';
import { handleDepthEstimation } from './handleDepthEstimation.js';
import { processDownloadAssets } from './handleDownloads.js';
import { addImageToScene, loadImage } from './ImageHandler.js';
import { createThreeDScene } from './ThreeDScene.js';

const targetSceneWidth = 10;
const config = {
	pointSize: 3,
	pointColor: 'purple',
	outerRingColor: 'orange',
	outerRingWidth: 3,
	triangulationColor: 'cyan',
	triangulationWidth: 2,
	invertDepth: true,
	scaleFactor: 1,
	baseElevation: 5,
	minDepth: 0,
	maxDepth: 1,
	outputDepthRange: [0, 1],
	invertDepthMap: false,
	depthMapFormat: 'image/png'
};
const overlayTypes = ['combinedImage', 'keypointsImage', 'triangulationImage', 'outerRingImage'];

const reportProgress = (stage, total, message, complete) => {
	const percentage = Math.round(((stage * 2 + (complete ? 1 : 0)) / (total * 2)) * 100);
	const isComplete = stage === total;
	return {
		message,
		percent: isComplete ? (complete ? 100 : 99) : percentage,
		stage: `${stage}/${total}`
	};
};

export const pipeline = async (imageFile, canvas, progress) => {
	const stages = 6;
	// 0. setup
	progress(reportProgress(0, stages, 'setting up...', false));
	let newCanvas = document.createElement('canvas');
	let mainScene = createThreeDScene({
		canvas,
		width: window.innerWidth * 0.8,
		height: window.innerHeight,
		backgroundColor: 0x202020
	});

	let newScene = createThreeDScene({
		canvas: newCanvas,
		width: window.innerWidth * 0.8,
		height: window.innerHeight,
		backgroundColor: 0x202020
	});
	progress(reportProgress(0, stages, 'setting up complete!', true));

	// 1. upload
	progress(reportProgress(1, stages, 'uploading...', false));
	const imageUrl = URL.createObjectURL(imageFile);
	console.log(imageUrl);
	progress(reportProgress(1, stages, 'uploading complete!', true));

	//  2. preview
	progress(reportProgress(2, stages, 'generating preview...', false));
	const img = await loadImage(imageUrl);
	const scaleFactor = targetSceneWidth / img.width;
	config.scaleFactor = scaleFactor;
	console.log(img);
	progress(reportProgress(2, stages, 'preview generated!', true));

	// 3. prediction
	progress(reportProgress(3, stages, 'making predictions...', false));

	const { handlePredictions } = await import('$lib/handlePredictions.js');
	const visualizations = await handlePredictions(imageUrl, config);
	console.log(visualizations);
	progress(reportProgress(3, stages, 'predictions complete!', true));

	// 4. 3d
	progress(reportProgress(4, stages, 'generating 3D objects...', false));
	const uvFaceMesh = generateUVTexturedFace(newScene, visualizations, img, config);
	console.log(uvFaceMesh);
	progress(reportProgress(4, stages, '3D objects generated!', true));

	// 5. depth
	progress(reportProgress(5, stages, 'starting depth estimation...', false));

	const depthEstimationResult = await handleDepthEstimation(imageFile, config);
	console.log(depthEstimationResult);
	progress(reportProgress(5, stages, 'depth estimation complete!', true));
	progress(reportProgress(6, stages, 'reviewing process...', false));
	progress(reportProgress(6, stages, 'process complete!', true));

	return {
		canvas: newCanvas,
		scene: mainScene,
		image: imageFile,
		imageUrl: imageUrl,
		texturedMesh: uvFaceMesh,
		depthmap: depthEstimationResult,

		verticesMesh: getVerticesMesh(visualizations, config),
		edgesMesh: getEdgesMesh(visualizations, config),
		facesMesh: getFacesMesh(visualizations, config),

		add: {
			image: async (scene) => await addImageToScene(scene || mainScene, imageFile),
			wireframe: async (scene) =>
				await add3DObjectsToScene(scene || mainScene, visualizations, config),
			vertices: async (scene) =>
				await addVerticesMeshToScene(scene || mainScene, visualizations, config),
			edges: async (scene) => await addEdgesMeshToScene(scene || mainScene, visualizations, config),
			faces: async (scene) => await addFacesMeshToScene(scene || mainScene, visualizations, config),
			uvFace: async (scene) =>
				await generateUVTexturedFace(scene || mainScene, visualizations, img, config)
		},
		download: async () =>
			await processDownloadAssets(
				imageFile,
				imageUrl,
				depthEstimationResult,
				visualizations,
				uvFaceMesh,
				overlayTypes
			)
	};
};
