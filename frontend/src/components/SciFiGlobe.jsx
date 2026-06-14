import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ArrowRight } from "lucide-react";

function isWebGLAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch (e) {
    return false;
  }
}

const CITIES = [
  { name: "Chennai", lat: 13.0827, lon: 80.2707, status: "Active Headquarters", details: "APAC Primary Hub · 156 Active Customers", color: "#10b981", emoji: "🏢", active: true },
  { name: "Mumbai", lat: 19.0760, lon: 72.8777, status: "Active Regional Hub", details: "India West Division · 342 Active Customers", color: "#10b981", emoji: "📈", active: true },
  { name: "Bangalore", lat: 12.9716, lon: 77.5946, status: "Active Tech Node", details: "R&D Operations · 198 Active Customers", color: "#10b981", emoji: "💻", active: true },
  { name: "New York", lat: 40.7128, lon: -74.0060, status: "Upcoming US East Hub", details: "US Eastern Division · Launch Q3 2026", color: "#3b82f6", emoji: "🗽", active: false },
  { name: "London", lat: 51.5074, lon: -0.1278, status: "Upcoming Europe Hub", details: "UK & Western Europe · Launch Q3 2026", color: "#3b82f6", emoji: "🎡", active: false },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503, status: "Upcoming East Asia Hub", details: "Japan Operations · Launch Q4 2026", color: "#3b82f6", emoji: "🗼", active: false },
  { name: "Singapore", lat: 1.3521, lon: 103.8198, status: "Upcoming ASEAN Hub", details: "Southeast Asia central · Launch Q4 2026", color: "#3b82f6", emoji: "🦁", active: false },
  { name: "Paris", lat: 48.8566, lon: 2.3522, status: "Upcoming EU Central Node", details: "Central Europe Central · Launch Q1 2027", color: "#3b82f6", emoji: "🏰", active: false },
  { name: "Sydney", lat: -33.8688, lon: 151.2093, status: "Upcoming ANZ Node", details: "Oceania Central Division · Launch Q1 2027", color: "#3b82f6", emoji: "🦘", active: false },
  { name: "Dubai", lat: 25.2048, lon: 55.2708, status: "Upcoming MEA Node", details: "Middle East & Africa central · Launch Q2 2027", color: "#3b82f6", emoji: "🐪", active: false },
  { name: "San Francisco", lat: 37.7749, lon: -122.4194, status: "Upcoming US West Hub", details: "Silicon Valley operations · Launch Q2 2027", color: "#3b82f6", emoji: "🌁", active: false },
  { name: "Toronto", lat: 43.6532, lon: -79.3832, status: "Upcoming Canada Node", details: "North America East network · Launch Q3 2027", color: "#3b82f6", emoji: "🍁", active: false },
  { name: "Berlin", lat: 52.5200, lon: 13.4050, status: "Upcoming Central Europe Node", details: "Central EU Operations · Launch Q3 2027", color: "#3b82f6", emoji: "🥨", active: false }
];

