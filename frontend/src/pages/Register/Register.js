import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaCheckCircle, FaSpinner, FaQrcode, FaShieldAlt } from "react-icons/fa";
import * as THREE from "three";
import { API_BASE_URL } from "../../utils/constants";
import "../Login/Login.css";
import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const canvasContainerRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Google Authenticator Setup Modal / Screen State
  const [totpModal, setTotpModal] = useState({
    show: false,
    user: null,
    totpSecret: "",
    qrCodeUrl: "",
    otpInput: "",
    verifying: false,
    error: "",
    success: false,
  });

  const [popup, setPopup] = useState({
    show: false,
    type: "",
    title: "",
    message: "",
    redirect: false,
  });

  // --- Three.js 3D Isometric Recruitment Network (Identical to Login / Splash) ---
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    let animationFrameId;
    let width = container.clientWidth || 480;
    let height = container.clientHeight || 640;

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

    // Lighting Studio
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.85);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    mainKeyLight.position.set(14, 26, 14);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 1024;
    mainKeyLight.shadow.mapSize.height = 1024;
    scene.add(mainKeyLight);

    const fillCyanLight = new THREE.DirectionalLight(0x2482c1, 2.2);
    fillCyanLight.position.set(-18, 14, 12);
    scene.add(fillCyanLight);

    const rimBlueLight = new THREE.DirectionalLight(0xb7d8ea, 2.0);
    rimBlueLight.position.set(0, 18, -16);
    scene.add(rimBlueLight);

    // Studio Ground Floor
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

    // Central Tiered Dais Platform
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

    // Tier 1 Glowing Accent Blue Ring
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

    // Central Standing Monogram Pillar & Head
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

    // Rotating 3D Crystal Core in Center
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

    // 6 ATS Recruitment Satellite Modules with Pure Black Borders
    const satelliteCount = 6;
    const radiusX = 6.4;
    const radiusZ = 4.5;
    const satellites = [];

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
        ctx.strokeStyle = "#2482c1";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(128, 68, 16, 0, Math.PI * 2);
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
        ctx.strokeStyle = "#2482c1";
        ctx.lineWidth = 3.5;
        ctx.strokeRect(110, 52, 36, 28);

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

        ctx.fillStyle = "#2482c1";
        ctx.beginPath();
        ctx.roundRect(36, 240, 184, 44, 22);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("APPLY NOW →", 128, 268);
      } else if (index === 4) {
        ctx.strokeStyle = "#2482c1";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(120, 58, 10, 0, Math.PI * 2);
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
        ctx.strokeStyle = "#2482c1";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(128, 68, 20, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#000000";
        ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Interview Stage", 128, 136);

        ctx.fillStyle = "#2482c1";
        ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Final Round Selected", 128, 160);

        ctx.fillStyle = "#f4f8fb";
        ctx.beginPath();
        ctx.roundRect(28, 185, 200, 32, 8);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.font = "bold 12px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Technical Assessment", 128, 206);

        ctx.fillStyle = "#2482c1";
        ctx.beginPath();
        ctx.roundRect(44, 245, 168, 38, 19);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Selected ✓", 128, 269);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texturesToDispose.push(texture);
      return texture;
    };

    const circuitTracks = [];

    for (let i = 0; i < satelliteCount; i++) {
      const angle = (i / satelliteCount) * Math.PI * 2;
      const x = Math.cos(angle) * radiusX;
      const z = Math.sin(angle) * radiusZ;

      const satGroup = new THREE.Group();
      satGroup.position.set(x, 0, z);

      // Satellite Pedestal Base
      const pedGeom = new THREE.CylinderGeometry(1.05, 1.15, 0.4, 32);
      geometriesToDispose.push(pedGeom);
      const pedMesh = new THREE.Mesh(pedGeom, whiteCeramicMat);
      pedMesh.position.y = 0.2;
      pedMesh.castShadow = true;
      pedMesh.receiveShadow = true;
      satGroup.add(pedMesh);

      // Pedestal Glowing Rim Ring
      const pedRingGeom = new THREE.TorusGeometry(1.08, 0.04, 16, 32);
      geometriesToDispose.push(pedRingGeom);
      const pedRingMesh = new THREE.Mesh(pedRingGeom, glowingBlueMat);
      pedRingMesh.rotation.x = Math.PI / 2;
      pedRingMesh.position.y = 0.4;
      satGroup.add(pedRingMesh);

      // Standing Card with Black Border
      const cardGeom = new THREE.PlaneGeometry(1.85, 2.3);
      geometriesToDispose.push(cardGeom);
      const cardTex = createATSCardTexture(i);
      const cardMat = new THREE.MeshBasicMaterial({
        map: cardTex,
        side: THREE.DoubleSide,
        transparent: true,
      });
      materialsToDispose.push(cardMat);
      const cardMesh = new THREE.Mesh(cardGeom, cardMat);
      cardMesh.position.y = 1.9;
      cardMesh.lookAt(0, cardMesh.position.y, 0);
      satGroup.add(cardMesh);

      scene.add(satGroup);
      satellites.push({
        group: satGroup,
        floatPhase: i * 1.05,
      });

      // Curved Circuit Tube
      const startPt = new THREE.Vector3(0, 0.35, 0);
      const midPt = new THREE.Vector3(x * 0.52, 0.12, z * 0.52);
      const endPt = new THREE.Vector3(x, 0.2, z);

      const curve = new THREE.QuadraticBezierCurve3(startPt, midPt, endPt);
      const tubeGeom = new THREE.TubeGeometry(curve, 32, 0.032, 8, false);
      geometriesToDispose.push(tubeGeom);

      const trackMat = new THREE.MeshBasicMaterial({
        color: 0x8dbbd7,
        transparent: true,
        opacity: 0.75,
      });
      materialsToDispose.push(trackMat);
      const tubeMesh = new THREE.Mesh(tubeGeom, trackMat);
      scene.add(tubeMesh);

      // Traveling Light Pulse
      const pulseGeom = new THREE.SphereGeometry(0.09, 12, 12);
      geometriesToDispose.push(pulseGeom);
      const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      materialsToDispose.push(pulseMat);
      const pulseMesh = new THREE.Mesh(pulseGeom, pulseMat);
      scene.add(pulseMesh);

      circuitTracks.push({
        curve,
        pulseMesh,
        progress: (i / satelliteCount) * 1.0,
        speed: 0.007 + (i % 2) * 0.003,
      });
    }

    // Floating Particles
    const particleCount = 45;
    const particleGeom = new THREE.BufferGeometry();
    geometriesToDispose.push(particleGeom);
    const posArray = new Float32Array(particleCount * 3);
    for (let p = 0; p < particleCount * 3; p += 3) {
      posArray[p] = (Math.random() - 0.5) * 22;
      posArray[p + 1] = Math.random() * 9 + 0.3;
      posArray[p + 2] = (Math.random() - 0.5) * 18;
    }
    particleGeom.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x8dbbd7,
      size: 0.16,
      transparent: true,
      opacity: 0.8,
    });
    materialsToDispose.push(particleMat);
    const particleSystem = new THREE.Points(particleGeom, particleMat);
    scene.add(particleSystem);

    // Mouse Pointer Parallax
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    const handlePointerMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      targetParallaxX = nx * 3.5;
      targetParallaxY = ny * 2.0;
    };
    window.addEventListener("pointermove", handlePointerMove);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      centralGroup.rotation.y = elapsed * 0.18;
      innerCrystalMesh.rotation.x = elapsed * 0.9;
      innerCrystalMesh.rotation.y = elapsed * 1.3;

      satellites.forEach((sat) => {
        sat.group.position.y = Math.sin(elapsed * 1.8 + sat.floatPhase) * 0.14;
      });

      circuitTracks.forEach((track) => {
        track.progress = (track.progress + track.speed) % 1;
        const pt = track.curve.getPointAt(track.progress);
        track.pulseMesh.position.copy(pt);
      });

      camera.position.x += (Math.sin(elapsed * 0.15) * 2.5 + targetParallaxX - camera.position.x) * 0.05;
      camera.position.y += (22 + targetParallaxY - camera.position.y) * 0.05;
      camera.position.z += (28 + Math.cos(elapsed * 0.12) * 1.5 - camera.position.z) * 0.05;
      camera.lookAt(0, 0.4, 0);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || 480;
      const newHeight = container.clientHeight || 640;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);

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
  }, []);

  const validateForm = () => {
    let temp = {};

    if (!formData.firstName.trim()) temp.firstName = "First name is required";
    if (!formData.lastName.trim()) temp.lastName = "Last name is required";

    if (!formData.email.trim()) {
      temp.email = "Email is required";
    } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(formData.email.trim())) {
      temp.email = "Invalid email address";
    }

    if (!formData.phone.trim()) {
      temp.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
      temp.phone = "Must be 10 digits";
    }

    if (!formData.password) {
      temp.password = "Password is required";
    } else if (formData.password.length < 6) {
      temp.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      temp.confirmPassword = "Confirm password is required";
    } else if (formData.password !== formData.confirmPassword) {
      temp.confirmPassword = "Passwords do not match";
    }

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let inputValue = value;
    if (name === "phone") {
      inputValue = value.replace(/\D/g, "").slice(0, 10);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: inputValue,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          phone: formData.phone.trim(),
          role: "candidate",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Registration failed");
      }

      setTotpModal({
        show: true,
        user: result.user,
        totpSecret: result.totpSecret || "",
        qrCodeUrl: result.qrCodeUrl || "",
        otpInput: "",
        verifying: false,
        error: "",
        success: false,
      });
    } catch (error) {
      const isNetworkError = error.message === "Failed to fetch" || error.name === "TypeError";
      const errorMsg = isNetworkError
        ? "Unable to connect to the server. Please ensure the backend server (port 5002) and MongoDB are running."
        : (error.message || "Registration failed. Please try again.");
      setPopup({
        show: true,
        type: "error",
        title: "Registration Failed",
        message: errorMsg,
        redirect: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTotpSetup = async (e) => {
    e.preventDefault();
    if (!totpModal.otpInput || totpModal.otpInput.trim().length !== 6) {
      setTotpModal((prev) => ({ ...prev, error: "Please enter the complete 6-digit code from Google Authenticator." }));
      return;
    }

    try {
      setTotpModal((prev) => ({ ...prev, verifying: true, error: "" }));

      const response = await fetch(`${API_BASE_URL}/api/auth/setup-totp-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: totpModal.user._id || totpModal.user.id,
          otp: totpModal.otpInput.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Invalid verification code.");
      }

      setTotpModal((prev) => ({ ...prev, success: true, verifying: false }));

      setTimeout(() => {
        setTotpModal({ show: false, user: null, totpSecret: "", qrCodeUrl: "", otpInput: "", verifying: false, error: "", success: false });
        setPopup({
          show: true,
          type: "success",
          title: "Account & Security Setup Complete",
          message: "Your account is created and secured with Google Authenticator. You can now log in.",
          redirect: true,
        });
      }, 1000);
    } catch (err) {
      setTotpModal((prev) => ({
        ...prev,
        verifying: false,
        error: err.message || "Invalid verification code. Please try again.",
      }));
    }
  };

  const copySecretKey = () => {
    if (!totpModal.totpSecret) return;
    navigator.clipboard.writeText(totpModal.totpSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const closePopup = () => {
    const shouldRedirect = popup.redirect;
    setPopup({ show: false, type: "", title: "", message: "", redirect: false });
    if (shouldRedirect) {
      navigate("/login");
    }
  };

  return (
    <div className="split-login-wrapper">
      <div className="split-login-card" style={{ maxWidth: "1120px" }}>
        {/* =================================================================
            LEFT PANEL: #8DBBD7 SWATCH BLUE WITH 3D NETWORK ANIMATION
            ================================================================= */}
        <div className="split-visual-panel">
          <div className="visual-ambient-overlay">
            <div className="visual-radial-glow-primary" />
            <div className="visual-radial-glow-secondary" />
            <div className="visual-ambient-vignette" />
          </div>

          <div className="split-visual-header">
            <div className="split-visual-logo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2482C1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <polyline points="16 11 18 13 22 9" />
              </svg>
            </div>
            <span className="split-visual-brand-name">AI-ATS</span>
          </div>

          <div ref={canvasContainerRef} className="split-canvas-container" />
        </div>

        {/* =================================================================
            RIGHT PANEL: CLEAN FORM / GOOGLE AUTHENTICATOR SETUP
            ================================================================= */}
        <div className="split-form-panel">
          {!totpModal.show ? (
            /* STAGE 1: REGISTRATION FORM */
            <div className="split-form-inner" style={{ maxWidth: "460px" }}>
              <div className="split-form-header">
                <h2>Create Account</h2>
                <p>Join the AI-ATS intelligent recruitment platform.</p>
              </div>

              <form onSubmit={handleRegister} className="split-form" autoComplete="off">
                <div className="form-row-2">
                  <div className="form-field">
                    <label htmlFor="reg-firstName">First Name <span className="req-star">*</span></label>
                    <input
                      id="reg-firstName"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={errors.firstName ? "input-err" : ""}
                      autoComplete="off"
                    />
                    {errors.firstName && <span className="field-err">{errors.firstName}</span>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="reg-lastName">Last Name <span className="req-star">*</span></label>
                    <input
                      id="reg-lastName"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={errors.lastName ? "input-err" : ""}
                      autoComplete="off"
                    />
                    {errors.lastName && <span className="field-err">{errors.lastName}</span>}
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-field">
                    <label htmlFor="reg-email">Email Address <span className="req-star">*</span></label>
                    <input
                      id="reg-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? "input-err" : ""}
                      autoComplete="off"
                    />
                    {errors.email && <span className="field-err">{errors.email}</span>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="reg-phone">Phone Number <span className="req-star">*</span></label>
                    <input
                      id="reg-phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={10}
                      className={errors.phone ? "input-err" : ""}
                      autoComplete="off"
                    />
                    {errors.phone && <span className="field-err">{errors.phone}</span>}
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-field">
                    <label htmlFor="reg-password">Password <span className="req-star">*</span></label>
                    <div className="pwd-input-wrap">
                      <input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={errors.password ? "input-err" : ""}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="pwd-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.password && <span className="field-err">{errors.password}</span>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="reg-confirmPassword">Confirm Password <span className="req-star">*</span></label>
                    <div className="pwd-input-wrap">
                      <input
                        id="reg-confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={errors.confirmPassword ? "input-err" : ""}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="pwd-toggle-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.confirmPassword && <span className="field-err">{errors.confirmPassword}</span>}
                  </div>
                </div>

                <button type="submit" className="split-submit-btn" disabled={loading} style={{ marginTop: "10px" }}>
                  {loading ? (
                    <>
                      <FaSpinner className="spinner-icon" /> Creating Account...
                    </>
                  ) : (
                    "Register Account"
                  )}
                </button>
              </form>

              <div className="split-form-footer">
                Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
              </div>
            </div>
          ) : (
            /* STAGE 2: SET UP GOOGLE AUTHENTICATOR PAGE */
            <div className="split-form-inner" style={{ maxWidth: "440px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                <div style={{ width: "52px", height: "52px", background: "#D6E9F2", border: "1px solid #B7D8EA", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaShieldAlt style={{ fontSize: "26px", color: "#2482C1" }} />
                </div>
              </div>

              <div className="split-form-header" style={{ marginBottom: "16px" }}>
                <h2 style={{ fontSize: "1.6rem" }}>Set Up Google Authenticator</h2>
                <p>Scan the QR code with <strong>Google Authenticator</strong> app to enable two-factor recovery.</p>
              </div>

              {/* QR Code Container with High-Res Presentation */}
              <div style={{
                background: "#ffffff",
                border: "1.5px solid #B7D8EA",
                borderRadius: "16px",
                padding: "16px",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(141, 187, 215, 0.2)",
                marginBottom: "18px"
              }}>
                {totpModal.qrCodeUrl ? (
                  <img
                    src={totpModal.qrCodeUrl}
                    alt="Google Authenticator QR Code"
                    style={{ width: "180px", height: "180px", display: "block", borderRadius: "8px" }}
                  />
                ) : (
                  <div style={{ width: "180px", height: "180px", display: "flex", alignItems: "center", justifyContent: "center", color: "#2482C1" }}>
                    <FaQrcode style={{ fontSize: "48px" }} />
                  </div>
                )}
              </div>

              {totpModal.error && (
                <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "8px 12px", borderRadius: "8px", fontSize: "13px", marginBottom: "14px" }}>
                  {totpModal.error}
                </div>
              )}

              {totpModal.success && (
                <div style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#166534", padding: "8px 12px", borderRadius: "8px", fontSize: "13px", marginBottom: "14px", fontWeight: "700" }}>
                  <FaCheckCircle style={{ marginRight: "6px" }} /> Security Setup Verified & Enabled!
                </div>
              )}

              <form onSubmit={handleVerifyTotpSetup} className="split-form" autoComplete="off">
                <div className="form-field" style={{ textAlign: "left" }}>
                  <label htmlFor="totp-otp-setup" style={{ textAlign: "center", display: "block" }}>
                    Enter 6-Digit Code from App <span className="req-star">*</span>
                  </label>
                  <input
                    id="totp-otp-setup"
                    type="text"
                    maxLength={6}
                    required
                    value={totpModal.otpInput}
                    onChange={(e) => setTotpModal({ ...totpModal, otpInput: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                    style={{
                      width: "100%",
                      height: "48px",
                      fontSize: "22px",
                      fontWeight: "800",
                      textAlign: "center",
                      letterSpacing: "6px",
                      border: "1.5px solid #B7D8EA",
                      borderRadius: "8px"
                    }}
                    autoComplete="off"
                  />
                </div>

                <button
                  type="submit"
                  className="split-submit-btn"
                  disabled={totpModal.verifying || totpModal.success}
                  style={{ marginTop: "6px" }}
                >
                  {totpModal.verifying ? (
                    <>
                      <FaSpinner className="spinner-icon" /> Verifying Code...
                    </>
                  ) : (
                    "Verify & Enable Security"
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {popup.show && (
        <div className="clean-modal-backdrop" onClick={closePopup}>
          <div className="clean-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-x-btn" onClick={closePopup} aria-label="Close modal">
              &times;
            </button>
            <div className="modal-icon-header">
              <FaCheckCircle className="modal-icon-success" />
            </div>
            <h3>{popup.title}</h3>
            <p>{popup.message}</p>
            <button className="split-submit-btn" onClick={closePopup} style={{ width: "100%", marginTop: "14px" }}>
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Register;
