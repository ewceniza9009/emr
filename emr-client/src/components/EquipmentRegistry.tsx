import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import {
  Truck,
  Package,
  CheckCircle2,
  Clock,
  Settings,
  Activity,
  AlertCircle,
  Plus
} from "lucide-react";

import EquipmentManagementDrawer from "./EquipmentManagementDrawer";

const GET_EQUIPMENT = gql`
  query GetEquipment($patientId: UUID!) {
    patientById(patientId: $patientId) {
      addresses {
        address {
          street
          city
          state
          postalCode
        }
      }
    }
    equipmentDeliveriesByPatient(patientId: $patientId) {
      deliveryId
      status
      deliveredAt
      requestedAt
      deliveryAddress
      equipment {
        modelName
        type
        serialNumber
        status
      }
    }
  }
`;

const UPDATE_DEPLOYMENT_STATUS = gql`
  mutation UpdateDeploymentStatus($input: UpdateDeploymentStatusCommandInput!) {
    updateDeploymentStatus(input: $input)
  }
`;

export default function EquipmentRegistry({ patientId }: { patientId: string }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { data, loading, refetch } = useQuery(GET_EQUIPMENT, {
    variables: { patientId },
  });

  const [updateStatus] = useMutation(UPDATE_DEPLOYMENT_STATUS, {
    onCompleted: () => refetch()
  });

  const handleStatusUpdate = async (deliveryId: string, currentStatus: string) => {
    const statuses = ['PENDING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    await updateStatus({
      variables: {
        input: {
          deliveryId,
          newStatus: nextStatus
        }
      }
    });
  };

  const deliveries = data?.equipmentDeliveriesByPatient || [];
  const primaryAddress = data?.patientById?.addresses?.[0]?.address;
  const defaultAddressStr = primaryAddress ? `${primaryAddress.street}, ${primaryAddress.city}, ${primaryAddress.state} ${primaryAddress.postalCode}` : "";

  if (loading) return <div className="p-8 text-[var(--text-muted)] animate-pulse uppercase text-[10px] font-black tracking-widest">Inventory Scan in Progress...</div>;

  return (
    <div className="glass-morphism rounded-3xl overflow-hidden border border-[var(--card-border)]">
      <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)]">
        <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-500" />
          Medical Equipment & Logistics
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Manage Inventory
          </button>
        </div>
      </div>

      <EquipmentManagementDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        patientId={patientId}
        defaultAddress={defaultAddressStr}
        onSuccess={refetch}
      />


      <div className="p-8">
        {deliveries.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)] opacity-20" />
            <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">No Active Equipment Deployments</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {deliveries.map((d: any) => (
              <div key={d.deliveryId} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--primary)]/30 transition-all group relative overflow-hidden flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${d.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        d.status === 'FAILED' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-tight truncate leading-tight">{d.equipment?.modelName}</h3>
                      <p className="text-[8px] font-black text-[var(--primary)] uppercase tracking-widest leading-none mt-0.5">{d.equipment?.type?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border ${d.status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' :
                        d.status === 'FAILED' ? 'bg-rose-500/20 text-rose-500 border-rose-500/30' :
                          'bg-amber-500/20 text-amber-500 border-amber-500/30'
                      }`}>
                      {d.status?.replace(/_/g, ' ')}
                    </span>
                    <button
                      onClick={() => handleStatusUpdate(d.deliveryId, d.status)}
                      className="text-[6px] font-black uppercase tracking-tighter text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors flex items-center gap-1 mt-1"
                    >
                      <Activity className="w-2 h-2" />
                      Update
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[var(--card-bg)]/50 rounded-xl border border-[var(--card-border)]/50">
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest">Serial</span>
                    <span className="text-[9px] font-mono font-bold text-[var(--text-primary)]">{d.equipment?.serialNumber}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest">Deployed</span>
                    <span className="text-[9px] font-bold text-[var(--text-primary)]">{d.deliveredAt ? new Date(d.deliveredAt).toLocaleDateString() : 'PENDING'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-tight truncate group-hover:text-[var(--text-primary)] transition-colors">
                  <Truck className="w-3 h-3 text-[var(--primary)]" />
                  {d.deliveryAddress}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


