"use client";

import { useQuery, useMutation, gql } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import { useSettings } from "@/lib/SettingsContext";
import { useCommandModal } from "@/components/CommandModalProvider";
import {
  ArrowLeft,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Building,
  User,
  Calendar,
  Hash,
  MapPin,
  CreditCard,
  X,
  Edit2,
  History
} from "lucide-react";

const UPDATE_INVOICE = gql`
  mutation UpdateInvoice($command: UpdateInvoiceCommandInput!) {
    updateInvoice(command: $command) {
      invoiceId
    }
  }
`;

const VOID_INVOICE = gql`
  mutation VoidInvoice($id: Guid!) {
    voidInvoice(command: { invoiceId: $id })
  }
`;

const GET_INVOICE_DETAILS = gql`
  query GetInvoiceDetails($id: UUID!) {
    billingInvoices(id: $id) {
      items {
        invoiceId
        invoiceNumber
        status
        subtotalAmount
        coveredAmount
        patientResponsibility
        generatedAt
        dueDate
        patient {
          firstName
          lastName
          mrn
          dob
          addresses {
            isPrimary
            address {
              street
              city
              state
              postalCode
            }
          }
        }
        items {
          itemId
          description
          quantity
          unitPrice
          totalPrice
        }
      }
    }
  }
`;

