// main.js
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";

const viewer = new GaussianSplats3D.Viewer({
  cameraUp: [0, -1, -0.6],
  initialCameraPosition: [-1, -4, 6],
  initialCameraLookAt: [0, 4, 0],
  rootElement: document.getElementById("viewer"),
});

viewer
  .addSplatScene("/W32Em7/splats.ksplat", {
    splatAlphaRemovalThreshold: 5,
    showLoadingUI: true,
    position: [0, 1, 0],
    rotation: [0, 0, 0, 1],
    scale: [1.5, 1.5, 1.5],
  })
  .then(() => {
    viewer.start();
  });
