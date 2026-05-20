"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { useTheme } from "@/lib/ThemeContext";

// Custom icons using L.divIcon for a premium look
const createNavigatorIcon = (isSelected: boolean, isActivityMode: boolean) => L.divIcon({
  className: "custom-marker-nav",
  html: `
    <div class="relative flex items-center justify-center w-9 h-9 rounded-full bg-blue-500 text-white border-2 border-white shadow-lg cursor-pointer transition-all duration-300 ${isSelected ? 'scale-125 ring-4 ring-blue-500/30' : 'hover:scale-110'}">
      ${isActivityMode ? '<div class="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75"></div>' : ''}
      <div class="relative z-10 flex items-center justify-center w-full h-full">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <div class="absolute -bottom-1 w-2.5 h-2.5 bg-blue-500 rotate-45 border-r border-b border-white z-0"></div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

const createFacilityIcon = (isSelected: boolean, isActivityMode: boolean) => L.divIcon({
  className: "custom-marker-fac",
  html: `
    <div class="relative flex items-center justify-center w-9 h-9 rounded-full bg-amber-500 text-white border-2 border-white shadow-lg cursor-pointer transition-all duration-300 ${isSelected ? 'scale-125 ring-4 ring-amber-500/30' : 'hover:scale-110'}">
      ${isActivityMode ? '<div class="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-75"></div>' : ''}
      <div class="relative z-10 flex items-center justify-center w-full h-full">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
      </div>
      <div class="absolute -bottom-1 w-2.5 h-2.5 bg-amber-500 rotate-45 border-r border-b border-white z-0"></div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

// Helper for deterministic coordinates based on provider/facility IDs
const getDeterministicRandomOffset = (id: string): [number, number] => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = ((hash & 0xFF) / 255 - 0.5) * 0.02;
  const lngOffset = (((hash >> 8) & 0xFF) / 255 - 0.5) * 0.02;
  return [latOffset, lngOffset];
};

interface MapProps {
  providers: any[];
  facilities: any[];
  selectedProviderId: string | null;
  selectedFacilityId: string | null;
  onProviderSelect: (id: string | null) => void;
  onFacilitySelect: (id: string | null) => void;
  activeHud?: string;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function Map({ 
  providers, 
  facilities,
  selectedProviderId, 
  selectedFacilityId,
  onProviderSelect,
  onFacilitySelect,
  activeHud
}: MapProps) {
  const { theme } = useTheme();
  
  // Default to Cebu City center
  const defaultCenter: [number, number] = [10.3157, 123.8854]; 

  // Resolve stable coordinates for all providers to prevent shuffling on re-render
  const providersWithCoords = providers.map(p => {
    const [offsetLat, offsetLng] = getDeterministicRandomOffset(p.id);
    return {
      ...p,
      lat: p.lat || (defaultCenter[0] + offsetLat),
      lng: p.lng || (defaultCenter[1] + offsetLng)
    };
  });

  // Resolve stable coordinates for all facilities to prevent shuffling on re-render
  const facilitiesWithCoords = facilities.map(f => {
    const [offsetLat, offsetLng] = getDeterministicRandomOffset(f.id);
    return {
      ...f,
      lat: f.lat || (defaultCenter[0] + offsetLat),
      lng: f.lng || (defaultCenter[1] + offsetLng)
    };
  });

  let tileLayerUrl = theme === 'dark' 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  // Tactical layer override
  if (activeHud === "layers") {
    tileLayerUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  }

  const isActivityMode = activeHud === "activity";

  return (
    <div className="h-full w-full rounded-[2.5rem] overflow-hidden border border-[var(--card-border)] shadow-2xl relative">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        scrollWheelZoom={true}
        zoomControl={false}
        className="h-full w-full z-10"
      >
        <ZoomControl position="topright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileLayerUrl}
        />
        
        {/* Render Providers (Care Navigators) */}
        {providersWithCoords.map((p: any) => {
          const lat = p.lat;
          const lng = p.lng;
          const isSelected = selectedProviderId === p.id;
          
          return (
            <Marker 
              key={p.id} 
              position={[lat, lng]}
              icon={createNavigatorIcon(isSelected, isActivityMode)}
              eventHandlers={{
                click: () => {
                  onProviderSelect(p.id);
                  onFacilitySelect(null);
                },
              }}
            >
              <Popup>
                <div className="p-2 min-w-[180px] font-sans">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="font-bold text-xs uppercase text-slate-800 dark:text-slate-100">{p.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">{p.role}</div>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold mb-1">
                    📍 {p.street || "Location Unknown"}
                  </p>
                  <div className="flex items-center justify-between text-[9px] font-black mt-2">
                    <span className={`px-2 py-0.5 rounded-full ${p.status === 'On Site' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {p.status}
                    </span>
                    <span className="text-slate-400">🔋 {p.battery}%</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Render Facilities */}
        {facilitiesWithCoords.map((f: any) => {
          const lat = f.lat;
          const lng = f.lng;
          const isSelected = selectedFacilityId === f.id;

          return (
            <Marker 
              key={f.id} 
              position={[lat, lng]}
              icon={createFacilityIcon(isSelected, isActivityMode)}
              eventHandlers={{
                click: () => {
                  onFacilitySelect(f.id);
                  onProviderSelect(null);
                },
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px] font-sans">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="font-bold text-xs uppercase text-slate-800 dark:text-slate-100">{f.name}</span>
                  </div>
                  <div className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-black uppercase tracking-wider w-fit mb-2">
                    🏢 {f.type}
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold mb-1.5">
                    📍 {f.street || "Address Unknown"}
                  </p>
                  <div className="flex flex-col gap-1 text-[9px] text-slate-500 font-medium">
                    <div>👤 Lead: <span className="font-bold text-slate-700 dark:text-slate-300">{f.contactPerson || "N/A"}</span></div>
                    <div>📞 Contact: <span className="font-bold text-slate-700 dark:text-slate-300">{f.contactPhone || "N/A"}</span></div>
                    <div>👥 Residents: <span className="font-bold text-slate-700 dark:text-slate-300">{f.residentsCount}</span></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Render Active Routing Polylines if Activity Mode is active */}
        {isActivityMode && providersWithCoords.map((p: any) => {
          const lat = p.lat;
          const lng = p.lng;

          if (facilitiesWithCoords.length > 0) {
            let closestFac = facilitiesWithCoords[0];
            let minDist = Infinity;
            facilitiesWithCoords.forEach((f: any) => {
              const d = Math.pow(f.lat - lat, 2) + Math.pow(f.lng - lng, 2);
              if (d < minDist) {
                minDist = d;
                closestFac = f;
              }
            });

            return (
              <Polyline 
                key={`route-${p.id}`}
                positions={[
                  [lat, lng],
                  [closestFac.lat, closestFac.lng]
                ]} 
                color="#3b82f6" 
                dashArray="8, 8" 
                weight={3} 
                opacity={0.8}
              >
                <Popup>
                  <div className="p-1.5 text-[10px] font-sans">
                    <div className="font-black text-blue-500 uppercase tracking-wider mb-1">Active Navigation Path</div>
                    <div className="text-slate-700 dark:text-slate-300">
                      Navigator <span className="font-bold">{p.name}</span> in transit to <span className="font-bold">{closestFac.name}</span>.
                    </div>
                  </div>
                </Popup>
              </Polyline>
            );
          }
          return null;
        })}

        {/* Sync view if a provider is selected */}
        {selectedProviderId && (() => {
          const selected = providersWithCoords.find(prov => prov.id === selectedProviderId);
          if (selected) {
            return <ChangeView center={[selected.lat, selected.lng]} />;
          }
          return null;
        })()}

        {/* Sync view if a facility is selected */}
        {selectedFacilityId && (() => {
          const selected = facilitiesWithCoords.find(fac => fac.id === selectedFacilityId);
          if (selected) {
            return <ChangeView center={[selected.lat, selected.lng]} />;
          }
          return null;
        })()}
      </MapContainer>
    </div>
  );
}
