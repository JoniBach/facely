/**
 * Returns an object of viewable image URLs for
 * base image, displacement map, and overlays.
 *
 * @param {File} imageFile - The uploaded image file.
 * @param {string} imageUrl - The URL of the uploaded image.
 * @param {HTMLCanvasElement} depthMapImage - The generated depth map.
 * @param {object} visualizations - Visualization data (overlays, etc.).
 * @param {Array<string>} overlayTypes - List of overlay types to include in the result.
 * @returns {Promise<object>} - An object containing Data URLs for the relevant images.
 *
 * Example return format:
 * {
 *   baseImage: "data:image/png;base64, ...",
 *   displacementMap: "data:image/png;base64, ...",
 *   overlays: {
 *       "overlay1": "data:image/png;base64, ...",
 *       "overlay2": "data:image/png;base64, ...",
 *       ...
 *   }
 * }
 */
export async function getViewableImages(
  imageFile,
  imageUrl,
  depthMapImage,
  visualizations,
  overlayTypes
) {
  // Utility function to convert fetch response to Data URL
  async function fetchToDataURL(resource) {
    const res = await fetch(resource);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
  }

  // Result object structure
  const result = {
    baseImage: null,
    displacementMap: null,
    overlays: {},
  };

  // 1. Base image
  if (imageFile && imageUrl) {
    result.baseImage = await fetchToDataURL(imageUrl);
  }

  // 2. Displacement / Depth map image (if using a canvas)
  //    For convenience, convert the canvas to a Blob URL, then fetch to Data URL
  if (depthMapImage) {
    const depthMapBlobUrl = depthMapImage.toDataURL("image/png");
    // Or, if you prefer a Blob object:
    // const depthMapBlob = await new Promise(resolve => depthMapImage.toBlob(resolve, 'image/png'));
    // const depthMapBlobUrl = URL.createObjectURL(depthMapBlob);
    // Then fetch that URL.
    // But if you already have a Data URL from `toDataURL`, you can assign it directly:
    result.displacementMap = depthMapBlobUrl;
  }

  // 3. Overlays
  //    If your `visualizations[overlay]` is a URL, we convert it to Data URL.
  //    If it is already a Data URL, you can assign directly.
  for (const overlay of overlayTypes) {
    if (visualizations[overlay]) {
      // If visualizations[overlay] is a standard URL, fetch & convert to Data URL
      // But if it's already a Data URL or something else, adapt as needed.
      result.overlays[overlay] = await fetchToDataURL(visualizations[overlay]);
    }
  }

  return result;
}
