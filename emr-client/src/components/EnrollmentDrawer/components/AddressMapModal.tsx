"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MapContainer, TileLayer, Marker, useMapEvents, useMap, ZoomControl, Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, MapPin, Search, Crosshair, Loader2, Navigation, GripVertical } from "lucide-react";
import HalcyonPortal from "../../Portal";
import { useTheme } from "@/lib/ThemeContext";

export interface AddressData {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  region: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

interface AddressMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: AddressData;
  onSave: (address: AddressData) => void;
}

const defaultCenter: [number, number] = [10.3157, 123.8854];

const createPinIcon = (isDragging: boolean) => L.divIcon({
  className: "",
  html: `
    <div class="relative flex flex-col items-center" style="transition: transform 0.2s ease; transform: ${isDragging ? 'translateY(-8px) scale(1.1)' : 'translateY(0)'}">
      <div class="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[18px] border-l-transparent border-r-transparent border-b-teal-500 drop-shadow-lg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"></div>
      <div class="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center border-[3px] border-white shadow-lg -mt-[6px]">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
      <div class="absolute -bottom-1 w-6 h-1.5 bg-black/20 rounded-full blur-sm ${isDragging ? 'animate-pulse scale-150' : ''}"></div>
    </div>
  `,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -40],
});

function DraggableMarker({
  position,
  onMove,
  isDragging,
  setDragging,
}: {
  position: L.LatLng;
  onMove: (latlng: L.LatLng) => void;
  isDragging: boolean;
  setDragging: (v: boolean) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  useMapEvents({
    dblclick(e) {
      onMove(e.latlng);
    },
  });

  return (
    <Marker
      ref={markerRef}
      position={position}
      draggable={true}
      icon={createPinIcon(isDragging)}
      eventHandlers={{
        dragstart: () => setDragging(true),
        dragend: () => {
          setDragging(false);
          const marker = markerRef.current;
          if (marker) onMove(marker.getLatLng());
        },
      }}
    />
  );
}

function CrosshairOverlay({ active }: { active: boolean }) {
  const map = useMap();
  const [center, setCenter] = useState(map.getCenter());

  useEffect(() => {
    const handler = () => setCenter(map.getCenter());
    map.on("move", handler);
    return () => {
      map.off("move", handler);
    };
  }, [map]);

  if (!active) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 1000,
        pointerEvents: "none",
        transition: "opacity 0.3s ease",
      }}
    >
      <div className="relative w-12 h-12">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-white/30 animate-ping" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-white/60 rounded-full" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-white/60 rounded-full" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-white/60 rounded-full" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-white/60 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
      </div>
    </div>
  );
}

function MapBoundsUpdater({ center }: { center: L.LatLng }) {
  const map = useMap();
  const fly = useRef(true);
  useEffect(() => {
    if (fly.current) {
      fly.current = false;
      map.setView(center, 16, { animate: true, duration: 0.6 });
    } else {
      map.flyTo(center, 16, { animate: true, duration: 0.6 });
    }
  }, [center, map]);
  return null;
}

