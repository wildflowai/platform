// main.js
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";

// Update the camera parameters with your desired values
const viewer = new GaussianSplats3D.Viewer({
  cameraUp: [0.24929, -0.2672, -0.93084],
  initialCameraPosition: [-3.93951, 0.24631, -3.29199],
  initialCameraLookAt: [-1.01181, 0.18365, 4.45069],
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
