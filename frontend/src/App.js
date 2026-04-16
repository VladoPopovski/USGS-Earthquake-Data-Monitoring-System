import { useEffect, useRef, useState } from "react";
import axios from "axios";

const API = "http://localhost:8080/api/earthquakes";

function magColor(mag) {
  if (mag >= 5) return "#ef4444";
  if (mag >= 3) return "#f97316";
  return "#22c55e";
}

function initMap(container) {
  return new Promise((resolve) => {
    if (!document.getElementById("leaflet-css")) {
      const link = Object.assign(document.createElement("link"), {
        id: "leaflet-css",
        rel: "stylesheet",
        href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
      });
      document.head.appendChild(link);
    }

    if (window.L) {
      resolve(window.L);
      return;
    }

    const script = Object.assign(document.createElement("script"), {
      src: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
      onload: () => resolve(window.L),
    });
    document.head.appendChild(script);
  }).then((L) => {
    const map = L.map(container, { center: [20, 0], zoom: 2 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    return { L, map };
  });
}

export default function App() {
  const [quakes, setQuakes]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(false);
  const [notice, setNotice]     = useState(null);
  const [filterTime, setFilter] = useState("");
  const [tab, setTab]           = useState("table");

  const mapRef     = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (tab !== "map") return;

    if (!leafletRef.current) {
      initMap(mapRef.current).then((instance) => {
        leafletRef.current = instance;
        plotMarkers(quakes, instance);
      });
    } else {
      plotMarkers(quakes, leafletRef.current);
    }
  }, [tab, quakes]);

  function plotMarkers(data, { L, map }) {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = data
      .filter((q) => q.latitude != null && q.longitude != null)
      .map((q) => {
        const color  = magColor(q.magnitude);
        const radius = Math.max(5, q.magnitude * 4);
        const marker = L.circleMarker([q.latitude, q.longitude], {
          radius,
          fillColor: color,
          color: "#fff",
          weight: 1,
          fillOpacity: 0.7,
        }).addTo(map);

        marker.bindPopup(
          `<div style="font-family:inherit;font-size:13px">
            <strong style="color:${color}">M ${q.magnitude?.toFixed(1)}</strong><br/>
            ${q.place ?? "Unknown"}<br/>
            <span style="color:#888">${q.time ? new Date(q.time).toLocaleString() : ""}</span>
          </div>`
        );
        return marker;
      });
  }

  async function load() {
    setLoading(true);
    try {
      const { data } = await axios.get(API);
      setQuakes(data);
    } catch {
      setNotice({ type: "error", text: "Could not load from database." });
    } finally {
      setLoading(false);
    }
  }

  async function fetchUSGS() {
    setFetching(true);
    setNotice(null);
    try {
      const { data } = await axios.post(`${API}/fetch`);
      setQuakes(data);
      setNotice({ type: "success", text: `${data.length} events loaded from USGS.` });
    } catch {
      setNotice({ type: "error", text: "USGS fetch failed." });
    } finally {
      setFetching(false);
    }
  }

  async function filterAfter() {
    if (!filterTime) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/after?time=${new Date(filterTime).toISOString()}`);
      setQuakes(data);
      setNotice({ type: "success", text: `${data.length} events after ${new Date(filterTime).toLocaleString()}` });
    } catch {
      setNotice({ type: "error", text: "Filter request failed." });
    } finally {
      setLoading(false);
    }
  }

  async function remove(id) {
    try {
      await axios.delete(`${API}/${id}`);
      setQuakes((prev) => prev.filter((q) => q.id !== id));
    } catch {
      setNotice({ type: "error", text: "Delete failed." });
    }
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&display=swap"
      />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0c0c0c; color: #e2e2e2; font-family: 'Outfit', sans-serif; }

        .app { min-height: 100vh; display: flex; flex-direction: column; }

        .topbar {
          border-bottom: 1px solid #1e1e1e;
          padding: 0 28px;
          height: 56px;
          display: flex;
          align-items: center;
          gap: 20px;
          background: #0c0c0c;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .topbar-title { font-size: 15px; font-weight: 600; color: #fff; letter-spacing: -0.2px; }
        .topbar-count { font-size: 12px; color: #555; }
        .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }

        .tabs { display: flex; gap: 2px; background: #161616; border-radius: 8px; padding: 3px; }
        .tab {
          padding: 5px 14px; border-radius: 6px; border: none;
          font-family: inherit; font-size: 13px; font-weight: 500;
          cursor: pointer; background: transparent; color: #666;
          transition: background 0.15s, color 0.15s;
        }
        .tab.active { background: #222; color: #fff; }

        .toolbar {
          padding: 12px 28px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid #1a1a1a;
        }

        .btn {
          padding: 7px 16px; border-radius: 7px; border: none;
          font-family: inherit; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: opacity 0.15s, background 0.15s;
        }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-primary  { background: #fff; color: #0c0c0c; }
        .btn-primary:hover:not(:disabled) { background: #e5e5e5; }
        .btn-secondary { background: #1a1a1a; color: #ccc; border: 1px solid #2a2a2a; }
        .btn-secondary:hover:not(:disabled) { background: #222; }
        .btn-ghost { background: transparent; color: #555; border: 1px solid #2a2a2a; }
        .btn-ghost:hover { background: #1a1a1a; color: #aaa; }
        .btn-danger { background: #1f0f0f; color: #ef4444; border: 1px solid #2e1010; font-size: 12px; padding: 5px 12px; }
        .btn-danger:hover { background: #2a1010; }

        input[type="datetime-local"] {
          background: #141414; border: 1px solid #2a2a2a; color: #ccc;
          padding: 7px 12px; border-radius: 7px;
          font-family: inherit; font-size: 13px; outline: none;
        }
        input[type="datetime-local"]:focus { border-color: #444; }

        .notice {
          margin: 16px 28px 0;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .notice.success { background: #0d1f14; color: #4ade80; border: 1px solid #14532d44; }
        .notice.error   { background: #1a0a0a; color: #f87171; border: 1px solid #7f1d1d44; }

        .content { padding: 20px 28px; flex: 1; }

        .empty { text-align: center; padding: 80px 0; color: #444; font-size: 14px; }
        .empty strong { color: #666; }

        .spinner-wrap { text-align: center; padding: 80px 0; }
        .spinner {
          width: 22px; height: 22px; border: 2px solid #2a2a2a;
          border-top-color: #666; border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead th {
          text-align: left; padding: 8px 12px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.5px;
          text-transform: uppercase; color: #444;
          border-bottom: 1px solid #1e1e1e;
        }
        tbody tr { border-bottom: 1px solid #141414; transition: background 0.1s; }
        tbody tr:hover { background: #111; }
        tbody td { padding: 12px 12px; vertical-align: middle; color: #bbb; }
        td.place { color: #e2e2e2; font-weight: 500; max-width: 240px; }
        td.mono  { font-family: 'Courier New', monospace; font-size: 11px; color: #555; }

        .mag-badge {
          display: inline-block;
          padding: 3px 9px;
          border-radius: 5px;
          font-weight: 600;
          font-size: 13px;
          background: #161616;
        }

        .type-tag {
          padding: 2px 8px; border-radius: 4px;
          background: #161616; color: #666;
          font-size: 11px; font-weight: 500;
          border: 1px solid #222;
        }

        .map-wrap { border-radius: 10px; overflow: hidden; border: 1px solid #1e1e1e; height: 520px; }
      `}</style>

      <div className="app">
        <div className="topbar">
          <span className="topbar-title">Earthquake Monitor</span>
          {quakes.length > 0 && (
            <span className="topbar-count">{quakes.length} events</span>
          )}
          <div className="topbar-right">
            <div className="tabs">
              <button className={`tab ${tab === "table" ? "active" : ""}`} onClick={() => setTab("table")}>Table</button>
              <button className={`tab ${tab === "map"   ? "active" : ""}`} onClick={() => setTab("map")}>Map</button>
            </div>
          </div>
        </div>

        <div className="toolbar">
          <button className="btn btn-primary" onClick={fetchUSGS} disabled={fetching}>
            {fetching ? "Fetching..." : "Fetch from USGS"}
          </button>
          <button className="btn btn-secondary" onClick={load}>Reload</button>
          <input
            type="datetime-local"
            value={filterTime}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button className="btn btn-secondary" onClick={filterAfter} disabled={!filterTime}>
            Filter after time
          </button>
          {filterTime && (
            <button className="btn btn-ghost" onClick={() => { setFilter(""); load(); }}>
              Clear filter
            </button>
          )}
        </div>

        {notice && (
          <div className={`notice ${notice.type}`}>
            <span>{notice.text}</span>
            <button
              className="btn btn-ghost"
              style={{ padding: "2px 10px", fontSize: 12 }}
              onClick={() => setNotice(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="content">
          {tab === "map" && (
            <div className="map-wrap">
              <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
            </div>
          )}

          {tab === "table" && (
            loading ? (
              <div className="spinner-wrap">
                <div className="spinner" />
              </div>
            ) : quakes.length === 0 ? (
              <div className="empty">
                No data yet. Click <strong>Fetch from USGS</strong> to get started.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Magnitude</th>
                    <th>Type</th>
                    <th>Place</th>
                    <th>Time</th>
                    <th>Coordinates</th>
                    <th>Depth (km)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {quakes.map((q) => (
                    <tr key={q.id}>
                      <td>
                        <span className="mag-badge" style={{ color: magColor(q.magnitude) }}>
                          {q.magnitude?.toFixed(1)}
                        </span>
                      </td>
                      <td>
                        <span className="type-tag">{q.magType ?? "—"}</span>
                      </td>
                      <td className="place">{q.place ?? "Unknown"}</td>
                      <td>{q.time ? new Date(q.time).toLocaleString() : "—"}</td>
                      <td className="mono">
                        {q.latitude?.toFixed(3)}, {q.longitude?.toFixed(3)}
                      </td>
                      <td>{q.depth?.toFixed(1)}</td>
                      <td>
                        <button className="btn btn-danger" onClick={() => remove(q.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </>
  );
}