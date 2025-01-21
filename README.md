# Facely

**Facely** is an npm library for creating 3D face meshes from 2D images in the browser. It combines [TensorFlow.js](https://www.tensorflow.org/js) for face landmarks and depth estimation with [Three.js](https://threejs.org/) for rendering, allowing you to transform standard portrait images into fully textured, 3D UV meshes.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
    - [1. Basic Image Processing](#1-basic-image-processing)
    - [2. Progress Updates](#2-progress-updates)
    - [3. Downloading Assets](#3-downloading-assets)
    - [4. Integration with Three.js](#4-integration-with-threejs)
- [Examples](#examples)
- [Browser Support](#browser-support)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **AI-Powered Face Landmark Detection**: Utilizes TensorFlow.js models for accurate 2D face landmarking.
- **Depth Map Generation**: Leverages Depth Estimation to reconstruct a pseudo-3D mesh from your 2D images.
- **Three.js Integration**: Directly add the generated 3D assets into your Three.js scene or download them for offline use.
- **Progress Tracking**: Receive real-time progress updates during model loading and image processing.
- **One-Click Asset Download**: Export your 3D mesh and associated textures with a single function call.

---

## Installation

Install **Facely** using your favorite package manager:

```bash
npm install facely
```

Facely will automatically load required TensorFlow.js models when needed. You do not need to install or configure these models manually in most cases.

---

## Quick Start

Below is a minimal example showing how to import **Facely** and process a single portrait image.

```js
import { facely } from 'facely';

async function handleImageUpload(imageFile) {
    const face = await facely(imageFile);
    console.log(face);
    return face;
}
```

> **Note**: Large images or low-performance devices may lead to longer processing times.

---

## Usage

### 1. Basic Image Processing

You can pass various image types to `facely` (e.g., File, Blob in the browser, or Buffer in Node). For example, in a web application with a file input:

```html
<input type="file" accept="image/*" onchange="uploadImage(event)" />

<script type="module">
    import { facely } from 'facely';

    async function uploadImage(event) {
        const file = event.target.files[0];
        if (!file) return;

        const face = await facely(file);
        console.log(face);
        // face now contains data to generate a 3D mesh, textures, etc.
    }
</script>
```

### 2. Progress Updates

Processing can take a bit of time, especially if TensorFlow models are being loaded or if the device is resource-limited. Facely provides an optional **progress callback** to help track the current stage of processing:

```js
import { facely } from 'facely';

let progressData = null;

function handleProgress(p) {
    // p has fields like: { stage: string, message: string, percent: number }
    progressData = p;
    console.log(p.stage, p.message, p.percent);
}

async function handleImageUpload(imageFile) {
    const face = await facely(imageFile, handleProgress);
    return face;
}
```

### 3. Downloading Assets

After processing the image, you can directly download all generated 3D assets (mesh, texture, etc.):

```js
const face = await facely(imageFile);

// Downloads a ZIP file containing the mesh and related images
face.download();
```

### 4. Integration with Three.js

Facely is built around [Three.js](https://threejs.org/). Once you have a `face` object from Facely, you can add different 3D representations to your own Three.js scene:

```js
import * as THREE from 'three';
import { facely } from 'facely';

let mainScene = new THREE.Scene();

async function handleImageUpload(imageFile) {
    const face = await facely(imageFile);

    face.add.image(mainScene);      // Adds the plane with the original or generated texture
    face.add.wireframe(mainScene);  // Wireframe version of the face mesh
    face.add.edges(mainScene);      // Edges geometry
    face.add.vertices(mainScene);   // Points representing the vertices of the mesh
    face.add.faces(mainScene);      // Face geometry
    face.add.uvFace(mainScene);     // UV-textured face mesh
}
```

---

## Examples

Below is a broader snippet showcasing file input handling, progress updates, and a download button:

```html
<input type="file" accept="image/*" onchange="{handleFileUpload}" />

<script type="module">
    import { facely } from 'facely';

    let faceResult = null;
    let progress = null;

    async function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        faceResult = await facely(file, (p) => (progress = p));
    }

    function downloadFaceAssets() {
        if (faceResult) {
            faceResult.download();
        }
    }
</script>

<button onclick="downloadFaceAssets()">Download 3D Face</button>
<p>Progress: {progress && progress.percent} %</p>
```

---

## Browser Support

**Facely** relies on modern JavaScript features and [TensorFlow.js](https://www.tensorflow.org/js), which may not be fully supported on some older or mobile browsers. For best results, use the latest versions of Chrome, Firefox, Safari, or Edge.

- **Desktop Browsers**: Latest Chrome, Firefox, Edge, Safari.
- **Mobile Browsers**: Varies by device; performance may degrade on lower-end hardware.

---

## Contributing

Contributions, issues, and feature requests are always welcome!

1. [Fork the repository](https://github.com/JoniBach/facely/fork).
2. Create a new feature branch (`git checkout -b feature/new-feature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/new-feature`).
5. Open a Pull Request to the main branch in the [Facely repository](https://github.com/JoniBach/facely).

---

## License

This project is licensed under the [MIT License](LICENSE). You are free to use it in personal or commercial projects.

---

**Happy Face-Meshing!** Have questions or need help? Check out the [GitHub Issues](https://github.com/JoniBach/facely/issues) or open a new one.
