import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import { NATIONS } from "../data/nations";

const OCEAN = "#0F172A";
const LAND = "#e2e8f0";
const LAND_BORDER = "#94a3b8";
const NATION = "#2596be";
const NATION_SELECTED = "#5fc4e7";

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}

// Slowly spinning globe with country borders. Jewel's nations are azure;
// selecting one (via chip or by tapping the country) spins the camera to it.
// Renders nothing when WebGL is unavailable — the About page stays fully
// usable through the chips and story cards.
export default function NationsGlobe({ selected, onSelect }) {
  const globeRef = useRef(null);
  const containerRef = useRef(null);
  const [size, setSize] = useState(0);
  const [countries, setCountries] = useState([]);
  const [webgl] = useState(hasWebGL);

  const nationsById = useMemo(
    () => new Map(NATIONS.map((n) => [n.id, n])),
    [],
  );

  const globeMaterial = useMemo(
    () => new THREE.MeshPhongMaterial({ color: OCEAN, shininess: 6 }),
    [],
  );

  // Country borders, fetched at runtime so they stay out of the JS bundle.
  useEffect(() => {
    if (!webgl) return;
    let cancelled = false;
    fetch("/data/world-countries.geojson")
      .then((res) => res.json())
      .then((geo) => {
        if (cancelled) return;
        // Antarctica just adds a big white blob at the south pole.
        setCountries(geo.features.filter((f) => f.id !== "ATA"));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [webgl]);

  // Square canvas sized to the container. The initial measure runs from a
  // timeout because ResizeObserver callbacks ride on render frames, which
  // hidden/background tabs never produce.
  useEffect(() => {
    if (!webgl) return;
    const el = containerRef.current;
    if (!el) return;
    const measure = () =>
      setSize(Math.round(Math.min(el.clientWidth, 520)));
    const initial = setTimeout(measure, 0);
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(initial);
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [webgl]);

  // Gentle auto-rotation; paused while a nation is selected. Zoom is off so
  // the page never traps scrolling.
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !size) return;
    const controls = globe.controls();
    controls.enableZoom = false;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    controls.autoRotate = !reduceMotion && !selected;
    controls.autoRotateSpeed = 0.65;
  }, [size, selected, countries]);

  // Spin to the selected nation.
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !selected) return;
    globe.pointOfView(
      { lat: selected.lat, lng: selected.lng, altitude: 1.8 },
      1200,
    );
  }, [selected]);

  if (!webgl) return null;

  return (
    <div
      ref={containerRef}
      className="flex w-full min-w-0 justify-center overflow-hidden"
      aria-hidden="true"
    >
      {size > 0 && (
        <Globe
          ref={globeRef}
          width={size}
          height={size}
          backgroundColor="rgba(0,0,0,0)"
          globeMaterial={globeMaterial}
          showAtmosphere
          atmosphereColor="#2596be"
          atmosphereAltitude={0.18}
          polygonsData={countries}
          polygonAltitude={(f) =>
            // Caps must sit well above the sphere; lower values z-fight
            // with the globe and show hatched artifacts on big countries.
            selected && f.id === selected.id ? 0.06 : 0.02
          }
          polygonCapColor={(f) => {
            if (selected && f.id === selected.id) return NATION_SELECTED;
            return nationsById.has(f.id) ? NATION : LAND;
          }}
          polygonSideColor={() => "rgba(15, 23, 42, 0.35)"}
          polygonStrokeColor={(f) =>
            nationsById.has(f.id) ? "#ffffff" : LAND_BORDER
          }
          polygonsTransitionDuration={300}
          polygonLabel={(f) =>
            `<span style="font-family: 'DM Sans', sans-serif; font-size: 12px; color: #fff; background: #0F172A; padding: 3px 10px; border-radius: 9999px; white-space: nowrap;">${f.properties.name}</span>`
          }
          onPolygonClick={(f) => {
            const nation = nationsById.get(f.id);
            if (nation && onSelect) onSelect(nation);
          }}
        />
      )}
    </div>
  );
}
