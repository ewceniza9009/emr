"use client";

import { useQuery, gql } from "@apollo/client";
import { 
  FileText, 
  Download, 
  Plus, 
  ExternalLink,
  ShieldCheck,
  Search,
  FileCode,
  Image as ImageIcon,
  FileBox
} from "lucide-react";
import { useState } from "react";
import UploadDocumentDrawer from "./UploadDocumentDrawer";

const GET_DOCUMENTS = gql`
  query GetDocumentsByPatient($patientId: UUID!) {
    documentsByPatient(patientId: $patientId) {
      patientDocumentId
      title
      documentType
      storageUrl
      contentType
      uploadedAt
      fileSize
    }
  }
`;

interface Props {
  patientId: string;
}

export default function DocumentVault({ patientId }: Props) {
  const [search, setSearch] = useState("");
   const [isUploadOpen, setIsUploadOpen] = useState(false);
   const { data, loading, refetch } = useQuery(GET_DOCUMENTS, {
     variables: { patientId },
     skip: !patientId
   });

  const documents = data?.documentsByPatient || [];
  
  const getIcon = (type: string) => {
     if (type.includes('image')) return <ImageIcon className="w-5 h-5 text-purple-400" />;
     if (type.includes('pdf')) return <FileText className="w-5 h-5 text-rose-400" />;
     return <FileBox className="w-5 h-5 text-blue-400" />;
  };

  const filteredDocs = documents.filter((d: any) => 
    d.title.toLowerCase().includes(search.toLowerCase()) || 
    d.documentType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[var(--card-bg)] rounded-[2.5rem] p-10 border border-[var(--card-border)] shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-10 opacity-5">
        <FileCode className="w-40 h-40" />
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
        <div>
          <h2 className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-3 uppercase tracking-tighter">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
            Clinical Document Vault
          </h2>
          <p className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest mt-1">Immutable Patient Records & Discharges</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter by type or name..." 
                className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-[var(--text-primary)] focus:border-blue-500 transition-all w-60"
              />
           </div>
           <button 
             onClick={() => setIsUploadOpen(true)}
             className="px-6 py-2.5 rounded-xl bg-blue-600 text-[var(--text-primary)] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 flex items-center gap-2 hover:bg-blue-500 transition-all"
           >
             <Plus className="w-4 h-4" /> Upload Record
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {loading ? (
           [1,2,3].map(i => <div key={i} className="h-40 rounded-3xl bg-white/5 animate-pulse" />)
        ) : filteredDocs.length > 0 ? (
          filteredDocs.map((doc: any) => (
            <div key={doc.patientDocumentId} className="group p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer">
               <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-blue-500/10 transition-all">
                     {getIcon(doc.contentType || '')}
                  </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `${process.env.NEXT_PUBLIC_API_URL}/api/upload/document/${doc.patientDocumentId}?download=true`;
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', doc.title || 'document');
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                        }}
                        className="p-2 rounded-lg hover:bg-white/10 text-slate-500 hover:text-[var(--text-primary)] transition-all"
                        title="Download Record"
                      >
                         <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `${process.env.NEXT_PUBLIC_API_URL}/api/upload/document/${doc.patientDocumentId}`;
                          window.open(url, '_blank');
                        }}
                        className="p-2 rounded-lg hover:bg-white/10 text-slate-500 hover:text-[var(--text-primary)] transition-all"
                        title="View Record"
                      >
                         <ExternalLink className="w-4 h-4" />
                      </button>
                   </div>
               </div>
               <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight mb-1 truncate">{doc.title}</h3>
               <div className="flex items-center justify-between mt-4">
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{doc.documentType}</span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                     {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>
               </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center rounded-[3rem] border-2 border-dashed border-white/5">
             <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
             <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No clinical documents found in registry.</p>
             <p className="text-[10px] text-slate-600 mt-2 uppercase tracking-widest">Upload hospital discharge papers, IDs, or consents.</p>
          </div>
        )}
      </div>
      
      <div className="mt-12 p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
               <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
               <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">HIPAA Compliant Storage</p>
               <p className="text-[9px] text-slate-500 uppercase tracking-widest">All documents are encrypted at rest and in transit.</p>
            </div>
         </div>
         <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Total Vault Size: 1.2 MB</span>
      </div>

      <UploadDocumentDrawer 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        patientId={patientId}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}
