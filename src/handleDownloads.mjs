import JSZip from 'jszip';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
/**
 * Downloads assets (images, depth map, and 3D model) as a zip file.
 * @param {File} imageFile - The uploaded image file.
 * @param {string} imageUrl - The URL of the uploaded image.
 * @param {HTMLCanvasElement} depthMapImage - The generated depth map.
 * @param {object} visualizations - Visualization data (overlays, etc.).
 * @param {THREE.Mesh} uvFaceMesh - The 3D mesh with UV texturing.
 * @param {Array<string>} overlayTypes - List of overlay types to include in the download.
 */
export async function processDownloadAssets(
	imageFile,
	imageUrl,
	depthMapImage,
	visualizations,
	uvFaceMesh,
	overlayTypes
) {
	try {
		const zip = new JSZip();
		const assetsFolder = zip.folder('downloads');

		const promises = [];

		// Add base image
		if (imageFile) {
			promises.push(
				fetch(imageUrl)
					.then((res) => res.blob())
					.then((blob) => assetsFolder.file('base-image.png', blob))
			);
		}

		// Add depth map
		if (depthMapImage) {
			const depthMapBlobUrl = URL.createObjectURL(depthMapImage);
			promises.push(
				fetch(depthMapBlobUrl)
					.then((res) => res.blob())
					.then((blob) => assetsFolder.file('displacement-map.png', blob))
			);
		}

		// Add overlays
		for (const overlay of overlayTypes) {
			if (visualizations[overlay]) {
				promises.push(
					fetch(visualizations[overlay])
						.then((res) => res.blob())
						.then((blob) => assetsFolder.file(`${overlay}.png`, blob))
				);
			}
		}

		// Add 3D model
		if (uvFaceMesh) {
			promises.push(
				new Promise((resolve, reject) => {
					const exporter = new GLTFExporter();
					exporter.parse(
						uvFaceMesh,
						(result) => {
							const blob = new Blob([JSON.stringify(result)], { type: 'application/json' });
							assetsFolder.file('3d-model.glb', blob);
							resolve();
						},
						{ binary: true }
					);
				})
			);
		}

		await Promise.all(promises);

		const zipBlob = await zip.generateAsync({ type: 'blob' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(zipBlob);
		link.download = 'downloads.zip';
		link.click();
	} catch (error) {
		console.error('Error downloading assets:', error);
		throw new Error('Failed to download assets.');
	}
}
