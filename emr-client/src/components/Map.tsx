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
  
  // Simulated coordinates for providers since we don't have real GPS yet
  const defaultCenter: [number, number] = [40.7128, -74.0060]; // NYC

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
        
        {providers.map((p: any, i: number) => {
          // Precise land-locked NYC coordinates (Manhattan & Brooklyn)
          const landBases: [number, number][] = [
            [40.7306, -73.9975], // Greenwich Village
            [40.7580, -73.9855], // Midtown
            [40.7829, -73.9654], // Central Park West
            [40.7075, -74.0113], // Financial District
            [40.6930, -73.9850], // Downtown Brooklyn
            [40.7180, -73.9900], // Lower East Side
            [40.8075, -73.9626], // Morningside Heights
            [40.7484, -73.9857], // Empire State
            [40.6782, -73.9442], // Bed-Stuy
            [40.7282, -73.7949], // Queens land
          ];
          
          const coords = landBases[i % landBases.length];
          const lat = coords[0] + (i * 0.0001); // Negligible offset
          const lng = coords[1] + (i * 0.0001);
          
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
          const idx = providers.findIndex(prov => prov.id === selectedProviderId);
          if (idx !== -1) {
             const landBases: [number, number][] = [
                [40.7306, -73.9975], [40.7580, -73.9855], [40.7829, -73.9654],
                [40.7075, -74.0113], [40.6930, -73.9850], [40.7180, -73.9900],
                [40.8075, -73.9626], [40.7484, -73.9857], [40.6782, -73.9442],
                [40.7282, -73.7949],
              ];
            const coords = landBases[idx % landBases.length];
            return <ChangeView center={[coords[0] + (idx * 0.0001), coords[1] + (idx * 0.0001)]} />;
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
