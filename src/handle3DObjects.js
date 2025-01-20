import * as THREE from 'three';

/**
 * Adds 3D objects (point cloud, mesh, outer ring) to the scene.
 * @param {THREE.Scene} scene - The Three.js scene.
 * @param {Object} visualizations - Prediction data with vertices and indices.
 * @param {Object} config - Configuration for the 3D objects, including `invertDepth` to flip depth.
 */
export function add3DObjectsToScene(scene, visualizations, config) {
	const { vertices, indices } = visualizations;

	if (!vertices || !indices) {
		console.error('Vertices or indices missing in visualizations');
		return;
	}

	const offsetY = config.baseElevation;
	const adjustedPointSize = config.pointSize * 0.1 * config.scaleFactor;
	const adjustedVertices = vertices.map(
		(v, i) => (i % 3 === 2 && config.invertDepth ? -v : v) * config.scaleFactor
	);

	try {
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(adjustedVertices, 3));
		const material = new THREE.PointsMaterial({
			color: config.pointColor,
			size: adjustedPointSize
		});
		const points = new THREE.Points(geometry, material);
		// points.rotation.x = -Math.PI / 2;
		// points.position.y += offsetY;
		scene.add(points);
		// console.log('3D Point Cloud added');
	} catch (error) {
		console.error('Error adding point cloud:', error);
	}

	try {
		const meshGeometry = new THREE.BufferGeometry();
		meshGeometry.setAttribute('position', new THREE.Float32BufferAttribute(adjustedVertices, 3));
		meshGeometry.setIndex(indices);
		const meshMaterial = new THREE.MeshBasicMaterial({
			color: config.triangulationColor,
			wireframe: true
		});
		const mesh = new THREE.Mesh(meshGeometry, meshMaterial);
		// mesh.rotation.x = -Math.PI / 2;
		// mesh.position.y += offsetY;
		scene.add(mesh);
		// console.log('3D Wireframe Mesh added');
		return mesh; // Return the mesh so it can be toggled
	} catch (error) {
		console.error('Error adding wireframe mesh:', error);
	}
}
/**
 * Generates a fully UV-textured face model and adds it to the scene.
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} visualizations - Prediction data with vertices and indices
 * @param {HTMLImageElement} textureImage - The loaded image to use as a texture
 */
export function generateUVTexturedFace(scene, visualizations, textureImage, config) {
	const { vertices, indices } = visualizations;

	if (!vertices || !indices) {
		console.error('Vertices or indices missing for UV mapping.');
		return;
	}

	const adjustedVertices = vertices.map(
		(v, i) => (i % 3 === 2 && config.invertDepth ? -v : v) * config.scaleFactor
	);

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.Float32BufferAttribute(adjustedVertices, 3));
	geometry.setIndex(indices);

	const uvs = [];
	for (let i = 0; i < vertices.length; i += 3) {
		const x = vertices[i] / textureImage.width + 0.5;
		const y = vertices[i + 1] / textureImage.height + 0.5;
		uvs.push(x, y);
	}
	geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

	const texture = new THREE.Texture(textureImage);
	texture.needsUpdate = true;
	const material = new THREE.MeshBasicMaterial({
		map: texture,
		side: THREE.DoubleSide
	});

	const faceMesh = new THREE.Mesh(geometry, material);
	// faceMesh.rotation.x = -Math.PI / 2;
	// faceMesh.position.y = config.baseElevation;
	scene.add(faceMesh);
	// console.log('Textured UV-mapped 3D Face Model added to the scene.');
	return faceMesh; // Return the mesh so it can be toggled
}

/**
 * Retrieves the vertices from the visualizations object.
 * @param {Object} visualizations - Prediction data with vertices and indices.
 * @returns {Array} - Array of vertices.
 */
export function getVertices(visualizations) {
	return visualizations.vertices || [];
}

/**
 * Retrieves the edges from the visualizations object.
 * @param {Object} visualizations - Prediction data with vertices and indices.
 * @returns {Array} - Array of edges.
 */
export function getEdges(visualizations) {
	const { indices } = visualizations;
	if (!indices) return [];

	const edges = [];
	for (let i = 0; i < indices.length; i += 3) {
		edges.push([indices[i], indices[i + 1]]);
		edges.push([indices[i + 1], indices[i + 2]]);
		edges.push([indices[i + 2], indices[i]]);
	}
	return edges;
}

