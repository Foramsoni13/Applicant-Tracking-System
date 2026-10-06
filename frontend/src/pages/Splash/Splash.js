import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import "./Splash.css";

function Splash() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [isExiting, setIsExiting] = useState(false);

  const handleFinish = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      navigate("/login", { replace: true });
    }, 450);
  }, [navigate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // --- 1. Scene, Camera & ATS Signature #8DBBD7 Studio Atmosphere ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8dbbd7);
    scene.fog = new THREE.FogExp2(0x76a9c8, 0.022);

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 1000);
    camera.position.set(0, 22, 28);
    camera.lookAt(0, 0.2, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    const geometriesToDispose = [];
    const materialsToDispose = [];
    const texturesToDispose = [];

    // Studio Clean Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.85);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    mainKeyLight.position.set(14, 26, 14);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 2048;
    mainKeyLight.shadow.mapSize.height = 2048;
    mainKeyLight.shadow.camera.near = 0.5;
    mainKeyLight.shadow.camera.far = 60;
    mainKeyLight.shadow.camera.left = -16;
    mainKeyLight.shadow.camera.right = 16;
    mainKeyLight.shadow.camera.top = 16;
    mainKeyLight.shadow.camera.bottom = -16;
    mainKeyLight.shadow.bias = -0.0004;
    scene.add(mainKeyLight);

    const fillCyanLight = new THREE.DirectionalLight(0x2482c1, 2.2);
    fillCyanLight.position.set(-18, 14, 12);
    scene.add(fillCyanLight);

    const rimBlueLight = new THREE.DirectionalLight(0xb7d8ea, 2.0);
    rimBlueLight.position.set(0, 18, -16);
    scene.add(rimBlueLight);

    // --- 2. Studio Ground Floor with Clean Specular Reflection ---
    const floorGeom = new THREE.PlaneGeometry(64, 64);
    geometriesToDispose.push(floorGeom);

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x78a8c5,
      roughness: 0.22,
      metalness: 0.1,
    });
    materialsToDispose.push(floorMat);

    const floorMesh = new THREE.Mesh(floorGeom, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.01;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Radial Ripple Shockwave Ring on Floor
    const rippleGeom = new THREE.RingGeometry(0.8, 1.05, 48);
    geometriesToDispose.push(rippleGeom);
    const rippleMat = new THREE.MeshBasicMaterial({
      color: 0x8dbbd7,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    materialsToDispose.push(rippleMat);

    const rippleMesh = new THREE.Mesh(rippleGeom, rippleMat);
    rippleMesh.rotation.x = -Math.PI / 2;
    rippleMesh.position.y = 0.005;
    scene.add(rippleMesh);

    // --- 3. Central Tiered Dais Platform ---
    const centralGroup = new THREE.Group();
    scene.add(centralGroup);

    const whiteCeramicMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.12,
      metalness: 0.1,
    });
    materialsToDispose.push(whiteCeramicMat);

    // Tier 1 Base Cylinder
    const tier1Geom = new THREE.CylinderGeometry(2.4, 2.5, 0.32, 64);
    geometriesToDispose.push(tier1Geom);
    const tier1Mesh = new THREE.Mesh(tier1Geom, whiteCeramicMat);
    tier1Mesh.position.y = 0.16;
    tier1Mesh.castShadow = true;
    tier1Mesh.receiveShadow = true;
    centralGroup.add(tier1Mesh);

    // Tier 1 Glowing Accent Blue Ring (#2482C1)
    const ring1Geom = new THREE.TorusGeometry(2.12, 0.065, 16, 64);
    geometriesToDispose.push(ring1Geom);
    const glowingBlueMat = new THREE.MeshStandardMaterial({
      color: 0x2482c1,
      emissive: 0x2482c1,
      emissiveIntensity: 2.8,
      roughness: 0.08,
    });
    materialsToDispose.push(glowingBlueMat);

    const ring1Mesh = new THREE.Mesh(ring1Geom, glowingBlueMat);
    ring1Mesh.rotation.x = Math.PI / 2;
    ring1Mesh.position.y = 0.33;
    centralGroup.add(ring1Mesh);

    // Tier 2 Middle Cylinder
    const tier2Geom = new THREE.CylinderGeometry(1.62, 1.68, 0.26, 64);
    geometriesToDispose.push(tier2Geom);
    const tier2Mesh = new THREE.Mesh(tier2Geom, whiteCeramicMat);
    tier2Mesh.position.y = 0.45;
    tier2Mesh.castShadow = true;
    tier2Mesh.receiveShadow = true;
    centralGroup.add(tier2Mesh);

    // Tier 2 Inner Glowing Ring (#68AAD0)
    const ring2Geom = new THREE.TorusGeometry(1.35, 0.055, 16, 64);
    geometriesToDispose.push(ring2Geom);
    const ring2Mesh = new THREE.Mesh(ring2Geom, glowingBlueMat);
    ring2Mesh.rotation.x = Math.PI / 2;
    ring2Mesh.position.y = 0.59;
    centralGroup.add(ring2Mesh);

    // Central Glass Top Disc
    const glassDiscGeom = new THREE.CylinderGeometry(0.95, 0.95, 0.14, 48);
    geometriesToDispose.push(glassDiscGeom);
    const glassDiscMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.88,
      opacity: 0.85,
      transparent: true,
      roughness: 0.04,
      ior: 1.52,
      thickness: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
    });
    materialsToDispose.push(glassDiscMat);

    const glassDiscMesh = new THREE.Mesh(glassDiscGeom, glassDiscMat);
    glassDiscMesh.position.y = 0.68;
    glassDiscMesh.castShadow = true;
    centralGroup.add(glassDiscMesh);

    // Central Standing 3D Monogram Emblem
    const centralEmblemGroup = new THREE.Group();
    centralEmblemGroup.position.y = 0.76;
    centralGroup.add(centralEmblemGroup);

    const standingPillarGeom = new THREE.BoxGeometry(0.2, 1.15, 0.2);
    geometriesToDispose.push(standingPillarGeom);
    const standingHeadGeom = new THREE.TorusGeometry(0.34, 0.095, 16, 32);
    geometriesToDispose.push(standingHeadGeom);

    const emblemMetalMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.08,
      metalness: 0.92,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
    });
    materialsToDispose.push(emblemMetalMat);

    const pillarMesh = new THREE.Mesh(standingPillarGeom, emblemMetalMat);
    pillarMesh.position.y = 0.58;
    pillarMesh.castShadow = true;
    centralEmblemGroup.add(pillarMesh);

    const headMesh = new THREE.Mesh(standingHeadGeom, emblemMetalMat);
    headMesh.position.y = 1.22;
    headMesh.castShadow = true;
    centralEmblemGroup.add(headMesh);

    // Rotating 3D Crystal Octahedron Core in Center
    const innerCrystalGeom = new THREE.OctahedronGeometry(0.22, 0);
    geometriesToDispose.push(innerCrystalGeom);
    const innerCrystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x2482c1,
      emissive: 0x68aad0,
      emissiveIntensity: 1.6,
      roughness: 0.05,
      transmission: 0.6,
      transparent: true,
    });
    materialsToDispose.push(innerCrystalMat);
    const innerCrystalMesh = new THREE.Mesh(innerCrystalGeom, innerCrystalMat);
    innerCrystalMesh.position.y = 1.22;
    centralEmblemGroup.add(innerCrystalMesh);

    // --- 4. 6 ATS Recruitment Satellite Modules ---
    const satelliteCount = 6;
    const radiusX = 6.4;
    const radiusZ = 4.5;
    const satellites = [];

    // Generate ATS recruitment glass card textures with sharp black borders
    const createATSCardTexture = (index) => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 320;
      const ctx = canvas.getContext("2d");

      // Card surface with pure black #000000 border
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(8, 8, 240, 304, 20);
      ctx.fill();
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = "#000000";
      ctx.stroke();

      // Top Icon Badge Container with black border
      ctx.beginPath();
      ctx.arc(128, 68, 38, 0, Math.PI * 2);
      ctx.fillStyle = "#d6e9f2";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#000000";
      ctx.stroke();

      if (index === 0) {
        // 1. CANDIDATE PROFILE
        ctx.strokeStyle = "#2482c1";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(128, 58, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(128, 92, 19, Math.PI, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#000000";
        ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Candidate", 128, 136);

        ctx.fillStyle = "#2482c1";
        ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Active Applicant", 128, 160);

        ctx.fillStyle = "#f4f8fb";
        ctx.beginPath();
        ctx.roundRect(28, 185, 200, 32, 8);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.font = "bold 12px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Full-Stack Developer", 128, 206);

        ctx.fillStyle = "#d6e9f2";
        ctx.beginPath();
        ctx.roundRect(44, 245, 168, 38, 19);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.font = "bold 14px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Profile Verified ✓", 128, 269);
      } else if (index === 1) {
        // 2. RESUME UPLOAD & PARSING
        ctx.strokeStyle = "#2482c1";
        ctx.lineWidth = 3.5;
        ctx.strokeRect(112, 46, 32, 42);
        ctx.beginPath();
        ctx.moveTo(118, 58); ctx.lineTo(138, 58);
        ctx.moveTo(118, 68); ctx.lineTo(138, 68);
        ctx.moveTo(118, 78); ctx.lineTo(130, 78);
        ctx.stroke();

        ctx.fillStyle = "#000000";
        ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Resume.pdf", 128, 136);

        ctx.fillStyle = "#2482c1";
        ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Parsed & Analyzed", 128, 160);

        ctx.fillStyle = "#e6f0f7";
        ctx.beginPath();
        ctx.roundRect(36, 185, 184, 8, 4);
        ctx.roundRect(36, 202, 140, 8, 4);
        ctx.roundRect(36, 219, 160, 8, 4);
        ctx.fill();

        ctx.fillStyle = "#d6e9f2";
        ctx.beginPath();
        ctx.roundRect(44, 245, 168, 38, 19);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.font = "bold 14px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Skills Extracted", 128, 269);
      } else if (index === 2) {
        // 3. AI MATCHING SCORE
        ctx.strokeStyle = "#2482c1";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(128, 68, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(128, 44); ctx.lineTo(128, 52);
        ctx.moveTo(128, 84); ctx.lineTo(128, 92);
        ctx.moveTo(104, 68); ctx.lineTo(112, 68);
        ctx.moveTo(144, 68); ctx.lineTo(152, 68);
        ctx.stroke();

        ctx.fillStyle = "#000000";
        ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("AI Matching", 128, 136);

        ctx.fillStyle = "#2482c1";
        ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Semantic Analysis", 128, 160);

        ctx.fillStyle = "#f4f8fb";
        ctx.beginPath();
        ctx.roundRect(28, 185, 200, 32, 8);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.font = "bold 14px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("98% Match Score", 128, 206);

        ctx.fillStyle = "#2482c1";
        ctx.beginPath();
        ctx.roundRect(44, 245, 168, 38, 19);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("★ Top Ranked", 128, 269);
      } else if (index === 3) {
        // 4. JOB POSTING & "APPLY NOW" BUTTON
        ctx.strokeStyle = "#2482c1";
        ctx.lineWidth = 3.5;
        ctx.strokeRect(110, 52, 36, 28);
        ctx.beginPath();
        ctx.moveTo(119, 52); ctx.lineTo(119, 44);
        ctx.lineTo(137, 44); ctx.lineTo(137, 52);
        ctx.stroke();

        ctx.fillStyle = "#000000";
        ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Job Opening", 128, 136);

        ctx.fillStyle = "#2482c1";
        ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Senior AI Engineer", 128, 160);

        ctx.fillStyle = "#f4f8fb";
        ctx.beginPath();
        ctx.roundRect(28, 185, 200, 32, 8);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.font = "bold 12px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Full-Time • Remote", 128, 206);

        // ATS Blue "APPLY NOW" Button Pill (#2482C1)
        ctx.fillStyle = "#2482c1";
        ctx.beginPath();
        ctx.roundRect(36, 240, 184, 44, 22);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("APPLY NOW →", 128, 268);
      } else if (index === 4) {
        // 5. HR RECRUITER
        ctx.strokeStyle = "#2482c1";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(120, 58, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(120, 92, 17, Math.PI, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(142, 62, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#000000";
        ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("HR Portal", 128, 136);

        ctx.fillStyle = "#2482c1";
        ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Recruiter Review", 128, 160);

        ctx.fillStyle = "#f4f8fb";
        ctx.beginPath();
        ctx.roundRect(28, 185, 200, 32, 8);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.font = "bold 12px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Candidate Shortlisted", 128, 206);

        ctx.fillStyle = "#d6e9f2";
        ctx.beginPath();
        ctx.roundRect(44, 245, 168, 38, 19);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.font = "bold 14px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Application Sent ✓", 128, 269);
      } else {
        // 6. INTERVIEW & SELECTION
        ctx.strokeStyle = "#2482c1";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(128, 68, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(116, 68);
        ctx.lineTo(124, 76);
        ctx.lineTo(140, 58);
        ctx.stroke();

        ctx.fillStyle = "#000000";
        ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Interview", 128, 136);

        ctx.fillStyle = "#2482c1";
        ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Selection Stage", 128, 160);

        ctx.fillStyle = "#f4f8fb";
        ctx.beginPath();
        ctx.roundRect(28, 185, 200, 32, 8);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.font = "bold 12px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Round 1 Scheduled", 128, 206);

        ctx.fillStyle = "#d6e9f2";
        ctx.beginPath();
        ctx.roundRect(44, 245, 168, 38, 19);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.font = "bold 14px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Final Selection ★", 128, 269);
      }

      const tex = new THREE.CanvasTexture(canvas);
      texturesToDispose.push(tex);
      return tex;
    };

    // Shared geometries for satellites
    const satPedestalGeom = new THREE.BoxGeometry(1.4, 0.24, 1.4);
    geometriesToDispose.push(satPedestalGeom);

    const satGlassCardGeom = new THREE.BoxGeometry(1.05, 1.3, 0.06);
    geometriesToDispose.push(satGlassCardGeom);

    const satCardPlaneGeom = new THREE.PlaneGeometry(1.0, 1.25);
    geometriesToDispose.push(satCardPlaneGeom);

    const microStemGeom = new THREE.CylinderGeometry(0.016, 0.016, 0.85, 12);
    geometriesToDispose.push(microStemGeom);

    const microBeadGeom = new THREE.SphereGeometry(0.07, 16, 16);
    geometriesToDispose.push(microBeadGeom);

    const floatingMiniCubeGeom = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    geometriesToDispose.push(floatingMiniCubeGeom);
    const floatingCubeMat = new THREE.MeshPhysicalMaterial({
      color: 0x8dbbd7,
      emissive: 0x2482c1,
      emissiveIntensity: 1.1,
      roughness: 0.1,
      metalness: 0.7,
    });
    materialsToDispose.push(floatingCubeMat);

    for (let i = 0; i < satelliteCount; i++) {
      const angle = (i / satelliteCount) * Math.PI * 2 + 0.52;
      const targetX = Math.cos(angle) * radiusX;
      const targetZ = Math.sin(angle) * radiusZ;

      const satGroup = new THREE.Group();
      satGroup.position.set(targetX, 0, targetZ);
      scene.add(satGroup);

      // Base White Ceramic Pedestal
      const satPedestal = new THREE.Mesh(satPedestalGeom, whiteCeramicMat);
      satPedestal.position.y = 0.12;
      satPedestal.castShadow = true;
      satPedestal.receiveShadow = true;
      satGroup.add(satPedestal);

      // Glowing Accent Blue Base Ring
      const satNeonGeom = new THREE.BoxGeometry(1.48, 0.045, 1.48);
      geometriesToDispose.push(satNeonGeom);
      const satNeonMesh = new THREE.Mesh(satNeonGeom, glowingBlueMat);
      satNeonMesh.position.y = 0.02;
      satGroup.add(satNeonMesh);

      // Vertical Standing Glass Card
      const satGlassCard = new THREE.Mesh(satGlassCardGeom, glassDiscMat);
      satGlassCard.position.y = 0.82;
      satGlassCard.castShadow = true;
      satGroup.add(satGlassCard);

      // UI Texture Plane
      const cardTex = createATSCardTexture(i);
      const cardMat = new THREE.MeshBasicMaterial({
        map: cardTex,
        transparent: true,
        opacity: 0.98,
      });
      materialsToDispose.push(cardMat);

      const cardMesh = new THREE.Mesh(satCardPlaneGeom, cardMat);
      cardMesh.position.set(0, 0.82, 0.04);
      satGroup.add(cardMesh);

      // Floating Micro-bead above satellite
      const stemMesh = new THREE.Mesh(microStemGeom, glowingBlueMat);
      stemMesh.position.set(0.62, 0.95, 0.45);
      satGroup.add(stemMesh);

      const beadMesh = new THREE.Mesh(microBeadGeom, glowingBlueMat);
      beadMesh.position.set(0.62, 1.42, 0.45);
      satGroup.add(beadMesh);

      // Floating 3D Mini Cube
      const miniCube = new THREE.Mesh(floatingMiniCubeGeom, floatingCubeMat);
      miniCube.position.set(-0.55, 1.25, 0.35);
      satGroup.add(miniCube);

      satellites.push({
        group: satGroup,
        targetX,
        targetZ,
        angle,
        bead: beadMesh,
        miniCube,
        glassCard: satGlassCard,
      });
    }

    // --- 5. Connecting Circuit Tracks & Flowing Blue Light Beams ---
    const circuitLinks = [];
    satellites.forEach((sat, idx) => {
      const pStart = new THREE.Vector3(sat.targetX * 0.82, 0.015, sat.targetZ * 0.82);
      const pMid = new THREE.Vector3(sat.targetX * 0.45, 0.015, sat.targetZ * 0.45);
      const pEnd = new THREE.Vector3(Math.cos(sat.angle) * 2.15, 0.015, Math.sin(sat.angle) * 2.15);

      const curve = new THREE.CatmullRomCurve3([pStart, pMid, pEnd]);
      const trackGeom = new THREE.TubeGeometry(curve, 32, 0.034, 12, false);
      geometriesToDispose.push(trackGeom);

      const trackMat = new THREE.MeshStandardMaterial({
        color: 0xb7d8ea,
        emissive: 0x68aad0,
        emissiveIntensity: 1.0,
        roughness: 0.15,
      });
      materialsToDispose.push(trackMat);

      const trackMesh = new THREE.Mesh(trackGeom, trackMat);
      scene.add(trackMesh);

      // Traveling Light Pulse Bead along circuit track
      const pulseGeom = new THREE.SphereGeometry(0.09, 16, 16);
      geometriesToDispose.push(pulseGeom);
      const pulseMesh = new THREE.Mesh(pulseGeom, glowingBlueMat);
      scene.add(pulseMesh);

      circuitLinks.push({
        curve,
        pulseMesh,
        speed: 0.4 + (idx % 3) * 0.1,
        t: (idx / satelliteCount),
      });
    });

    // --- 6. Ambient Floating Particles ---
    const particleCount = 40;
    const particleGeom = new THREE.BufferGeometry();
    geometriesToDispose.push(particleGeom);

    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3 + 0] = (Math.random() - 0.5) * 20;
      particlePositions[i * 3 + 1] = 0.5 + Math.random() * 5.5;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    particleGeom.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x8dbbd7,
      size: 0.15,
      transparent: true,
      opacity: 0.75,
    });
    materialsToDispose.push(particleMat);

    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // --- 7. Mouse / Pointer Parallax ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handlePointerMove = (e) => {
      const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      mouse.targetX = (clientX / window.innerWidth - 0.5) * 2;
      mouse.targetY = -(clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    // --- 8. Animation Loop ---
    const clock = new THREE.Clock();

    const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
    const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Camera swoop & dynamic zoom
      const cameraIntro = easeOutCubic(Math.min(1, elapsed / 1.4));
      let targetCamY = 22 - cameraIntro * 7.5;
      let targetCamZ = 28 - cameraIntro * 8.5;

      if (elapsed > 3.6) {
        const brandZoom = easeInOutCubic(Math.min(1, (elapsed - 3.6) / 1.0));
        targetCamY -= brandZoom * 3.5;
        targetCamZ -= brandZoom * 4.5;
      }

      // Parallax smooth damping
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      camera.position.x = mouse.x * 2.2;
      camera.position.y = targetCamY + mouse.y * 1.2;
      camera.position.z = targetCamZ;
      camera.lookAt(0, 0.4, 0);

      // Phase 1: Smooth Rise
      const riseProgress = easeOutCubic(Math.min(1, elapsed / 1.1));
      centralGroup.position.y = (1 - riseProgress) * -2;

      // 3D Wave Undulation on Satellites
      satellites.forEach((sat, i) => {
        const satDelay = Math.min(1, Math.max(0, (elapsed - 0.12 * i) / 0.8));
        const satEase = easeOutCubic(satDelay);
        const floatWave = Math.sin(elapsed * 2.4 + i * 1.1) * 0.1;

        sat.group.position.y = (1 - satEase) * -2.2 + floatWave * satEase;
        sat.group.scale.set(satEase, satEase, satEase);

        // 3D Glass tilt
        sat.glassCard.rotation.y = Math.sin(elapsed * 1.8 + i) * 0.06;

        // Floating Mini Cube Spin
        sat.miniCube.rotation.x = elapsed * 1.4 + i;
        sat.miniCube.rotation.y = elapsed * 1.8 + i;
        sat.miniCube.position.y = 1.25 + Math.cos(elapsed * 2.6 + i) * 0.12;

        // Micro-bead bounce
        sat.bead.position.y = 1.42 + Math.sin(elapsed * 2.8 + i) * 0.1;
      });

      // Central Dais Motion & Spin
      centralEmblemGroup.rotation.y = elapsed * 0.55;
      innerCrystalMesh.rotation.x = elapsed * 1.2;
      innerCrystalMesh.rotation.y = elapsed * 1.6;
      ring1Mesh.rotation.z = elapsed * 0.35;
      ring2Mesh.rotation.z = -elapsed * 0.45;

      // Shockwave Ring on ground
      const rippleCycle = (elapsed * 0.7) % 1.0;
      const rippleScale = 2.0 + rippleCycle * 6.0;
      rippleMesh.scale.set(rippleScale, rippleScale, 1);
      rippleMat.opacity = Math.sin(rippleCycle * Math.PI) * 0.5;

      // Traveling Light Pulses along circuits
      circuitLinks.forEach((link) => {
        link.t = (link.t + 0.014 * link.speed) % 1.0;
        const pt = link.curve.getPointAt(link.t);
        link.pulseMesh.position.copy(pt);
        link.pulseMesh.position.y += 0.045;
      });

      // Ambient particle slow rotation
      particles.rotation.y = elapsed * 0.02;

      // Phase 3: Energy Convergence on Dais (3.3s+)
      if (elapsed > 3.3) {
        const convT = Math.min(1, (elapsed - 3.3) / 0.75);
        const convEase = easeInOutCubic(convT);
        glowingBlueMat.emissiveIntensity = 2.8 + convEase * 3.5;
        innerCrystalMat.emissiveIntensity = 1.6 + convEase * 2.5;
        centralGroup.scale.setScalar(1 + convEase * 0.1);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
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

    // Timers
    const finishTimer = setTimeout(() => {
      handleFinish();
    }, 4500);

    // Complete Resource Disposal
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      clearTimeout(finishTimer);

      geometriesToDispose.forEach((g) => g && g.dispose && g.dispose());
      materialsToDispose.forEach((m) => m && m.dispose && m.dispose());
      texturesToDispose.forEach((t) => t && t.dispose && t.dispose());

      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }, [handleFinish]);

  return (
    <div className={`iso-splash-root ${isExiting ? "iso-splash-exit" : ""}`}>
      {/* ATS Light Blue Ambient Atmosphere */}
      <div className="iso-ambient-overlay">
        <div className="iso-radial-glow primary" />
        <div className="iso-radial-glow secondary" />
        <div className="iso-ambient-vignette" />
      </div>

      {/* 3D WebGL Canvas Layer (Remains 100% visible with full animation) */}
      <div ref={containerRef} className="iso-canvas-container" />

      {/* Clean Brand Name & Subtitle Below Animation (No dark box) */}
      <div className="iso-bottom-brand-bar">
        <div className="iso-brand-emblem-small">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <polyline points="16 11 18 13 22 9" />
          </svg>
        </div>
        <span className="iso-brand-name-title">AI-ATS</span>
        <span className="iso-brand-dot">•</span>
        <span className="iso-brand-name-subtitle">Intelligent Recruitment Platform</span>
      </div>
    </div>
  );
}

export default Splash;
