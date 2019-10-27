import { meshSimplifier, killWorkers, createWorkers } from './MeshSimplifier';
// import OrbitControls from './components/orbitControls.js';
// import Loader from './components/Loader.js';
import * as dat from 'dat.gui';
import { AmbientLight, BoxHelper, Color, HemisphereLight, OrbitControls, PerspectiveCamera, Scene, SpotLight, WebGLRenderer } from 'dvlp-three';

var camera, ocontrols, modelGroup, modelOptimized, modelMaxSize, fileLoader, close, done;

export function openOptimizer (model, onDone) {
  const webglContainer = createDOM(onDone);
  const { scene, controls } = init(webglContainer);
  done = onDone;

  createWorkers();
  setupNewObject(scene, model, controls, webglContainer);
}

function createDOM () {
  const parent = document.createElement('div');
  parent.style.position = 'absolute';
  parent.style.top = 0;
  parent.style.left = 0;
  parent.style.width = '100%';
  parent.style.height = '100%';

  const webglOutput = document.createElement('div');
  webglOutput.id = 'WebGL-output';
  webglOutput.style.position = 'absolute';
  webglOutput.style.top = 0;
  webglOutput.style.left = 0;
  parent.appendChild(webglOutput);

  const closeButton = document.createElement('div');
  closeButton.style.position = 'absolute';
  closeButton.style.top = '10x';
  closeButton.style.right = 0;
  closeButton.style.backgroundColor = 'red';
  closeButton.textContent = 'X';
  parent.appendChild(closeButton);

  document.body.appendChild(parent);

  closeButton.addEventListener('click', () => {
    close();
  });

  close = function close() {
    localStorage.stopEverything = true;
    parent.removeChild(webglOutput);
    parent.removeChild(closeButton);
    document.body.removeChild(parent);
    camera = ocontrols = modelGroup = modelOptimized = modelMaxSize = fileLoader = null;
  };

  return webglOutput;
}

function apply() {
  done(modelOptimized);
  close();
}

function init(webglContainer) {
  window.restoreConsole && window.restoreConsole();
  const models = {
    '': '',
    Elf:
      'https://rawgit.com/mrdoob/three.js/master/examples/models/collada/elf/elf.dae',
    Drone: '/static/character.json'
  };

  const gui = setupGUI(webglContainer, models);

  const scene = setupScene();

  const renderer = setupRenderer(scene[0], scene[1], gui.controls);
  webglContainer.appendChild(renderer.domElement);

  return {
    scene: scene[0],
    controls: gui.controls
  };
}

function setupGUI(webglContainer, models) {
  var controls = new function() {
    this.state = Object.keys(models)[0];
    this.rotationSpeed = 0.01;
    this.optimizationLevel = 0.3;
    this.optimizeModel = () => optimizeModel(controls);
    this.apply = () => apply();
    this.preserveTexture = true;

    this.wireframe = false;
  }();

  localStorage.startTime = Date.now();

  var gui = new dat.GUI();
  gui.controls = controls;
  const dropdown = gui.add(controls, 'state').options(Object.keys(models));

  dropdown.onChange(item => {
    fileLoader.loadURL(models[item]);
  });
  // setTimeout(() => {
  //   dropdown.setValue(Object.keys(models)[1]);
  // }, 1000);

  gui.add(controls, 'rotationSpeed', 0, 0.06);
  gui.add(controls, 'optimizationLevel', 0, 1);
  gui.add(controls, 'preserveTexture');
  gui.add(controls, 'wireframe');
  gui.add(controls, 'optimizeModel');
  gui.add(controls, 'apply');

  webglContainer.parentNode.insertBefore(
    gui.domElement,
    webglContainer
  );

  gui.domElement.style.position = 'absolute';
  gui.domElement.style.zIndex = 10;
  gui.domElement.style.right = '40px';

  return gui;
}

