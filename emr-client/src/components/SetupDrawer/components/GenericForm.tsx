import React from "react";
import { SetupEntityType } from "../types";

interface GenericFormProps {
  type: SetupEntityType;
  form: any;
  onChange: (f: any) => void;
}

export default function GenericForm({ type, form, onChange }: GenericFormProps) {
  if (type === "healthPlans") {
    return (
      <div className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
            Plan Name
          </label>
          <input
            required
            placeholder="Enter official health plan name..."
            className="premium-input w-full rounded-xl p-4 text-sm font-bold shadow-sm"
            value={form.name || ""}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
            Plan Code
          </label>
          <input
            required
            placeholder="Unique alphanumeric identifier..."
            className="premium-input w-full rounded-xl p-4 text-sm font-mono shadow-sm"
            value={form.code || ""}
            onChange={(e) => onChange({ ...form, code: e.target.value })}
          />
        </div>
      </div>
    );
  }

  if (type === "medications") {
    return (
      <div className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
            Medication Name
          </label>
          <input
            required
            placeholder="Generic or Brand name..."
            className="premium-input w-full rounded-xl p-4 text-sm font-bold"
            value={form.name || ""}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
            Strength
          </label>
          <input
            required
            placeholder="e.g. 500mg, 10ml..."
            className="premium-input w-full rounded-xl p-4 text-sm font-mono"
            value={form.strength || ""}
            onChange={(e) => onChange({ ...form, strength: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            Default Route
          </label>
          <select
            className="premium-input w-full rounded-xl p-3 text-sm appearance-none cursor-pointer"
            value={form.defaultRoute || "ORAL"}
            onChange={(e) => onChange({ ...form, defaultRoute: e.target.value })}
          >
            <option value="ORAL" className="bg-[var(--sidebar-bg)]">
              Oral
            </option>
            <option value="SUBLINGUAL" className="bg-[var(--sidebar-bg)]">
              Sublingual
            </option>
            <option value="TRANSDERMAL" className="bg-[var(--sidebar-bg)]">
              Transdermal
            </option>
            <option value="SUBCUTANEOUS" className="bg-[var(--sidebar-bg)]">
              Subcutaneous
            </option>
            <option value="INTRAVENOUS" className="bg-[var(--sidebar-bg)]">
              Intravenous
            </option>
          </select>
        </div>
      </div>
    );
  }

  if (type === "smartPhrases") {
    return (
      <div className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
            Trigger Shortcut (e.g. /soap)
          </label>
          <input
            required
            placeholder="/trigger..."
            className="premium-input w-full rounded-xl p-4 text-sm font-mono text-[var(--primary)]"
            value={form.shortcut || "/"}
            onChange={(e) => onChange({ ...form, shortcut: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
            Label
          </label>
          <input
            placeholder="Short descriptive label..."
            className="premium-input w-full rounded-xl p-4 text-sm font-bold"
            value={form.label || ""}
            onChange={(e) => onChange({ ...form, label: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
            Template Text
          </label>
          <textarea
            required
            placeholder="Write clinical template here..."
            rows={4}
            className="premium-input w-full rounded-xl p-4 text-sm leading-relaxed"
            value={form.templateText || ""}
            onChange={(e) =>
              onChange({ ...form, templateText: e.target.value })
            }
          />
        </div>
      </div>
    );
  }

  if (type === "questionnaires") {
    return (
      <div className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            Form Name
          </label>
          <input
            required
            className="premium-input w-full rounded-xl p-3 text-sm font-bold"
            value={form.name || ""}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            Assessment Type
          </label>
          <select
            className="premium-input w-full rounded-xl p-3 text-sm appearance-none cursor-pointer"
            value={form.assessmentType || "ESAS"}
            onChange={(e) =>
              onChange({ ...form, assessmentType: e.target.value })
            }
          >
            <option value="ESAS" className="bg-[var(--sidebar-bg)]">
              ESAS
            </option>
            <option value="BPI" className="bg-[var(--sidebar-bg)]">
              BPI
            </option>
            <option value="MSAS" className="bg-[var(--sidebar-bg)]">
              MSAS
            </option>
            <option value="PPS" className="bg-[var(--sidebar-bg)]">
              PPS
            </option>
            <option value="KPS" className="bg-[var(--sidebar-bg)]">
              KPS
            </option>
            <option value="ECOG" className="bg-[var(--sidebar-bg)]">
              ECOG
            </option>
            <option value="PHQ9" className="bg-[var(--sidebar-bg)]">
              PHQ-9
            </option>
            <option value="HADS" className="bg-[var(--sidebar-bg)]">
              HADS
            </option>
          </select>
        </div>
      </div>
    );
  }

  if (type === "equipment") {
    return (
      <div className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            Model Name
          </label>
          <input
            required
            className="premium-input w-full rounded-xl p-3 text-sm font-bold"
            value={form.modelName || ""}
            onChange={(e) => onChange({ ...form, modelName: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            Serial Number
          </label>
          <input
            required
            className="premium-input w-full rounded-xl p-3 text-sm font-mono"
            value={form.serialNumber || ""}
            onChange={(e) => onChange({ ...form, serialNumber: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            Equipment Type
          </label>
          <select
            className="premium-input w-full rounded-xl p-3 text-sm appearance-none cursor-pointer"
            value={form.type || "OXYGEN_CONCENTRATOR"}
            onChange={(e) => onChange({ ...form, type: e.target.value })}
          >
            <option value="OXYGEN_CONCENTRATOR" className="bg-[var(--sidebar-bg)]">
              Oxygen Concentrator
            </option>
            <option value="OXYGEN_TANK" className="bg-[var(--sidebar-bg)]">
              Oxygen Tank
            </option>
            <option value="HOSPITAL_BED" className="bg-[var(--sidebar-bg)]">
              Hospital Bed
            </option>
            <option value="WHEELCHAIR" className="bg-[var(--sidebar-bg)]">
              Wheelchair
            </option>
            <option value="INFUSION_PUMP" className="bg-[var(--sidebar-bg)]">
              Infusion Pump
            </option>
            <option value="SUCTION_MACHINE" className="bg-[var(--sidebar-bg)]">
              Suction Machine
            </option>
            <option value="NEBULIZER" className="bg-[var(--sidebar-bg)]">
              Nebulizer
            </option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            Equipment Status
          </label>
          <select
            className="premium-input w-full rounded-xl p-3 text-sm appearance-none cursor-pointer"
            value={form.status || "AVAILABLE"}
            onChange={(e) => onChange({ ...form, status: e.target.value })}
          >
            <option value="AVAILABLE" className="bg-[var(--sidebar-bg)]">
              Available
            </option>
            <option value="IN_USE" className="bg-[var(--sidebar-bg)]">
              In Use
            </option>
            <option value="UNDER_MAINTENANCE" className="bg-[var(--sidebar-bg)]">
              Under Maintenance
            </option>
            <option value="RETIRED" className="bg-[var(--sidebar-bg)]">
              Retired
            </option>
            <option value="LOST" className="bg-[var(--sidebar-bg)]">
              Lost
            </option>
          </select>
        </div>
      </div>
    );
  }

  if (type === "outreachScripts") {
    return (
      <div className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
            Script Title
          </label>
          <input
            required
            placeholder="Enter descriptive script title..."
            className="premium-input w-full rounded-xl p-4 text-sm font-bold"
            value={form.scriptTitle || ""}
            onChange={(e) => onChange({ ...form, scriptTitle: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
            Target Location (City/Region)
          </label>
          <input
            required
            placeholder="Region VII, Mandaue, etc..."
            className="premium-input w-full rounded-xl p-4 text-sm"
            value={form.locationName || ""}
            onChange={(e) => onChange({ ...form, locationName: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
            Script Content
          </label>
          <textarea
            required
            placeholder="Draft clinical outreach script content..."
            rows={6}
            className="premium-input w-full rounded-xl p-4 text-sm leading-relaxed"
            value={form.content || ""}
            onChange={(e) => onChange({ ...form, content: e.target.value })}
          />
        </div>
      </div>
    );
  }

  if (type === "integrationProfiles") {
    return (
      <div className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            Integration Partner
          </label>
          <select
            className="premium-input w-full rounded-xl p-3 text-sm appearance-none cursor-pointer"
            value={form.partner || "ELATION_HEALTH"}
            onChange={(e) => onChange({ ...form, partner: e.target.value })}
          >
            <option value="ELATION_HEALTH" className="bg-[var(--sidebar-bg)]">
              Elation Health
            </option>
            <option value="CARE_SOURCE" className="bg-[var(--sidebar-bg)]">
              CareSource
            </option>
            <option value="SURESCRIPTS" className="bg-[var(--sidebar-bg)]">
              Surescripts
            </option>
            <option value="HEALTH_GORILLA" className="bg-[var(--sidebar-bg)]">
              Health Gorilla
            </option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            API Key
          </label>
          <input
            required
            type="password"
            className="premium-input w-full rounded-xl p-3 text-sm"
            value={form.apiKey || ""}
            onChange={(e) => onChange({ ...form, apiKey: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            Base URL (Optional)
          </label>
          <input
            className="premium-input w-full rounded-xl p-3 text-sm"
            value={form.baseUrl || ""}
            onChange={(e) => onChange({ ...form, baseUrl: e.target.value })}
          />
        </div>
      </div>
    );
  }

  return null;
}
