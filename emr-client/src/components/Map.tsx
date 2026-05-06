"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { useTheme } from "@/lib/ThemeContext";

// Fix for default Leaflet icons in Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  providers: any[];
  selectedProviderId: string | null;
  onProviderSelect: (id: string) => void;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function Map({ providers, selectedProviderId, onProviderSelect }: MapProps) {
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
        
        {providers.map((p: any) => {
          // Use real coordinates if available, fallback to default center with tiny random offset for visibility
          const lat = p.lat || (defaultCenter[0] + (Math.random() - 0.5) * 0.02);
          const lng = p.lng || (defaultCenter[1] + (Math.random() - 0.5) * 0.02);
          
          return (
            <Marker 
              key={p.id} 
              position={[lat, lng]}
              eventHandlers={{
                click: () => onProviderSelect(p.id),
              }}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-sm uppercase">{p.name}</p>
                  <p className="text-[10px] font-bold text-[var(--primary)] uppercase mb-1">{p.street || "Location Unknown"}</p>
                  <p className="text-xs text-slate-500">{p.role}</p>
                  <p className={`text-[10px] font-bold mt-1 ${p.status === 'On Site' ? 'text-emerald-500' : 'text-blue-500'}`}>
                    {p.status}
                  </p>
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
