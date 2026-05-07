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
    const statuses = ['PENDING', 'SHIPPED', 'DELIVERED', 'FAILED', 'RETURNED'];
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deliveries.map((d: any) => (
              <div key={d.deliveryId} className="p-6 rounded-[2rem] bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--primary)]/30 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                  <Settings className="w-12 h-12 rotate-90" />
                </div>

                <div className="flex items-start justify-between mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${d.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      d.status === 'FAILED' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${d.status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' :
                        d.status === 'FAILED' ? 'bg-rose-500/20 text-rose-500 border-rose-500/30' :
                          'bg-amber-500/20 text-amber-500 border-amber-500/30'
                      }`}>
                      {d.status}
                    </span>
                    <button
                      onClick={() => handleStatusUpdate(d.deliveryId, d.status)}
                      className="text-[7px] font-black uppercase tracking-tighter text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors flex items-center gap-1"
                    >
                      <Activity className="w-2.5 h-2.5" />
                      Update Status
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">{d.equipment?.modelName}</h3>
                    <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest">{d.equipment?.type?.replace(/([A-Z])/g, ' $1')}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--card-border)]">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Serial Number</p>
                      <p className="text-[10px] font-mono font-bold text-[var(--text-primary)]">{d.equipment?.serialNumber}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Deployment Date</p>
                      <p className="text-[10px] font-bold text-[var(--text-primary)]">{d.deliveredAt ? new Date(d.deliveredAt).toLocaleDateString() : 'PENDING'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--card-bg)]/50 p-2 rounded-lg">
                    <Truck className="w-3.5 h-3.5" />
                    {d.deliveryAddress}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