export default function SciFiGlobe() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const [loadingTexture, setLoadingTexture] = useState(true);
  const autoCycleTimer = useRef(null);
  const rotationParamsRef = useRef({ targetX: 0, targetY: 0, currentX: 0.15, currentY: 0 });

  const GLOBE_RADIUS = 3.2;

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setUserInteracted(true);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    rotationParamsRef.current.targetY += deltaX * 0.0055;
    rotationParamsRef.current.targetX += deltaY * 0.0055;

    const maxLat = 85 * Math.PI / 180;
    rotationParamsRef.current.targetX = Math.max(-maxLat, Math.min(maxLat, rotationParamsRef.current.targetX));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handlePointerLeave = () => {
    setIsDragging(false);
  };

  const activeCity = CITIES[activeIdx];
  const isDark = document.documentElement.classList.contains("dark");
  const webglAvailable = isWebGLAvailable();

  // Setup auto-cycling
  useEffect(() => {
    if (userInteracted) {
      const resumeTimer = setTimeout(() => {
        setUserInteracted(false);
      }, 14000);
      return () => clearTimeout(resumeTimer);
    }

    autoCycleTimer.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % CITIES.length);
    }, 4500);

    return () => clearInterval(autoCycleTimer.current);
  }, [userInteracted]);

  // Update rotation targets on active city change
  useEffect(() => {
    const city = CITIES[activeIdx];
    const theta = (city.lon + 180) * (Math.PI / 180);
    rotationParamsRef.current.targetY = -theta;
    rotationParamsRef.current.targetX = (city.lat * Math.PI) / 180;
  }, [activeIdx]);

  // Three.js Render Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || !isWebGLAvailable()) return;

    const canvasContainer = canvas.parentElement;
    let width = canvasContainer.clientWidth;
    let height = canvasContainer.clientHeight || 520;

    // Scene setup
    const scene = new THREE.Scene();
    // Subtle fog matching theme background
    scene.fog = new THREE.FogExp2(isDark ? 0x090d16 : 0xe2e8f0, 0.01);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.0);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Master Group containing rings and globe
    const constructGroup = new THREE.Group();
    constructGroup.rotation.x = 0.15;
    scene.add(constructGroup);

    // Inner Globe Group tilted at axial tilt of Earth (0.41 rad ≈ 23.5 degrees)
    const globeGroup = new THREE.Group();
    globeGroup.rotation.order = 'YXZ';
    globeGroup.rotation.z = 0.41;
    constructGroup.add(globeGroup);

    // 1. Core Sphere night texture loader
    const textureLoader = new THREE.TextureLoader();
    const earthNightTextureUrl = 'https://unpkg.com/three-globe/example/img/earth-night.jpg';

    let coreMesh;
    textureLoader.load(earthNightTextureUrl, (texture) => {
      setLoadingTexture(false);

      const coreGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
      const coreMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.9,
        metalness: 0.1,
        emissive: new THREE.Color(0x112244),
        emissiveMap: texture,
        emissiveIntensity: 1.8
      });
      coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
      globeGroup.add(coreMesh);
    });

    // 2. City Coordinate Pin Markers
    const pinGroup = new THREE.Group();
    globeGroup.add(pinGroup);

    const pinGeoActive = new THREE.SphereGeometry(0.048, 16, 16);
    const pinMatActive = new THREE.MeshBasicMaterial({ color: 0x10b981 });

    const pinGeoUpcoming = new THREE.SphereGeometry(0.038, 16, 16);
    const pinMatUpcoming = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });

    CITIES.forEach((c) => {
      const phi = (90 - c.lat) * (Math.PI / 180);
      const theta = (c.lon + 180) * (Math.PI / 180);
      const r = GLOBE_RADIUS + 0.018; // float slightly above the texture layer

      // Precise spherical UV mapping projection matching standard texture wrap
      const x = -(r * Math.sin(phi) * Math.sin(theta));
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.cos(theta);

      const pin = new THREE.Mesh(
        c.active ? pinGeoActive : pinGeoUpcoming,
        c.active ? pinMatActive : pinMatUpcoming
      );
      pin.position.set(x, y, z);
      pinGroup.add(pin);
    });

    // 3. 4 Steel-Blue Torus Rings
    const ringMaterialSolid = new THREE.MeshStandardMaterial({
      color: 0x1a4066,
      emissive: 0x0a2040,
      metalness: 0.7,
      roughness: 0.2,
      flatShading: false,
      transparent: true,
      opacity: 0.8
    });

    const rings = [];
    const numRings = 4;
    for (let i = 0; i < numRings; i++) {
      const radius = (GLOBE_RADIUS * 1.15) + (i * 0.28);
      const thickness = 0.032;

      const ringGeo = new THREE.TorusGeometry(radius, thickness, 32, 100);
      const ring = new THREE.Mesh(ringGeo, ringMaterialSolid);

      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;

      ring.userData = {
        speedX: (Math.random() - 0.5) * 0.003,
        speedY: (Math.random() - 0.5) * 0.003,
        speedZ: (Math.random() - 0.5) * 0.003
      };

      rings.push(ring);
      constructGroup.add(ring);
    }

    // 4. Starfield Background
    const starGeo = new THREE.BufferGeometry();
    const starCount = 3000;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starPos[i] = (Math.random() - 0.5) * 160;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: isDark ? 0xffffff : 0x2563eb,
      size: 0.09,
      transparent: true,
      opacity: 0.65
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // 4.5. Glowing Cosmic Nebula
    const nebulaGeo = new THREE.BufferGeometry();
    const nebulaCount = 1000;
    const nebulaPos = new Float32Array(nebulaCount * 3);
    const nebulaColor = new Float32Array(nebulaCount * 3);
    const colors = [
      new THREE.Color(0xa5f3fc), // Sky blue/cyan
      new THREE.Color(0xc4b5fd), // Soft lavender
      new THREE.Color(0xfbcfe8), // Soft pink
      new THREE.Color(0xa7f3d0)  // Mint green
    ];

    for (let i = 0; i < nebulaCount; i++) {
      const distRadius = 3.5 + Math.random() * 8.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      nebulaPos[i * 3] = distRadius * Math.sin(phi) * Math.cos(theta);
      nebulaPos[i * 3 + 1] = distRadius * Math.sin(phi) * Math.sin(theta);
      nebulaPos[i * 3 + 2] = distRadius * Math.cos(phi);

      const randColor = colors[Math.floor(Math.random() * colors.length)];
      nebulaColor[i * 3] = randColor.r;
      nebulaColor[i * 3 + 1] = randColor.g;
      nebulaColor[i * 3 + 2] = randColor.b;
    }
    nebulaGeo.setAttribute("position", new THREE.BufferAttribute(nebulaPos, 3));
    nebulaGeo.setAttribute("color", new THREE.BufferAttribute(nebulaColor, 3));

    const nebulaMat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.65 : 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const nebula = new THREE.Points(nebulaGeo, nebulaMat);
    scene.add(nebula);

    // 5. Lighting Overhaul (Brightened environment)
    const ambientLight = new THREE.AmbientLight(0x203040, 2.0);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3.0);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0x0066ff, 2.5);
    backLight.position.set(-10, -10, -10);
    scene.add(backLight);

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Base globeGroup rotation targeting active city
      const params = rotationParamsRef.current;

      let diffY = params.targetY - params.currentY;
      diffY = Math.atan2(Math.sin(diffY), Math.cos(diffY));
      params.currentY += diffY * 0.125;

      let diffX = params.targetX - params.currentX;
      diffX = Math.atan2(Math.sin(diffX), Math.cos(diffX));
      params.currentX += diffX * 0.125;

      globeGroup.rotation.y = params.currentY;
      globeGroup.rotation.x = params.currentX;

      // Slowly rotate constructGroup master coordinate system
      constructGroup.rotation.y += 0.0028;

      // Rotate individual Torus rings
      rings.forEach((ring) => {
        ring.rotation.x += ring.userData.speedX;
        ring.rotation.y += ring.userData.speedY;
        ring.rotation.z += ring.userData.speedZ;
      });

      // Slowly rotate stars & nebula
      stars.rotation.y -= 0.0001;
      nebula.rotation.y += 0.0003;
      nebula.rotation.z -= 0.00015;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!canvas.parentElement) return;
      const curWidth = canvas.parentElement.clientWidth;
      const curHeight = canvas.parentElement.clientHeight || 520;

      camera.aspect = curWidth / curHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(curWidth, curHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [isDark]);

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: window.innerWidth < 768 ? "column" : "row",
        width: "100%",
        minHeight: "340px",
        height: "100%",
        gap: "16px",
        position: "relative",
      }}
    >
      {/* Left Column: Interactive City Selector */}
      <div
        style={{
          width: window.innerWidth < 768 ? "100%" : "40%",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          overflowY: "auto",
          maxHeight: "480px",
          paddingRight: "8px",
        }}
        className="custom-scrollbar"
      >
        <p
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            margin: "0 0 8px 4px",
          }}
        >
          Operational Locations ({CITIES.length})
        </p>

        {CITIES.map((c, idx) => {
          const isActive = idx === activeIdx;
          return (
            <button
              key={c.name}
              onClick={() => {
                setActiveIdx(idx);
                setUserInteracted(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderRadius: "10px",
                border: isActive
                  ? "1px solid var(--color-sidebar-active-border)"
                  : "1px solid var(--glass-border-soft)",
                background: isActive
                  ? "var(--color-sidebar-active-bg)"
                  : "var(--glass-bg)",
                color: isActive
                  ? "var(--color-sidebar-active-text)"
                  : "var(--color-text-primary)",
                cursor: "pointer",
                transition: "all 0.18s ease",
                textAlign: "left",
                backdropFilter: "var(--glass-blur-sm)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--color-surface-hover)";
                  e.currentTarget.style.borderColor = "var(--glass-border)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--glass-bg)";
                  e.currentTarget.style.borderColor = "var(--glass-border-soft)";
                }
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "16px", userSelect: "none" }}>{c.emoji}</span>
                <div>
                  <span style={{ fontSize: "12.5px", fontWeight: 700, display: "block" }}>
                    {c.name}
                  </span>
                  <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                    {c.status}
                  </span>
                </div>
              </div>
              <ArrowRight
                size={11}
                style={{
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? "translateX(0)" : "translateX(-4px)",
                  transition: "all 0.18s ease",
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Right Column: WebGL Canvas Globe Area */}
      <div
        style={{
          width: window.innerWidth < 768 ? "100%" : "60%",
          height: "100%",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        {webglAvailable ? (
          <>
            <canvas ref={canvasRef} style={{ display: "block" }} />

            {/* Loading overlay for earth texture */}
            {loadingTexture && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "var(--color-surface-panel)",
                  backdropFilter: "var(--glass-blur-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 20,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      border: "3px solid var(--color-surface-border)",
                      borderTop: "3px solid var(--color-sidebar-active-border)",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 600 }}>
                    Loading Earth telemetry...
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{
            width: "100%",
            height: "100%",
            minHeight: "340px",
            background: "rgba(10, 10, 25, 0.4)",
            border: "1px dashed rgba(99, 102, 241, 0.2)",
            borderRadius: "14px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#94a3b8",
            padding: "24px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Radial radar scanning overlay */}
            <div style={{
              position: "absolute",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              border: "1px solid rgba(99, 102, 241, 0.15)",
              background: "radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)",
              animation: "pulse 3s infinite ease-in-out"
            }} />
            <div style={{
              position: "absolute",
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              border: "1px solid rgba(217, 70, 239, 0.1)",
              animation: "pulse 5s infinite ease-in-out"
            }} />
            {/* Scanning line */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "2px",
              background: "linear-gradient(90deg, transparent, #6366f1, transparent)",
              boxShadow: "0 0 8px #6366f1",
              animation: "scanLine 4s infinite linear"
            }} />

            {/* Central status */}
            <div style={{
              width: "80px", height: "80px", borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(217, 70, 239, 0.1))",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "32px", marginBottom: "16px", zIndex: 5,
              animation: "bounce 2s infinite ease-in-out"
            }}>
              📡
            </div>
            <h3 style={{ fontSize: "14.5px", fontWeight: 700, color: "white", margin: "0 0 6px", zIndex: 5 }}>
              2D Telemetry Feed Active
            </h3>
            <p style={{ fontSize: "11px", color: "#8891a8", maxWidth: "280px", margin: 0, zIndex: 5, lineHeight: 1.5 }}>
              {activeCity.name} Hub Node: Coordinates {activeCity.lat.toFixed(2)}°N, {activeCity.lon.toFixed(2)}°E are fully mapped to your workspace.
            </p>

            <style>{`
              @keyframes pulse {
                0%, 100% { transform: scale(0.9); opacity: 0.5; }
                50% { transform: scale(1.1); opacity: 0.9; }
              }
              @keyframes scanLine {
                0% { top: 0%; }
                50% { top: 100%; }
                100% { top: 0%; }
              }
              @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-6px); }
              }
            `}</style>
          </div>
        )}

        {/* Floating Detail Overlay Popup Card */}
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            right: "12px",
            background: "var(--color-surface-panel)",
            backdropFilter: "var(--glass-blur-lg)",
            WebkitBackdropFilter: "var(--glass-blur-lg)",
            border: "1px solid var(--color-surface-border)",
            borderRadius: "14px",
            padding: "12px 14px",
            boxShadow: "var(--glass-shadow-lg)",
            maxWidth: "250px",
            width: "calc(100% - 24px)",
            pointerEvents: "none",
            animation: "crmFadeIn 0.22s ease",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span style={{ fontSize: "18px", userSelect: "none" }}>{activeCity.emoji}</span>
            <span style={{ fontSize: "12.5px", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {activeCity.name} Hub
            </span>
          </div>

          <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "0 0 6px", lineHeight: 1.4 }}>
            {activeCity.details}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", borderTop: "1px solid var(--color-surface-border)", paddingTop: "6px", marginTop: "6px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "8px", textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 700 }}>Latitude</span>
              <span style={{ fontSize: "9.5px", color: "var(--color-text-primary)", fontWeight: 600 }}>{activeCity.lat.toFixed(4)}° N</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "8px", textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 700 }}>Longitude</span>
              <span style={{ fontSize: "9.5px", color: "var(--color-text-primary)", fontWeight: 600 }}>{activeCity.lon.toFixed(4)}° E</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
