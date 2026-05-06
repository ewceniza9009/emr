"use client";

import dynamic from "next/dynamic";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { Shield, ChevronLeft, Save, Activity } from "lucide-react";
import Link from "next/link";
import { useMemo, useCallback } from "react";

// SurveyJS imports need to be dynamic to avoid SSR issues
const SurveyCreatorWidget = dynamic(
  () => import("@/components/SurveyCreatorWidget"),
  { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center text-slate-500 font-black uppercase tracking-[0.3em] animate-pulse">Loading Logic Engine...</div> }
);

const GET_FORM = gql`
  query GetForm($id: UUID!) {
    questionnaires(where: { questionnaireId: { eq: $id } }) {
      questionnaireId
      name
      schemaJson
      assessmentType
      questions {
        text
        type
        optionsJson
      }
    }
  }
`;

const UPDATE_FORM = gql`
  mutation UpdateForm($input: UpdateQuestionnaireInput!) {
    updateQuestionnaire(input: $input)
  }
`;

function mapToSurveyType(legacyType: string | undefined | null) {
  if (!legacyType) return "text";
  const t = String(legacyType).toUpperCase().replace(/_/g, '');
  if (t.includes("SCALE") || t.includes("1")) return "slider";
  if (t.includes("RATING")) return "rating";
  if (t.includes("YESNO") || t.includes("BOOLEAN") || t.includes("2")) return "boolean";
  if (t.includes("CHOICE") || t.includes("RADIO") || t.includes("3")) return "radiogroup";
  if (t.includes("SELECT") || t.includes("CHECK") || t.includes("5")) return "checkbox";
  return "text";
}

export default function FormDesignerPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, loading, error } = useQuery(GET_FORM, { variables: { id } });
  const form = data?.questionnaires?.[0];

  const [updateForm, { loading: saving }] = useMutation(UPDATE_FORM, {
    refetchQueries: ["GetQuestionnaires"]
  });

  const handleSave = useCallback(async (json: string) => {
    if (!form) return;

    try {
      await updateForm({
        variables: {
          input: {
            questionnaireId: form.questionnaireId,
            name: form.name,
            assessmentType: form.assessmentType,
            schemaJson: json
          }
        }
      });
    } catch (err) {
      console.error("Save failed", err);
    }
  }, [form, updateForm]);

  // Synthesis Logic: Convert legacy question rows to SurveyJS JSON if modern schema is empty
  const initialJson = useMemo(() => {
    if (!form) return null;

    // SELF-HEALING: If the schema exists but was built using old rules (Rating instead of Slider, or missing 0-10 scale)
    // we force a re-synthesis to ensure clinical parity.
    const isStaleSchema = form.schemaJson?.includes('"name":"legacy_import"') && 
                         (!form.schemaJson?.includes('"rateMax":10') || !form.schemaJson?.includes('"type":"slider"'));

    if (form.schemaJson && form.schemaJson.length > 10 && !isStaleSchema) return form.schemaJson;

    if (form.questions?.length > 0) {
      const elements = form.questions.map((q: any, idx: number) => {
        const type = mapToSurveyType(q.type);
        const base: any = {
          type: type,
          name: `q_${idx}`,
          title: q.text
        };
        
        // Handle High-Resolution Clinical Scales (0-10)
        if (type === "rating") {
          base.rateMin = 0;
          base.rateMax = 10;
        }
        if (type === "slider") {
          base.min = 0;
          base.max = 10;
          base.step = 1;
          // base.pipsMode = "steps"; // Removing to avoid label clutter in designer
        }

        if (q.optionsJson) {
          try { base.choices = JSON.parse(q.optionsJson); } catch (e) { }
        }
        return base;
      });
      
      return JSON.stringify({ 
        title: form.name,
        description: `Dynamic Clinical Assessment: ${form.assessmentType}`,
        logoPosition: "right",
        pages: [{ 
          name: "legacy_import", 
          title: "Initial Assessment Data",
          elements 
        }] 
      });
    }
    return null;
  }, [form]);

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center font-black text-slate-500 uppercase tracking-widest animate-pulse">Initializing Neural Designer...</div>;

  if (!form) return <div className="min-h-screen bg-[#020617] flex items-center justify-center p-20 text-center text-rose-500 font-bold uppercase tracking-widest border border-rose-500/20 m-10 rounded-3xl">Form Registry Node Not Found.</div>;

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="h-20 border-b border-slate-200 bg-white/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-6">
          <Link href="/admin/dashboard" className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-none">{form.name}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Dynamic Script Architect</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {saving && (
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Persisting...</span>
              </div>
           )}
            <button 
              onClick={async () => {
                console.log("Forcing Re-Sync for:", form?.name);
                try {
                  const res = await updateForm({
                    variables: {
                      input: {
                        questionnaireId: form.questionnaireId,
                        name: form.name,
                        assessmentType: form.assessmentType,
                        schemaJson: null 
                      }
                    }
                  });
                  console.log("Purge Result:", res);
                  window.location.href = window.location.href;
                } catch (e) {
                  console.error("Re-sync error:", e);
                }
              }}
              className="h-11 px-6 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95"
            >
              <Activity className="w-4 h-4" />
              <span className="text-[9px]">Force Repair 0-10 Scale</span>
            </button>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('save-survey-schema'))}
              className="h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.15em] shadow-2xl shadow-indigo-600/20 transition-all flex items-center gap-3 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span className="text-[10px]">Save Schema</span>
            </button>
         </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <SurveyCreatorWidget 
          initialJson={initialJson || "{}"} 
          onSave={handleSave} 
        />
      </main>

      <style jsx global>{`
        /* Nuclear Typography Restoration */
        .svc-creator * {
          color: #0f172a !important;
        }

        /* Exceptions for Icons & Accents */
        .svc-tabbed-menu-item--selected *, 
        .svc-toolbox__item *,
        .svc-icon use,
        .sv-svg-icon {
          color: inherit !important;
        }

        .svc-tabbed-menu-item--selected {
          color: #4f46e5 !important;
          border-bottom-color: #4f46e5 !important;
        }

        .svc-creator {
          background-color: #f8fafc !important;
        }
        
        .svc-creator__area {
          border: none !important;
        }

        /* Clean up Toolbox */
        .svc-toolbox {
          background-color: #ffffff !important;
          border-right: 1px solid #e2e8f0 !important;
        }

        /* Professional Design Surface */
        .svc-designer-canvas {
          background-color: #f1f5f9 !important;
          background-image: radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0) !important;
          background-size: 24px 24px !important;
        }

        /* Branding Suppression */
        .svc-creator__banner, .svc-logo, .svc-creator__footer {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
