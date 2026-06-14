import { useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import * as THREE from "three";

/* ─── Single Plasma Wave Ribbon ───────────────────────── */
function PlasmaWave({ index, total, color, radius = 1.25 }) {
  const meshRef = useRef();

  // Build a closed curved ribbon that spirals around the sphere
  const curve = new THREE.CatmullRomCurve3(
    (() => {
      const pts = [];
      const phaseOffset = (index / total) * Math.PI * 2;
      const tiltAngle = (index / total) * Math.PI - Math.PI / 2;
      const segments = 60;
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        const spiralLift = Math.sin(t * 2 + phaseOffset) * 0.15;
        const x = (radius + spiralLift) * Math.cos(t) * Math.cos(tiltAngle);
        const y = (radius + spiralLift) * Math.sin(tiltAngle * 0.6 + t * 0.1);
        const z = (radius + spiralLift) * Math.sin(t) * Math.cos(tiltAngle * 0.7);
        pts.push(new THREE.Vector3(x, y, z));
      }
      return pts;
    })(),
    true
  );

  const tubeGeo = new THREE.TubeGeometry(curve, 80, 0.032, 8, true);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
      meshRef.current.rotation.x += 0.001;
    }
  });

  return (
    <mesh ref={meshRef} geometry={tubeGeo}>
      <meshStandardMaterial
        color={color}
        roughness={0.25}
        metalness={0.2}
        transparent
        opacity={0.82}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ─── Earth Sphere ─────────────────────────────────────── */
function EarthSphere() {
  const sphereRef = useRef();

  // Simple procedural earth appearance using vertex colors
  const geo = new THREE.SphereGeometry(1, 64, 64);

  // Paint vertex colors to approximate ocean/land pattern
  const posAttr = geo.attributes.position;
  const colorsArr = new Float32Array(posAttr.count * 3);
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const lat = Math.asin(y) * (180 / Math.PI);
    const lon = Math.atan2(z, x) * (180 / Math.PI);

    // Simple land/ocean heuristic
    const isLand =
      (lat > 10 && lat < 70 && lon > -10 && lon < 145) || // Eurasia
      (lat > 15 && lat < 70 && lon > -160 && lon < -50) || // N.America
      (lat > -35 && lat < 15 && lon > -85 && lon < -35) || // S.America
      (lat > -35 && lat < 37 && lon > -20 && lon < 52);    // Africa

    if (isLand) {
      colorsArr[i * 3]     = 0.13;  // r
      colorsArr[i * 3 + 1] = 0.42;  // g
      colorsArr[i * 3 + 2] = 0.25;  // b — forest green
    } else {
      colorsArr[i * 3]     = 0.05;
      colorsArr[i * 3 + 1] = 0.22;
      colorsArr[i * 3 + 2] = 0.55;  // ocean blue
    }
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colorsArr, 3));

  useFrame(() => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y += 0.0018;
    }
  });

  return (
    <mesh ref={sphereRef} geometry={geo}>
      <meshStandardMaterial
        vertexColors
        roughness={0.65}
        metalness={0.05}
      />
    </mesh>
  );
}

/* ─── Atmosphere Glow ──────────────────────────────────── */
function AtmosphereGlow() {
  return (
    <Sphere args={[1.06, 64, 64]}>
      <meshStandardMaterial
        color="#7dd3fc"
        transparent
        opacity={0.12}
        side={THREE.BackSide}
        roughness={1}
        metalness={0}
      />
    </Sphere>
  );
}

/* ─── Full Scene ────────────────────────────────────────── */
function GlobeScene() {
  const WAVE_COLORS = [
    "#f9a8d4", "#fbcfe8", "#e9d5ff", "#c4b5fd", // pinks & lavenders
    "#bae6fd", "#93c5fd", "#a5f3fc", "#86efac",  // sky blues & mint
    "#fca5a5", "#fdba74",                          // warm accent
  ];

  const WAVE_COUNT = 10;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-4, -2, -3]} intensity={0.4} color="#7dd3fc" />
      <pointLight position={[0, 3, 3]} intensity={0.6} color="#f9a8d4" />

      {/* Earth + Glow */}
      <EarthSphere />
      <AtmosphereGlow />

      {/* Plasma Wave Ribbons */}
      {WAVE_COLORS.map((col, i) => (
        <PlasmaWave
          key={i}
          index={i}
          total={WAVE_COUNT}
          color={col}
          radius={1.22 + (i % 3) * 0.04}
        />
      ))}

      {/* Slow auto-rotate controls (disabled mouse interaction) */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.6}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

/* ─── Exported PlasmaGlobe Component ──────────────────── */
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

export default function PlasmaGlobe({ height = "100%" }) {
  const webglAvailable = isWebGLAvailable();

  if (!webglAvailable) {
    return (
      <div style={{
        width: "100%", height, minHeight: "280px", borderRadius: "12px", overflow: "hidden",
        display: "flex", flexDirection: "column", alignItems: "center", justifySpaceAround: "center", justifyContent: "center",
        background: "rgba(10, 10, 25, 0.4)", border: "1px dashed rgba(99, 102, 241, 0.3)",
        color: "#94a3b8", padding: "20px", textAlign: "center"
      }}>
        <div style={{
          width: "70px", height: "70px", borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #d946ef)",
          display: "flex", alignItems: "center", justifySpaceAround: "center", justifyContent: "center",
          marginBottom: "12px", boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
          fontSize: "28px", animation: "spin 12s linear infinite"
        }}>
          🪐
        </div>
        <p style={{ fontSize: "12.5px", fontWeight: 700, color: "white", margin: "0 0 4px" }}>Holographic Network Node Offline</p>
        <p style={{ fontSize: "11px", color: "#8891a8", margin: 0 }}>WebGL is not supported or hardware acceleration is disabled in this environment.</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height, minHeight: "300px", borderRadius: "12px", overflow: "hidden" }}>
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 45 }}
        style={{ background: "transparent" }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <GlobeScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