export default function AddressMapModal({ isOpen, onClose, address, onSave }: AddressMapModalProps) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isReversing, setIsReversing] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const hasExistingCoords = address.latitude != null && address.longitude != null;

  const [markerPos, setMarkerPos] = useState<L.LatLng>(
    hasExistingCoords
      ? L.latLng(address.latitude!, address.longitude!)
      : L.latLng(defaultCenter[0], defaultCenter[1]),
  );

  const [form, setForm] = useState<AddressData>({ ...address });

  useEffect(() => {
    if (isOpen) {
      setForm({ ...address });
      if (address.latitude != null && address.longitude != null) {
        setMarkerPos(L.latLng(address.latitude, address.longitude));
      }
    }
  }, [isOpen, address]);

  const reverseGeocode = useCallback(async (latlng: L.LatLng) => {
    setIsReversing(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&addressdetails=1`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await res.json();
      if (data && data.address) {
        const a = data.address;
        setForm((prev) => ({
          ...prev,
          street: a.road || a.pedestrian || a.street || a.house_number || prev.street,
          city: a.city || a.town || a.village || a.municipality || a.county || prev.city,
          state: a.state || prev.state,
          postalCode: a.postcode || prev.postalCode,
          region: a.region || a.state_district || prev.region,
          country: a.country || prev.country,
          latitude: latlng.lat,
          longitude: latlng.lng,
        }));
      }
    } catch (e) {
      console.error("Reverse geocode error:", e);
    } finally {
      setIsReversing(false);
    }
  }, []);

  const handleMarkerMove = useCallback(
    (latlng: L.LatLng) => {
      setMarkerPos(latlng);
      setForm((prev) => ({ ...prev, latitude: latlng.lat, longitude: latlng.lng }));
      reverseGeocode(latlng);
    },
    [reverseGeocode],
  );

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await res.json();
      setSearchResults(data || []);
      setShowResults(true);
    } catch (e) {
      console.error("Search error:", e);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchInputChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => handleSearch(val), 500);
  };

  const selectSearchResult = (item: any) => {
    const latlng = L.latLng(parseFloat(item.lat), parseFloat(item.lon));
    setMarkerPos(latlng);
    setShowResults(false);
    setSearchQuery(item.display_name);

    const a = item.address || {};
    setForm((prev) => ({
      ...prev,
      street: a.road || a.pedestrian || a.street || a.house_number || prev.street,
      city: a.city || a.town || a.village || a.municipality || a.county || prev.city,
      state: a.state || prev.state,
      postalCode: a.postcode || prev.postalCode,
      region: a.region || a.state_district || prev.region,
      country: a.country || prev.country,
      latitude: latlng.lat,
      longitude: latlng.lng,
    }));
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
        setMarkerPos(latlng);
        setForm((prev) => ({ ...prev, latitude: latlng.lat, longitude: latlng.lng }));
        reverseGeocode(latlng);
      },
      (err) => console.error("Geolocation error:", err),
    );
  };

  const handleSave = () => {
    onSave(form);
  };

  const handleFieldChange = (field: keyof AddressData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <HalcyonPortal>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 99999999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          margin: 0,
        }}
      >
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            margin: 0,
            zIndex: 0,
          }}
          onClick={onClose}
        />
        <div className="relative w-full max-w-5xl bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between p-5 pb-3 border-b border-[var(--card-border)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-teal-500/15 flex items-center justify-center text-teal-400 border border-teal-500/20">
                <MapPin className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">
                  Pin Location on Map
                </h3>
                <p className="text-[8px] font-bold text-teal-400 uppercase tracking-widest opacity-70">
                  Drag the pin or search for a location
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-[55%] relative bg-black/20">
              <div className="absolute top-3 left-3 right-14 z-[1000]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    placeholder="Search address or place..."
                    className="w-full bg-[var(--card-bg)]/90 backdrop-blur-md border border-[var(--card-border)] rounded-xl pl-9 pr-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-teal-500/50 shadow-lg transition-all placeholder:text-[var(--text-muted)]/40"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-teal-400 animate-spin" />
                  )}
                </div>
                {showResults && searchResults.length > 0 && (
                  <div className="mt-1.5 bg-[var(--card-bg)]/95 backdrop-blur-md border border-[var(--card-border)] rounded-xl overflow-hidden shadow-xl max-h-52 overflow-y-auto">
                    {searchResults.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectSearchResult(item)}
                        className="w-full text-left px-4 py-2.5 text-[9px] font-bold text-[var(--text-primary)] hover:bg-teal-500/10 border-b border-[var(--card-border)] last:border-b-0 transition-colors leading-relaxed"
                      >
                        {item.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleLocateMe}
                className="absolute top-3 right-3 z-[1000] w-9 h-9 bg-[var(--card-bg)]/90 backdrop-blur-md border border-[var(--card-border)] rounded-xl flex items-center justify-center text-teal-400 hover:bg-teal-500/15 hover:text-teal-300 transition-all shadow-lg"
                title="Use current location"
              >
                <Crosshair className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
                <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                  <GripVertical className="w-3 h-3 text-white/50" />
                  <span className="text-[8px] font-bold text-white/60 uppercase tracking-widest">
                    Drag pin &middot; Double-click to snap
                  </span>
                </div>
              </div>

              <MapContainer
                center={[markerPos.lat, markerPos.lng]}
                zoom={16}
                scrollWheelZoom={true}
                zoomControl={false}
                className="h-full w-full"
                key={`${markerPos.lat}-${markerPos.lng}`}
              >
                <ZoomControl position="topright" />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url={theme === 'dark'
                    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  }
                />
                <MapBoundsUpdater center={markerPos} />
                <Circle
                  center={markerPos}
                  radius={20}
                  pathOptions={{
                    color: "#14b8a6",
                    fillColor: "#14b8a6",
                    fillOpacity: isDragging ? 0.25 : 0.12,
                    weight: isDragging ? 2 : 1,
                    opacity: isDragging ? 0.6 : 0.3,
                  }}
                />
                <CrosshairOverlay active={isDragging} />
                <DraggableMarker
                  position={markerPos}
                  onMove={handleMarkerMove}
                  isDragging={isDragging}
                  setDragging={setIsDragging}
                />
              </MapContainer>
            </div>

            <div className="w-[45%] p-5 overflow-y-auto space-y-3.5">
              <div className="bg-[var(--card-bg)] rounded-xl p-3 border border-[var(--card-border)] space-y-2">
                <div className="flex items-center gap-1.5 text-[8px] font-bold text-teal-400 uppercase tracking-widest">
                  <Navigation className="w-3 h-3" />
                  Coordinates
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                      Lat
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.latitude ?? ""}
                      onChange={(e) => handleFieldChange("latitude", e.target.value)}
                      className="w-full bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-lg px-3 py-1.5 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-teal-500/50 transition-all"
                      placeholder="10.3157"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                      Lng
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.longitude ?? ""}
                      onChange={(e) => handleFieldChange("longitude", e.target.value)}
                      className="w-full bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-lg px-3 py-1.5 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-teal-500/50 transition-all"
                      placeholder="123.8854"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={form.street}
                    onChange={(e) => handleFieldChange("street", e.target.value)}
                    className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3.5 py-2 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-teal-500/50 transition-all"
                    placeholder="Street..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => handleFieldChange("city", e.target.value)}
                      className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3.5 py-2 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-teal-500/50 transition-all"
                      placeholder="City..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                      State / Province
                    </label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => handleFieldChange("state", e.target.value)}
                      className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3.5 py-2 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-teal-500/50 transition-all"
                      placeholder="State..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                      Region
                    </label>
                    <input
                      type="text"
                      value={form.region}
                      onChange={(e) => handleFieldChange("region", e.target.value)}
                      className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3.5 py-2 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-teal-500/50 transition-all"
                      placeholder="Region..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={form.postalCode}
                      onChange={(e) => handleFieldChange("postalCode", e.target.value)}
                      className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3.5 py-2 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-teal-500/50 transition-all"
                      placeholder="Postal Code..."
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => handleFieldChange("country", e.target.value)}
                    className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3.5 py-2 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-teal-500/50 transition-all"
                    placeholder="Country..."
                  />
                </div>
              </div>

              {isReversing && (
                <div className="flex items-center gap-2 text-[8px] font-bold text-teal-400 uppercase tracking-widest animate-pulse">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  Resolving address from coordinates...
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-3.5 border-t border-[var(--card-border)] bg-[var(--input-bg)]/50">
            <button
              onClick={onClose}
              className="px-5 h-9 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] text-[8px] font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 h-9 rounded-xl bg-teal-500 text-black text-[8px] font-black uppercase tracking-[0.2em] hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all active:scale-95 flex items-center gap-2"
            >
              <MapPin className="w-3 h-3" />
              Save Location
            </button>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}
