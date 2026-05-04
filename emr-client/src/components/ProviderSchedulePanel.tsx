"use client";

import { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import {
  MapPin,
  Clock,
  Car,
  User,
  CheckCircle,
  Stethoscope,
  Navigation,
} from "lucide-react";

const GET_AVAILABLE_PROVIDERS = gql`
  query GetAvailableProviders(
    $patientId: UUID!
    $targetStart: DateTime!
    $durationMinutes: Int!
    $modality: AppointmentModality!
  ) {
    availableProviders(
      patientId: $patientId
      targetStart: $targetStart
      durationMinutes: $durationMinutes
      modality: $modality
    ) {
      practitionerId
      fullName
      role
      distanceInMiles
      travelTimeInMinutes
      shiftStart
      shiftEnd
    }
  }
`;

interface AvailableProvider {
  practitionerId: string;
  fullName: string;
  role: string;
  distanceInMiles: number;
  travelTimeInMinutes: number;
  shiftStart: string;
  shiftEnd: string;
}

interface Props {
  patientId: string;
  targetStart: string; // ISO
  durationMinutes: number;
  modality: "IN_PERSON_HOME" | "IN_PERSON_FACILITY" | "VIRTUAL";
  onSelect?: (provider: AvailableProvider) => void;
}

export default function ProviderSchedulePanel({
  patientId,
  targetStart,
  durationMinutes,
  modality,
  onSelect,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const { data, loading, error } = useQuery(GET_AVAILABLE_PROVIDERS, {
    variables: { patientId, targetStart, durationMinutes, modality },
    skip: !patientId || !targetStart,
  });

  const providers: AvailableProvider[] = data?.availableProviders ?? [];

  const handleSelect = (provider: AvailableProvider) => {
    setSelected(provider.practitionerId);
    onSelect?.(provider);
  };

  const getTravelColor = (minutes: number) => {
    if (minutes <= 15) return "text-emerald-400";
    if (minutes <= 30) return "text-amber-400";
    return "text-red-400";
  };

  const getTravelBadgeBg = (minutes: number) => {
    if (minutes <= 15) return "bg-emerald-500/10 border-emerald-500/20";
    if (minutes <= 30) return "bg-amber-500/10 border-amber-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-widest">
          <Navigation className="w-4 h-4 text-blue-400" />
          Available Providers
        </h3>
        {!loading && (
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            {providers.length} FOUND · SORTED BY PROXIMITY
          </span>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-morphism rounded-2xl p-4 animate-pulse flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/5 rounded w-1/3" />
                <div className="h-2 bg-white/5 rounded w-1/4" />
              </div>
              <div className="h-8 w-20 bg-white/5 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="glass-morphism rounded-2xl p-4 border border-red-500/20 text-red-400 text-sm">
          Failed to fetch provider availability. Please retry.
        </div>
      )}

      {!loading && !error && providers.length === 0 && (
        <div className="glass-morphism rounded-2xl p-6 text-center">
          <MapPin className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
          <p className="text-[var(--text-muted)] text-sm">No providers available for this time slot.</p>
          <p className="text-[var(--text-muted)] text-xs mt-1 opacity-70">Try a different date or duration.</p>
        </div>
      )}

      <div className="space-y-3">
        {providers.map((provider) => {
          const isSelected = selected === provider.practitionerId;
          const isInPerson = modality !== "VIRTUAL";

          return (
            <button
              key={provider.practitionerId}
              onClick={() => handleSelect(provider)}
              className={`w-full text-left glass-morphism rounded-2xl p-4 border transition-all duration-200 group
                ${isSelected
                  ? "border-blue-500/50 bg-blue-500/5"
                  : "border-white/5 hover:border-white/10 hover:bg-white/2"
                }`}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                    ${isSelected ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-[var(--text-muted)]"}`}
                >
                  {provider.role === "Physician" ? (
                    <Stethoscope className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>

                {/* Name & Role */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{provider.fullName}</p>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-muted)]">
                      {provider.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Shift:{" "}
                    {new Date(provider.shiftStart).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    –{" "}
                    {new Date(provider.shiftEnd).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Distance & Travel — only shown for in-person */}
                {isInPerson && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold
                        ${getTravelBadgeBg(provider.travelTimeInMinutes)}`}
                    >
                      <Car className={`w-3.5 h-3.5 ${getTravelColor(provider.travelTimeInMinutes)}`} />
                      <span className={getTravelColor(provider.travelTimeInMinutes)}>
                        {provider.travelTimeInMinutes} min
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                      <MapPin className="w-3 h-3" />
                      {provider.distanceInMiles.toFixed(1)} mi
                    </div>
                  </div>
                )}

                {/* Checkmark */}
                {isSelected && (
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selected && providers.length > 0 && (
        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          Travel time is calculated from the clinician's last known location using real-time geospatial data.
        </div>
      )}
    </div>
  );
}
