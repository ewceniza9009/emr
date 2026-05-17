"use client";

import React from "react";
import { Building2, Clock, DollarSign, Languages, Activity } from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";
import SectionLabel from "./SectionLabel";
import SelectField from "./SelectField";
import { TenantConfig } from "../types";
import { timezones, currencies, languages } from "../constants";

interface OrganizationTabProps {
  stagedTenant: TenantConfig;
  setStagedTenant: (config: TenantConfig) => void;
}

export default function OrganizationTab({
  stagedTenant,
  setStagedTenant,
}: OrganizationTabProps) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <SectionLabel
        title="ORGANIZATION PROTOCOLS"
        subtitle="Global Clinical Parameters"
        icon={<Building2 className="w-3.5 h-3.5" />}
        color="teal"
      />

      <PermissionGate permission="setup:manage">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            label="SYSTEM TIME ZONE"
            value={stagedTenant.timezone}
            onChange={(v: string) =>
              setStagedTenant({ ...stagedTenant, timezone: v })
            }
            options={timezones}
            icon={<Clock className="w-3.5 h-3.5" />}
          />
          <SelectField
            label="BASE CURRENCY"
            value={stagedTenant.currency}
            onChange={(v: string) =>
              setStagedTenant({ ...stagedTenant, currency: v })
            }
            options={currencies}
            icon={<DollarSign className="w-3.5 h-3.5" />}
          />
          <SelectField
            label="DEFAULT LANGUAGE"
            value={stagedTenant.language}
            onChange={(v: string) =>
              setStagedTenant({ ...stagedTenant, language: v })
            }
            options={languages}
            icon={<Languages className="w-3.5 h-3.5" />}
          />
          <SelectField
            label="DATE DISPLAY PROTOCOL"
            value={stagedTenant.dateFormat}
            onChange={(v: string) =>
              setStagedTenant({ ...stagedTenant, dateFormat: v })
            }
            options={[
              { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
              { value: "DD/MM/YYYY", label: "DD/MM/YYYY (INTL)" },
              { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
            ]}
            icon={<Activity className="w-3.5 h-3.5" />}
          />
        </div>

        <div className="pt-6 space-y-6">
          <SectionLabel
            title="SCHEDULING BUCKETS"
            subtitle="Operational Slot Distribution"
            icon={<Clock className="w-3.5 h-3.5" />}
            color="amber"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SelectField
              label="AM BUCKET START"
              value={stagedTenant.amStartHour.toString()}
              onChange={(v: string) =>
                setStagedTenant({
                  ...stagedTenant,
                  amStartHour: parseInt(v),
                })
              }
              options={Array.from({ length: 12 }, (_, i) => ({
                value: (i + 1).toString(),
                label: `${i + 1}:00 AM`,
              }))}
              icon={<Clock className="w-3.5 h-3.5" />}
            />
            <SelectField
              label="PM BUCKET START"
              value={stagedTenant.pmStartHour.toString()}
              onChange={(v: string) =>
                setStagedTenant({
                  ...stagedTenant,
                  pmStartHour: parseInt(v),
                })
              }
              options={Array.from({ length: 24 }, (_, i) => ({
                value: i.toString(),
                label:
                  i === 12
                    ? "12:00 PM"
                    : i > 12
                      ? `${i - 12}:00 PM`
                      : `${i}:00 AM`,
              }))}
              icon={<Clock className="w-3.5 h-3.5" />}
            />
            <SelectField
              label="OPERATIONAL DAY END"
              value={stagedTenant.dayEndHour.toString()}
              onChange={(v: string) =>
                setStagedTenant({
                  ...stagedTenant,
                  dayEndHour: parseInt(v),
                })
              }
              options={Array.from({ length: 24 }, (_, i) => ({
                value: i.toString(),
                label:
                  i === 12
                    ? "12:00 PM"
                    : i > 12
                      ? `${i - 12}:00 PM`
                      : `${i}:00 AM`,
              }))}
              icon={<Clock className="w-3.5 h-3.5" />}
            />
          </div>
        </div>
      </PermissionGate>
    </div>
  );
}
