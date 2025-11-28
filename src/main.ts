import {
  EXRLoader,
  GLTFLoader,
  OrbitControls,
} from "three/examples/jsm/Addons.js";
import "./style.css";
import vertexShader from "./shaders/vertex.glsl?raw";
import fragmentShader from "./shaders/fragment.glsl?raw";

import * as THREE from "three";

async function main() {
  const canvas = document.querySelector("#renderer") as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({ canvas });

  const scene = new THREE.Scene();

  let camera = new THREE.PerspectiveCamera();
  camera.position.z = 5;

  let orbit: OrbitControls;
  let cube: THREE.Mesh<THREE.BoxGeometry, THREE.ShaderMaterial>;

  const loader = new GLTFLoader();
  const glb = await loader.loadAsync("/cube.glb");

  glb.scene.traverse(object => {
    if (object.name === "Camera") {
      camera = object as THREE.PerspectiveCamera;
      resize();
    }
    if (object.name === "Light") {
      const light = object as THREE.Light;
      light.intensity = 10;
    }

    if (object.name === "Cube") {
      cube = object as THREE.Mesh;
      cube.material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uMouseX: { value: 0 },
          uMouseY: { value: 0 },
        },
      });
    }
  });

  const exrLoader = new EXRLoader();
  const exr = await exrLoader.loadAsync("/env.exr");

  const prm = new THREE.PMREMGenerator(renderer);
  prm.compileEquirectangularShader();
  const envMap = prm.fromEquirectangular(exr);

  scene.environment = envMap.texture;
  scene.background = envMap.texture;

  orbit = new OrbitControls(camera, renderer.domElement);

  scene.add(glb.scene);

  function resize() {
    const width = globalThis.innerWidth;
    const height = globalThis.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function render() {
    globalThis.requestAnimationFrame(render);
    cube.material.uniforms.uTime.value = performance.now() * 0.02;
    renderer.render(scene, camera);
  }

  resize();
  render();

  globalThis.addEventListener("pointermove", e => {
    console.log(e.clientX, e.clientY);
    cube.material.uniforms.uMouseX.value = e.clientX;
    cube.material.uniforms.uMouseY.value = e.clientY;
  });

  globalThis.addEventListener("resize", resize);
}

main();
