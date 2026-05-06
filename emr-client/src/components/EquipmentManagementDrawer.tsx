import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { 
  Package, 
  Truck, 
  X, 
  ChevronRight, 
  Plus,
  QrCode,
  MapPin,
  ClipboardCheck
} from "lucide-react";

const GET_AVAILABLE_EQUIPMENT = gql`
  query GetAvailableEquipment {
    availableEquipment {
      equipmentId
      modelName
      serialNumber
      type
    }
  }
`;

const REGISTER_EQUIPMENT = gql`
  mutation RegisterEquipment($input: RegisterEquipmentCommandInput!) {
    registerEquipment(input: $input)
  }
`;

const DEPLOY_EQUIPMENT = gql`
  mutation RequestEquipmentDeployment($input: RequestEquipmentDeploymentCommandInput!) {
    requestEquipmentDeployment(input: $input)
  }
`;

interface EquipmentManagementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  defaultAddress: string;
  onSuccess: () => void;
}

export default function EquipmentManagementDrawer({ 
  isOpen, 
  onClose, 
  patientId, 
  defaultAddress,
  onSuccess 
}: EquipmentManagementDrawerProps) {
  const [activeTab, setActiveTab] = useState<'DEPLOY' | 'REGISTER'>('DEPLOY');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [address, setAddress] = useState(defaultAddress);
  
  // Registration State
  const [regModelName, setRegModelName] = useState("");
  const [regSerial, setRegSerial] = useState("");
  const [regType, setRegType] = useState("OxygenConcentrator");

  const { data, loading, refetch } = useQuery(GET_AVAILABLE_EQUIPMENT, { skip: !isOpen });
  
  const [register] = useMutation(REGISTER_EQUIPMENT, {
    onCompleted: () => {
      refetch();
      setActiveTab('DEPLOY');
    }
  });

  const [deploy] = useMutation(DEPLOY_EQUIPMENT, {
    onCompleted: () => {
      onSuccess();
      onClose();
    }
  });

  const handleRegister = async () => {
    await register({
      variables: {
        input: {
          modelName: regModelName,
          serialNumber: regSerial,
          type: regType
        }
      }
    });
  };

  const handleDeploy = async () => {
    await deploy({
      variables: {
        input: {
          equipmentId: selectedEquipmentId,
          patientId,
          deliveryAddress: address
        }
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[var(--card-bg)] border-l border-[var(--card-border)] h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--card-border)] bg-[var(--input-bg)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">Clinical Logistics</h2>
              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Inventory & Deployment</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--card-bg)] rounded-lg transition-colors">
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-4 gap-2 bg-[var(--card-bg)] border-b border-[var(--card-border)]">
          <button 
            onClick={() => setActiveTab('DEPLOY')}
            className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              activeTab === 'DEPLOY' 
                ? 'bg-[var(--primary)] text-white border-[var(--primary)]' 
                : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--card-border)]'
            }`}
          >
            Deploy Asset
          </button>
          <button 
            onClick={() => setActiveTab('REGISTER')}
            className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              activeTab === 'REGISTER' 
                ? 'bg-[var(--primary)] text-white border-[var(--primary)]' 
                : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--card-border)]'
            }`}
          >
            Tag New Asset
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'DEPLOY' ? (
            <>
              <div className="space-y-3">
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Select Available Equipment</label>
                {loading ? (
                  <div className="h-20 animate-pulse bg-[var(--input-bg)] rounded-2xl" />
                ) : (
                  <div className="grid gap-2">
                    {data?.availableEquipment?.map((e: any) => (
                      <button
                        key={e.equipmentId}
                        onClick={() => setSelectedEquipmentId(e.equipmentId)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          selectedEquipmentId === e.equipmentId
                            ? 'bg-[var(--primary)]/10 border-[var(--primary)]'
                            : 'bg-[var(--input-bg)] border-[var(--card-border)] hover:border-[var(--primary)]/30'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-black text-[var(--text-primary)] uppercase">{e.modelName}</p>
                            <p className="text-[9px] text-[var(--primary)] font-bold font-mono">{e.serialNumber}</p>
                          </div>
                          <span className="text-[8px] font-black text-[var(--text-muted)] uppercase">{e.type.replace(/([A-Z])/g, ' $1')}</span>
                        </div>
                      </button>
                    ))}
                    {data?.availableEquipment?.length === 0 && (
                      <div className="p-8 text-center bg-[var(--input-bg)] rounded-2xl border border-dashed border-[var(--card-border)]">
                        <QrCode className="w-8 h-8 mx-auto mb-2 text-[var(--text-muted)] opacity-30" />
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">No available inventory</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Deployment Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-[var(--text-primary)] focus:border-[var(--primary)] transition-all outline-none"
                    placeholder="Enter delivery destination..."
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Model Name</label>
                <input 
                  value={regModelName}
                  onChange={(e) => setRegModelName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl py-3 px-4 text-xs font-bold text-[var(--text-primary)] focus:border-[var(--primary)] transition-all outline-none"
                  placeholder="e.g. Philips EverFlo"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Serial Number (Tag)</label>
                <div className="relative">
                  <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input 
                    value={regSerial}
                    onChange={(e) => setRegSerial(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl py-3 pl-12 pr-4 text-xs font-mono font-bold text-[var(--text-primary)] focus:border-[var(--primary)] transition-all outline-none"
                    placeholder="SN-XXXX-XXXX"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Equipment Type</label>
                <select 
                  value={regType}
                  onChange={(e) => setRegType(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl py-3 px-4 text-xs font-bold text-[var(--text-primary)] focus:border-[var(--primary)] transition-all outline-none appearance-none"
                >
                  <option value="OxygenConcentrator">Oxygen Concentrator</option>
                  <option value="OxygenTank">Oxygen Tank</option>
                  <option value="HospitalBed">Hospital Bed</option>
                  <option value="Wheelchair">Wheelchair</option>
                  <option value="InfusionPump">Infusion Pump</option>
                  <option value="SuctionMachine">Suction Machine</option>
                  <option value="Nebulizer">Nebulizer</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--card-border)] bg-[var(--input-bg)]">
          <button
            onClick={activeTab === 'DEPLOY' ? handleDeploy : handleRegister}
            disabled={activeTab === 'DEPLOY' ? !selectedEquipmentId : !regModelName || !regSerial}
            className="w-full h-14 bg-[var(--primary)] text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
          >
            {activeTab === 'DEPLOY' ? (
              <><Truck className="w-4 h-4" /> Finalize Deployment</>
            ) : (
              <><ClipboardCheck className="w-4 h-4" /> Register & Add to Inventory</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