function setupScene() {
  var scene = new Scene();
  // setupDropzone(scene);
  camera = new PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
  );
  scene.add(camera);

  // add subtle ambient lighting
  var ambientLight = new AmbientLight(0x444444);
  scene.add(ambientLight);
  // add spotlight for the shadows
  var spotLight = new SpotLight(0xffffff);
  spotLight.position.set(-40, 60, -10);
  spotLight.castShadow = true;
  scene.add(spotLight);

  var light = new HemisphereLight(0xbbbbff, 0x444422);
  light.position.set(0, 1, 0);
  scene.add(light);

  return [ scene, camera ];
}

function setupRenderer(scene, camera, controls) {
  var renderer = new WebGLRenderer({ antialias: true });
  renderer.setClearColor(new Color(0.7, 0.8, 0.8));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;

  console.log('KUTAHOH');

  localStorage.stopEverything = 'true';
  setTimeout(() => {
    localStorage.stopEverything = 'false';
    requestAnimationFrame(getRenderer(scene, camera, renderer, controls));
  }, 500);

  return renderer;

}

function recursivelyOptimize(model, controls) {
  if (model.isMesh) {
    meshSimplifier(
      model.originalGeometry || model.geometry,
      controls.optimizationLevel,
      controls.preserveTexture
    ).then(newGeo => {
      model.geometry = newGeo;
    });
  }
  model.children.forEach(child => recursivelyOptimize(child, controls));
}

function optimizeModel(controls) {
  if (modelOptimized) {
    modelOptimized.geometry =
      modelOptimized.originalGeometry;
  } else {
    modelOptimized.geometry = modelOptimized.originalGeometry;
  }

  recursivelyOptimize(modelOptimized, controls);

  modelOptimized.position.x = modelMaxSize;
}

function getRenderer(scene, camera, renderer, controls) {
  const render = function () {
    if (modelGroup) {
      modelGroup.rotation.y += controls.rotationSpeed;
      toWireframe(modelGroup, controls.wireframe);
    }
    if (modelOptimized) {
      modelOptimized.rotation.copy(modelGroup.rotation);
    }

    if (localStorage.stopEverything === 'false') {
      requestAnimationFrame(render);
      renderer.render(scene, camera);
    } else {
      console.log('stopping rendering');
      killWorkers();
      // document.removeEventListener('drop', handleFileDrop, false);
      // document.removeEventListener('dragover', handleDragOver, false);
    }
  };
  return render;
}

function toWireframe(obj, wireframeMode) {
  if (Array.isArray(obj.material)) {
    obj.material.forEach(m => (m.wireframe = wireframeMode));
  } else if (obj.material) {
    obj.material.wireframe = wireframeMode;
  }
  obj.children.forEach(el => toWireframe(el, wireframeMode));
}

// fileLoader = new Loader(obj => setupNewObject(obj));

function setupNewObject(scene, obj, controls, domElement) {
  scene.remove(modelGroup);
  scene.remove(modelOptimized);

  modelGroup = obj;
  modelOptimized = modelGroup.clone();
  if (modelOptimized) {
    modelOptimized.originalGeometry =
      modelOptimized.geometry;
  } else {
    modelOptimized.originalGeometry = modelOptimized.geometry;
  }

  scene.add(modelGroup);
  scene.add(modelOptimized);

  // update camera position to contain entire camera in view
  const bbox = new BoxHelper(modelGroup, new Color(0xff9900));
  bbox.geometry.computeBoundingBox();
  const box = bbox.geometry.boundingBox;

  modelMaxSize = Math.max(
    box.max.x - box.min.x,
    box.max.y - box.min.y,
    box.max.z - box.min.z
  );

  camera.position.set(0, box.max.y - box.min.y, Math.abs(modelMaxSize * 3));

  ocontrols = new OrbitControls(camera, domElement);
  ocontrols.target.set(2.5, (box.max.y - box.min.y) / 2, 0);

  optimizeModel(controls);

  ocontrols.update();
}
// function setupDropzone(scene) {
//   document.addEventListener('dragover', handleDragOver, false);
//   document.addEventListener('drop', handleFileDrop, false);
// }
// function handleDragOver(event) {
//   event.preventDefault();
//   event.dataTransfer.dropEffect = 'copy';
// }
// function handleFileDrop(event) {
//   event.preventDefault();
//   if (event.dataTransfer.files.length > 0) {
//     fileLoader.loadFiles(event.dataTransfer.files);
//   }
// }