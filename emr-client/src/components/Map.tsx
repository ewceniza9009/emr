"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { useTheme } from "@/lib/ThemeContext";

// Custom icons using L.divIcon for a premium look
const createNavigatorIcon = (isSelected: boolean) => L.divIcon({
  className: "custom-marker-nav",
  html: `
    <div class="relative flex items-center justify-center w-9 h-9 rounded-full bg-blue-500 text-white border-2 border-white shadow-lg cursor-pointer transition-all duration-300 ${isSelected ? 'scale-125 ring-4 ring-blue-500/30' : 'hover:scale-110'}">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <div class="absolute -bottom-1 w-2.5 h-2.5 bg-blue-500 rotate-45 border-r border-b border-white"></div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

const createFacilityIcon = (isSelected: boolean) => L.divIcon({
  className: "custom-marker-fac",
  html: `
    <div class="relative flex items-center justify-center w-9 h-9 rounded-full bg-amber-500 text-white border-2 border-white shadow-lg cursor-pointer transition-all duration-300 ${isSelected ? 'scale-125 ring-4 ring-amber-500/30' : 'hover:scale-110'}">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
      <div class="absolute -bottom-1 w-2.5 h-2.5 bg-amber-500 rotate-45 border-r border-b border-white"></div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

interface MapProps {
  providers: any[];
  facilities: any[];
  selectedProviderId: string | null;
  selectedFacilityId: string | null;
  onProviderSelect: (id: string | null) => void;
  onFacilitySelect: (id: string | null) => void;
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
  onFacilitySelect
}: MapProps) {
  const { theme } = useTheme();
  
  // Default to Cebu City center
  const defaultCenter: [number, number] = [10.3157, 123.8854]; 

  const tileLayerUrl = theme === 'dark' 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  return (
    <div className="h-full w-full rounded-[2.5rem] overflow-hidden border border-[var(--card-border)] shadow-2xl relative">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        scrollWheelZoom={true}
        className="h-full w-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileLayerUrl}
        />
        
        {/* Render Providers (Care Navigators) */}
        {providers.map((p: any) => {
          const lat = p.lat || (defaultCenter[0] + (Math.random() - 0.5) * 0.02);
          const lng = p.lng || (defaultCenter[1] + (Math.random() - 0.5) * 0.02);
          const isSelected = selectedProviderId === p.id;
          
          return (
            <Marker 
              key={p.id} 
              position={[lat, lng]}
              icon={createNavigatorIcon(isSelected)}
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
        {facilities.map((f: any) => {
          const lat = f.lat || (defaultCenter[0] + (Math.random() - 0.5) * 0.02);
          const lng = f.lng || (defaultCenter[1] + (Math.random() - 0.5) * 0.02);
          const isSelected = selectedFacilityId === f.id;

          return (
            <Marker 
              key={f.id} 
              position={[lat, lng]}
              icon={createFacilityIcon(isSelected)}
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

        {/* Sync view if a provider is selected */}
        {selectedProviderId && (() => {
          const selected = providers.find(prov => prov.id === selectedProviderId);
          if (selected && selected.lat && selected.lng) {
            return <ChangeView center={[selected.lat, selected.lng]} />;
          }
          return null;
        })()}

        {/* Sync view if a facility is selected */}
        {selectedFacilityId && (() => {
          const selected = facilities.find(fac => fac.id === selectedFacilityId);
          if (selected && selected.lat && selected.lng) {
            return <ChangeView center={[selected.lat, selected.lng]} />;
          }
          return null;
        })()}
      </MapContainer>
      
      {/* Map Overlay Decorators */}
      <div className="absolute top-6 left-6 z-[1000] pointer-events-none">
         <div className="bg-[var(--card-bg)]/80 backdrop-blur-md border border-[var(--card-border)] rounded-2xl p-4 shadow-2xl">
            <h2 className="text-xs font-black uppercase tracking-tight">Active Operations</h2>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Satellite Navigation Active</p>
         </div>
      </div>
    </div>
  );
}