/**
 * Retrieves the faces from the visualizations object.
 * @param {Object} visualizations - Prediction data with vertices and indices.
 * @returns {Array} - Array of faces.
 */
export function getFaces(visualizations) {
	const { indices } = visualizations;
	if (!indices) return [];

	const faces = [];
	for (let i = 0; i < indices.length; i += 3) {
		faces.push([indices[i], indices[i + 1], indices[i + 2]]);
	}
	return faces;
}
/**
 * Converts vertices to a 3D points mesh.
 * @param {Object} visualizations - Prediction data with vertices and indices.
 * @param {Object} config - Configuration for the 3D objects.
 * @returns {THREE.Points} - 3D points mesh.
 */
export function getVerticesMesh(visualizations, config) {
	const { vertices } = visualizations;
	if (!vertices) return null;

	const adjustedVertices = vertices.map(
		(v, i) => (i % 3 === 2 && config.invertDepth ? -v : v) * config.scaleFactor
	);

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.Float32BufferAttribute(adjustedVertices, 3));
	const material = new THREE.PointsMaterial({
		color: config.pointColor,
		size: config.pointSize * 0.1 * config.scaleFactor
	});
	return new THREE.Points(geometry, material);
}

/**
 * Converts edges to a 3D line segments mesh.
 * @param {Object} visualizations - Prediction data with vertices and indices.
 * @param {Object} config - Configuration for the 3D objects.
 * @returns {THREE.LineSegments} - 3D line segments mesh.
 */
export function getEdgesMesh(visualizations, config) {
	const { vertices, indices } = visualizations;
	if (!vertices || !indices) return null;

	const adjustedVertices = vertices.map(
		(v, i) => (i % 3 === 2 && config.invertDepth ? -v : v) * config.scaleFactor
	);

	const edges = [];
	for (let i = 0; i < indices.length; i += 3) {
		edges.push(indices[i], indices[i + 1]);
		edges.push(indices[i + 1], indices[i + 2]);
		edges.push(indices[i + 2], indices[i]);
	}

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.Float32BufferAttribute(adjustedVertices, 3));
	geometry.setIndex(edges);
	const material = new THREE.LineBasicMaterial({ color: config.edgeColor });
	return new THREE.LineSegments(geometry, material);
}

/**
 * Converts faces to a 3D mesh.
 * @param {Object} visualizations - Prediction data with vertices and indices.
 * @param {Object} config - Configuration for the 3D objects.
 * @returns {THREE.Mesh} - 3D mesh.
 */
export function getFacesMesh(visualizations, config) {
	const { vertices, indices } = visualizations;
	if (!vertices || !indices) return null;

	const adjustedVertices = vertices.map(
		(v, i) => (i % 3 === 2 && config.invertDepth ? -v : v) * config.scaleFactor
	);

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.Float32BufferAttribute(adjustedVertices, 3));
	geometry.setIndex(indices);
	const material = new THREE.MeshBasicMaterial({
		color: config.faceColor,
		side: THREE.DoubleSide,
		wireframe: config.wireframe
	});
	return new THREE.Mesh(geometry, material);
}

/**
 * Adds a vertices mesh to the scene.
 * @param {THREE.Scene} scene - The Three.js scene.
 * @param {Object} visualizations - Prediction data with vertices and indices.
 * @param {Object} config - Configuration for the 3D objects.
 */
export function addVerticesMeshToScene(scene, visualizations, config) {
	const verticesMesh = getVerticesMesh(visualizations, config);
	if (verticesMesh) {
		scene.add(verticesMesh);
	}
}

/**
 * Adds an edges mesh to the scene.
 * @param {THREE.Scene} scene - The Three.js scene.
 * @param {Object} visualizations - Prediction data with vertices and indices.
 * @param {Object} config - Configuration for the 3D objects.
 */
export function addEdgesMeshToScene(scene, visualizations, config) {
	const edgesMesh = getEdgesMesh(visualizations, config);
	if (edgesMesh) {
		scene.add(edgesMesh);
	}
}

/**
 * Adds a faces mesh to the scene.
 * @param {THREE.Scene} scene - The Three.js scene.
 * @param {Object} visualizations - Prediction data with vertices and indices.
 * @param {Object} config - Configuration for the 3D objects.
 */
export function addFacesMeshToScene(scene, visualizations, config) {
	const facesMesh = getFacesMesh(visualizations, config);
	if (facesMesh) {
		scene.add(facesMesh);
	}
}
