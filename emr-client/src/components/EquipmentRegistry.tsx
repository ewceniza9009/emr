import { useQuery, gql } from "@apollo/client";
import { 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  Settings,
  Activity,
  AlertCircle
} from "lucide-react";

const GET_EQUIPMENT = gql`
  query GetEquipment($patientId: UUID!) {
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

export default function EquipmentRegistry({ patientId }: { patientId: string }) {
  const { data, loading } = useQuery(GET_EQUIPMENT, {
    variables: { patientId },
  });

  const deliveries = data?.equipmentDeliveriesByPatient || [];

  if (loading) return <div className="p-8 text-[var(--text-muted)] animate-pulse uppercase text-[10px] font-black tracking-widest">Inventory Scan in Progress...</div>;

  return (
    <div className="glass-morphism rounded-3xl overflow-hidden border border-[var(--card-border)]">
      <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)]">
        <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-500" />
          Medical Equipment & Logistics
        </h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Global Inventory Linked</span>
        </div>
      </div>

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
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                    d.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    <Package className="w-6 h-6" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                    d.status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                  }`}>
                    {d.status}
                  </span>
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
