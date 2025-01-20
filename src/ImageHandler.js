import * as THREE from 'three';

/**
 * Adds an uploaded image as a textured plane to the 3D scene at the specified position
 * with its original aspect ratio.
 * @param {THREE.Scene} scene - The main 3D scene
 * @param {File} imageFile - The uploaded image file
 * @param {THREE.Vector3} position - The position of the image plane in the scene
 * @returns {Promise<boolean>} - Resolves to true if image loads successfully, false otherwise
 */
export function addImageToScene(scene, imageFile, position = new THREE.Vector3(0, 0, 0)) {
	return new Promise((resolve) => {
		const reader = new FileReader();

		reader.onload = function (event) {
			const imageUrl = event.target.result;
			const textureLoader = new THREE.TextureLoader();

			const img = new Image();
			img.src = imageUrl;

			img.onload = function () {
				const aspectRatio = img.width / img.height;
				const width = 10; // Define a base width
				const height = width / aspectRatio;

				textureLoader.load(
					imageUrl,
					(texture) => {
						const geometry = new THREE.PlaneGeometry(width, height);
						const material = new THREE.MeshBasicMaterial({
							map: texture,
							side: THREE.DoubleSide,
							transparent: true
						});
						const plane = new THREE.Mesh(geometry, material);

						plane.position.copy(position);
						// plane.rotation.x = -Math.PI / 2;
						scene.add(plane);

						// console.log('Plane added to scene with original aspect ratio');
						resolve(true); // Image loaded successfully
					},
					undefined,
					(error) => {
						console.error('Error loading image texture:', error);
						resolve(false); // Image loading failed
					}
				);
			};
		};

		if (imageFile) {
			reader.readAsDataURL(imageFile);
		} else {
			console.warn('No image file provided');
			resolve(false);
		}
	});
}

/**
 * Loads an image from a URL.
 * @param {string} url - The URL of the image to load.
 * @returns {Promise<HTMLImageElement>} A promise that resolves to the loaded image.
 */
export function loadImage(url) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'Anonymous';
		img.src = url;
		img.onload = () => resolve(img);
		img.onerror = (error) => {
			console.error(`Failed to load image from URL: ${url}`, error);
			reject(error);
		};
	});
}