export default function InvoiceDetailsPage() {
  const { confirm, alert } = useCommandModal();
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { formatCurrency, tenantConfig } = useSettings();
  const [voidInvoice, { loading: isVoiding }] = useMutation(VOID_INVOICE);
  const [updateInvoice, { loading: isUpdating }] = useMutation(UPDATE_INVOICE);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data, loading, refetch } = useQuery(GET_INVOICE_DETAILS, {
    variables: { id: params.id }
  });

  const invoice = data?.billingInvoices?.items?.[0];

  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!params.id) return;
    setDownloading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/export/invoice/${params.id}`);
      if (!response.ok) throw new Error("Failed to export invoice PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${invoice?.invoiceNumber || params.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("Invoice PDF Generated Successfully", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Error exporting PDF. Please try again.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleVoid = async () => {
    const ok = await confirm({
      title: "Void Invoice",
      message: "Are you sure you want to void this invoice? This action cannot be undone and will officially cancel the financial record.",
      type: "danger",
      confirmText: "Void Invoice"
    });
    if (!ok) return;
    try {
      await voidInvoice({ variables: { id: params.id } });
      showToast("Invoice Voided: The status has been updated to Cancelled.", "success");
      refetch();
    } catch (err: any) {
      await alert({
        title: "Error",
        message: err.message,
        type: "danger"
      });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!invoice) return (
    <div className="text-center py-20">
      <h2 className="text-xl font-bold uppercase">Invoice Not Found</h2>
      <button onClick={() => router.back()} className="mt-4 text-[var(--primary)] font-black uppercase tracking-widest text-[10px]">Go Back</button>
    </div>
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Paid": return "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]";
      case "Draft": return "bg-amber-500 text-white";
      case "Issued": return "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]";
      case "Overdue": return "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]";
      case "Cancelled": return "bg-slate-700 text-slate-300";
      default: return "bg-slate-500 text-white";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header Actions */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:bg-[var(--card-border)] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight">Invoice Details</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${getStatusStyle(invoice.status)}`}>
                {invoice.status}
              </span>
              <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">ID: {invoice.invoiceId.slice(0, 8)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="px-5 h-11 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--card-border)] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {downloading ? <Clock className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            {downloading ? "GENERATING..." : "Print"}
          </button>
          {invoice.status !== 'Cancelled' && (
            <>
              <button
                onClick={() => setIsEditOpen(true)}
                className="px-5 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={handleVoid}
                disabled={isVoiding}
                className="px-5 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Void
              </button>
            </>
          )}
          <button className="px-8 h-11 rounded-xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[var(--primary-glow)] hover:opacity-90 transition-all">
            Mark as Paid
          </button>
        </div>
      </div>

      {/* Actual Invoice Document */}
      <div className="bg-white text-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
        {/* Branding Header */}
        <div className="bg-slate-900 p-12 text-white flex justify-between items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-3xl">A</div>
              <div>
                <h2 className="text-2xl font-black tracking-tighter uppercase leading-none text-white">Halcyon Clinical OS</h2>
                <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest mt-1">Advanced Medical Infrastructure</p>
              </div>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed max-w-[200px]">
              123 Clinical Plaza, Suite 500<br />Medical District, Metropolis<br />P: (555) 0123-4567
            </div>
          </div>

          <div className="text-right space-y-2">
            <h3 className="text-5xl font-black tracking-tighter opacity-10 text-white">INVOICE</h3>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Document Identification</p>
              <p className="text-xl font-black text-white">{invoice.invoiceNumber}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Dated: {new Date(invoice.generatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="p-12 space-y-12">
          {/* Billing Entities */}
          <div className="grid grid-cols-2 gap-20">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Client Identification</p>
              <div>
                <h4 className="text-xl font-black uppercase text-slate-900">{invoice.patient.firstName} {invoice.patient.lastName}</h4>
                <p className="text-xs font-bold text-slate-500 mt-1">Medical Record Number: {invoice.patient.mrn}</p>
              </div>
              <div className="text-xs font-medium text-slate-600 space-y-1">
                <p>{invoice.patient.addresses?.find((a: any) => a.isPrimary)?.address?.line1 || 'No address on file'}</p>
                <p>{invoice.patient.addresses?.find((a: any) => a.isPrimary)?.address?.city}, {invoice.patient.addresses?.find((a: any) => a.isPrimary)?.address?.postalCode}</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Financial Framework</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Invoice Date</p>
                  <p className="text-xs font-bold text-slate-900">{new Date(invoice.generatedAt).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Due Date</p>
                  <p className="text-xs font-bold text-slate-900">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Payment Method</p>
                  <p className="text-xs font-bold text-slate-900">Health Insurance / OOP</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Settlement Period</p>
                  <p className="text-xs font-bold text-slate-900">30 Days Net</p>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-4">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-900 text-left">
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-1/2">Service Description</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Qty</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Unit Rate</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items?.map((item: any) => (
                  <tr key={item.itemId}>
                    <td className="py-5">
                      <p className="text-xs font-black uppercase text-slate-800">{item.description}</p>
                      <p className="text-[9px] font-medium text-slate-400 mt-0.5">Clinical Service Instrumentation</p>
                    </td>
                    <td className="py-5 text-center text-xs font-bold text-slate-600">{item.quantity}</td>
                    <td className="py-5 text-right text-xs font-bold text-slate-600">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-5 text-right text-xs font-black text-slate-900">{formatCurrency(item.totalPrice || (item.quantity * item.unitPrice))}</td>
                  </tr>
                ))}
                {(!invoice.items || invoice.items.length === 0) && (
                  <tr>
                    <td className="py-5">
                      <p className="text-xs font-black uppercase text-slate-800">General Consultation & Instrumentation</p>
                    </td>
                    <td className="py-5 text-center text-xs font-bold text-slate-600">1</td>
                    <td className="py-5 text-right text-xs font-bold text-slate-600">{formatCurrency(invoice.subtotalAmount)}</td>
                    <td className="py-5 text-right text-xs font-black text-slate-900">{formatCurrency(invoice.subtotalAmount)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Total Summary Section */}
          <div className="flex justify-end">
            <div className="w-80 space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Subtotal</span>
                <span className="text-xs font-black text-slate-800">{formatCurrency(invoice.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-emerald-600 bg-emerald-50 px-3 rounded-lg">
                <span className="text-[10px] font-black uppercase tracking-widest">Insurance Coverage</span>
                <span className="text-xs font-black">-{formatCurrency(invoice.coveredAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-4 border-t-2 border-slate-900">
                <span className="text-xs font-black uppercase tracking-widest text-slate-900">Patient Liability</span>
                <span className="text-2xl font-black text-slate-900">{formatCurrency(invoice.patientResponsibility)}</span>
              </div>
            </div>
          </div>

          {/* Footer / Legal */}
          <div className="pt-20 border-t border-slate-100 flex justify-between items-end">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Electronic verification secured</p>
              </div>
              <p className="text-[10px] font-medium text-slate-400 max-w-sm leading-relaxed">
                Please ensure settlement within the defined net-30 framework. Late payments may be subject to interest as per local medical billing regulations.
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Authenticated By</p>
              <p className="text-lg font-script text-slate-500 italic">Clinical Administration Unit</p>
              <div className="w-48 h-px bg-slate-200 mt-1 inline-block" />
            </div>
          </div>
        </div>
      </div>
      {isEditOpen && (
        <EditInvoiceDrawer
          invoice={invoice}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          isUpdating={isUpdating}
          onUpdate={async (command: any) => {
            try {
              await updateInvoice({ variables: { command } });
              showToast("Invoice Updated Successfully", "success");
              setIsEditOpen(false);
              refetch();
            } catch (err: any) {
              showToast(err.message, "error");
            }
          }}
        />
      )}
    </div>
  );
}

function EditInvoiceDrawer({ invoice, isOpen, onClose, onUpdate, isUpdating }: any) {
  const { tenantConfig, currencySymbol } = useSettings();
  const [subtotal, setSubtotal] = useState(invoice.subtotalAmount);
  const [covered, setCovered] = useState(invoice.coveredAmount);
  const [dueInDays, setDueInDays] = useState(30);

  useEffect(() => {
    setSubtotal(invoice.subtotalAmount);
    setCovered(invoice.coveredAmount);
  }, [invoice]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-end no-print">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-[#0a0a0b] border-l border-white/5 shadow-2xl p-8 animate-slide-in-right">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight text-white">Amend Invoice</h2>
            <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest mt-1">Clerical Correction Module</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          onUpdate({
            invoiceId: invoice.invoiceId,
            subtotalAmount: parseFloat(subtotal.toString()),
            coveredAmount: parseFloat(covered.toString()),
            dueInDays: parseInt(dueInDays.toString())
          });
        }} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gross Subtotal ({currencySymbol})</label>
            <input
              type="number"
              value={subtotal}
              onChange={(e) => setSubtotal(e.target.value)}
              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-teal-500/50 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Insurance Coverage ({currencySymbol})</label>
            <input
              type="number"
              value={covered}
              onChange={(e) => setCovered(e.target.value)}
              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-teal-500/50 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Settlement Period (Days)</label>
            <select
              value={dueInDays}
              onChange={(e) => setDueInDays(parseInt(e.target.value))}
              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-teal-500/50 transition-all outline-none appearance-none"
            >
              <option value="15">15 Days Net</option>
              <option value="30">30 Days Net</option>
              <option value="60">60 Days Net</option>
              <option value="90">90 Days Net</option>
            </select>
          </div>

          <div className="pt-8">
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full h-12 bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-teal-900/20 transition-all disabled:opacity-50"
            >
              {isUpdating ? "Applying Corrections..." : "Apply Financial Corrections"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
