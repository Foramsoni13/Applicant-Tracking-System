import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaShieldAlt, FaKey, FaCheckCircle, FaSpinner, FaLock, FaExclamationTriangle } from "react-icons/fa";
import * as THREE from "three";
import { API_BASE_URL } from "../../utils/constants";
import "../Login/Login.css";
import "../Register/Register.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const canvasContainerRef = useRef(null);

  // Wizard Steps: 1 = Email, 2 = Verify TOTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // --- Three.js 3D Isometric Recruitment Network (Identical to Login / Register) ---
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

  // Step 1: Request Password Recovery by Email
  const handleStep1Email = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      setInfoMessage(data.message || "If the account exists, continue with password recovery.");
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to process request.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-digit code from Google Authenticator
  const handleStep2VerifyTotp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError("Please enter the current 6-digit code from Google Authenticator.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/api/auth/verify-forgot-password-totp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.resetToken) {
        throw new Error(data.message || "Invalid verification code. Please enter the current 6-digit code from Google Authenticator.");
      }

      setResetToken(data.resetToken);
      setStep(3);
    } catch (err) {
      setError(err.message || "Invalid verification code. Please enter the current 6-digit code from Google Authenticator.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Update Password with resetToken
  const handleStep3ResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword) {
      setError("New password is required.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          resetToken,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Your password reset session has expired. Please start Forgot Password again.");
      }

      setStep(4);
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-login-wrapper">
      <div className="split-login-card" style={{ maxWidth: "1060px" }}>
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
            RIGHT PANEL: CLEAN AUTH FORM
            ================================================================= */}
        <div className="split-form-panel">
          <div className="split-form-inner" style={{ maxWidth: "420px" }}>
            <div className="split-form-header">
              <h2>
                {step === 1 && "Forgot Password"}
                {step === 2 && "Verify Security Code"}
                {step === 3 && "Create New Password"}
                {step === 4 && "Password Reset Complete"}
              </h2>
              <p>
                {step === 1 && "Enter your email address to recover your account."}
                {step === 2 && "Enter the 6-digit code from Google Authenticator."}
                {step === 3 && "Enter your new password to secure your account."}
                {step === 4 && "Your password has been successfully updated."}
              </p>
            </div>

            {error && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaExclamationTriangle /> {error}
              </div>
            )}

            {/* STEP 1: ENTER EMAIL */}
            {step === 1 && (
              <form onSubmit={handleStep1Email} className="split-form" autoComplete="off">
                <div className="form-field">
                  <label htmlFor="forgot-email">Email Address <span className="req-star">*</span></label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                <button type="submit" className="split-submit-btn" disabled={loading} style={{ marginTop: "10px" }}>
                  {loading ? <><FaSpinner className="spinner-icon" /> Checking Account...</> : "Continue"}
                </button>
              </form>
            )}

            {/* STEP 2: VERIFY GOOGLE AUTHENTICATOR 6-DIGIT OTP */}
            {step === 2 && (
              <form onSubmit={handleStep2VerifyTotp} className="split-form" autoComplete="off">
                {infoMessage && (
                  <div style={{ background: "#D6E9F2", border: "1px solid #B7D8EA", color: "#000000", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", marginBottom: "16px", fontWeight: "600" }}>
                    {infoMessage}
                  </div>
                )}

                <div className="form-field">
                  <label htmlFor="totp-otp">Enter 6-Digit Code <span className="req-star">*</span></label>
                  <input
                    id="totp-otp"
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    style={{ fontSize: "22px", letterSpacing: "6px", textAlign: "center", fontWeight: "800", height: "50px" }}
                    autoComplete="off"
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => { setStep(1); setError(""); }}
                    style={{ padding: "12px 18px", borderRadius: "8px", border: "1px solid #B7D8EA", background: "#ffffff", color: "#000000", fontWeight: "700", cursor: "pointer" }}
                  >
                    Back
                  </button>
                  <button type="submit" className="split-submit-btn" style={{ flex: 1, marginTop: "0" }} disabled={loading}>
                    {loading ? <><FaSpinner className="spinner-icon" /> Verifying Code...</> : "Verify OTP"}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: CREATE NEW PASSWORD */}
            {step === 3 && (
              <form onSubmit={handleStep3ResetPassword} className="split-form" autoComplete="off">
                <div className="form-field">
                  <label htmlFor="new-password">New Password <span className="req-star">*</span></label>
                  <input
                    id="new-password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="confirm-new-password">Confirm Password <span className="req-star">*</span></label>
                  <input
                    id="confirm-new-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>

                <button type="submit" className="split-submit-btn" disabled={loading} style={{ marginTop: "10px" }}>
                  {loading ? <><FaSpinner className="spinner-icon" /> Resetting Password...</> : "Reset Password"}
                </button>
              </form>
            )}

            {/* STEP 4: SUCCESS CONFIRMATION */}
            {step === 4 && (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ background: "#dcfce7", color: "#166534", padding: "16px", borderRadius: "12px", fontSize: "14px", marginBottom: "20px", fontWeight: "700" }}>
                  <FaCheckCircle style={{ marginRight: "6px" }} />
                  Your password has been updated successfully. You can now log in with your new password.
                </div>

                <button
                  className="split-submit-btn"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => navigate("/login")}
                >
                  Go to Login
                </button>
              </div>
            )}

            <div className="split-form-footer">
              Remembered your password? <Link to="/login" className="auth-link">Back to Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;