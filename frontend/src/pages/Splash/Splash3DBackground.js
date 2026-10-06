import React, { useEffect, useRef } from "react";
import * as THREE from "three";

function Splash3DBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // --- Scene & Studio Background ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6f9fc);
    scene.fog = new THREE.FogExp2(0xf6f9fc, 0.02);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 20);

    // --- High Performance WebGL Renderer ---
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // --- Disposal Tracking ---
    const geometriesToDispose = [];
    const materialsToDispose = [];

    // --- Professional Studio Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(12, 16, 14);
    scene.add(keyLight);

    const blueLight = new THREE.DirectionalLight(0x2482c1, 1.8);
    blueLight.position.set(-14, -10, 10);
    scene.add(blueLight);

    const rimLight = new THREE.DirectionalLight(0xb7d8ea, 1.4);
    rimLight.position.set(0, 14, -8);
    scene.add(rimLight);

    // --- 1. Luxury 3D Kinetic Möbius / Flowing Ribbon Mesh ---
    // High-end parametric ribbon representing continuous AI talent matching & data flow
    const curvePoints = [];
    const numPoints = 180;
    const radius = 6.2;
    const tubeRadius = 0.28;

    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 2;
      const x = Math.sin(t) * radius + Math.sin(t * 2) * 1.6;
      const y = Math.cos(t * 2) * 2.2;
      const z = Math.cos(t) * radius + Math.sin(t * 3) * 1.2;
      curvePoints.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(curvePoints, true, "centripetal");
    const ribbonGeom = new THREE.TubeGeometry(curve, 180, tubeRadius, 24, true);
    geometriesToDispose.push(ribbonGeom);

    const ribbonMat = new THREE.MeshPhysicalMaterial({
      color: 0x2482c1,
      emissive: 0x68aad0,
      emissiveIntensity: 0.25,
      roughness: 0.15,
      metalness: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
    });
    materialsToDispose.push(ribbonMat);

    const ribbonMesh = new THREE.Mesh(ribbonGeom, ribbonMat);
    scene.add(ribbonMesh);

    // Secondary Inner Ice-Blue Helix Ribbon
    const innerPoints = [];
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 2;
      const x = Math.cos(t) * 4.8 + Math.cos(t * 2) * 1.2;
      const y = Math.sin(t * 2) * 1.8;
      const z = Math.sin(t) * 4.8 + Math.cos(t * 3) * 0.9;
      innerPoints.push(new THREE.Vector3(x, y, z));
    }

    const innerCurve = new THREE.CatmullRomCurve3(innerPoints, true, "centripetal");
    const innerRibbonGeom = new THREE.TubeGeometry(innerCurve, 180, 0.16, 20, true);
    geometriesToDispose.push(innerRibbonGeom);

    const innerRibbonMat = new THREE.MeshPhysicalMaterial({
      color: 0xb7d8ea,
      roughness: 0.1,
      metalness: 0.6,
      clearcoat: 0.9,
      transparent: true,
      opacity: 0.8,
    });
    materialsToDispose.push(innerRibbonMat);

    const innerRibbonMesh = new THREE.Mesh(innerRibbonGeom, innerRibbonMat);
    scene.add(innerRibbonMesh);

    // --- 2. Floating AI Orbiting Data Nodes ---
    const nodeCount = width < 768 ? 12 : 20;
    const nodeGeom = new THREE.SphereGeometry(0.18, 16, 16);
    geometriesToDispose.push(nodeGeom);

    const nodeMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0x2482c1,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9,
      clearcoat: 1.0,
    });
    materialsToDispose.push(nodeMat);

    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      const mesh = new THREE.Mesh(nodeGeom, nodeMat);
      scene.add(mesh);
      nodes.push({
        mesh,
        tOffset: i / nodeCount,
        speed: 0.08 + (i % 3) * 0.02,
      });
    }

    // --- 3. Ambient Starfield / Shimmer Dust ---
    const particleCount = width < 768 ? 25 : 50;
    const particleGeom = new THREE.BufferGeometry();
    geometriesToDispose.push(particleGeom);

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const palette = [0x2482c1, 0x68aad0, 0x8dbbd7, 0xb7d8ea, 0xffffff];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 36;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16 - 2;

      const c = new THREE.Color(palette[i % palette.length]);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    particleGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeom.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
    });
    materialsToDispose.push(particleMat);

    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // --- Interactive Mouse Parallax ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handlePointerMove = (e) => {
      const clientX =
        e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY =
        e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      mouse.targetX = (clientX / window.innerWidth - 0.5) * 2;
      mouse.targetY = -(clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    // --- Resize Handler ---
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || window.innerWidth;
      const newHeight = container.clientHeight || window.innerHeight;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(newWidth, newHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("resize", handleResize);

    // --- Animation Loop ---
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth camera parallax
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      camera.position.x = mouse.x * 2.2;
      camera.position.y = mouse.y * 1.5;
      camera.lookAt(0, 0, 0);

      // Continuous, silky smooth rotation for the 3D ribbons
      ribbonMesh.rotation.y = elapsedTime * 0.12;
      ribbonMesh.rotation.x = Math.sin(elapsedTime * 0.08) * 0.2;
      ribbonMesh.rotation.z = Math.cos(elapsedTime * 0.06) * 0.15;

      innerRibbonMesh.rotation.y = -elapsedTime * 0.15;
      innerRibbonMesh.rotation.x = Math.cos(elapsedTime * 0.1) * 0.25;

      // Animate Orbiting Data Nodes along curve
      nodes.forEach((n) => {
        const t = (elapsedTime * n.speed + n.tOffset) % 1.0;
        const pt = curve.getPointAt(t);
        // Apply ribbon mesh rotation to node position
        pt.applyEuler(ribbonMesh.rotation);
        n.mesh.position.copy(pt);
      });

      // Subtle particle drift
      if (particles) {
        particles.rotation.y = elapsedTime * 0.01;
      }

      renderer.render(scene, camera);
    };

    animate();

    // --- Complete Disposal on Unmount ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);

      geometriesToDispose.forEach((g) => g && g.dispose && g.dispose());
      materialsToDispose.forEach((m) => m && m.dispose && m.dispose());

      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  return <div ref={containerRef} className="normal-splash-3d-canvas-container" />;
}

export default Splash3DBackground;
