export function fitCameraCanvas(canvas, renderer, viewport = window.visualViewport) {
  const width = Math.max(1, Math.round(viewport?.width ?? window.innerWidth));
  const height = Math.max(1, Math.round(viewport?.height ?? window.innerHeight));
  canvas.style.setProperty('width', width + 'px', 'important');
  canvas.style.setProperty('height', height + 'px', 'important');
  if (canvas.width === width && canvas.height === height) return;
  if (renderer) {
    renderer.setPixelRatio(1);
    renderer.setSize(width, height, false);
    return;
  }
  canvas.width = width;
  canvas.height = height;
}
