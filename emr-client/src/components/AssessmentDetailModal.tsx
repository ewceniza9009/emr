"use client";

import {
  X,
  ClipboardList,
  CheckCircle2,
  Calendar,
  User,
  Hash,
  ChevronRight,
  BarChart3,
  AlertCircle,
  Zap,
} from "lucide-react";
import HalcyonPortal from "./Portal";

interface Question {
  questionId: string;
  text: string;
  subtext?: string;
  type: string;
  order: number;
  optionsJson?: string;
}

interface AssessmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: {
    assessmentResponseId: string;
    totalScore?: number | null;
    completedAt?: string;
    answersJson?: string;
    questionnaire?: {
      name: string;
      description?: string;
      assessmentType?: string;
      questions?: Question[];
    };
    assessor?: {
      firstName: string;
      lastName: string;
      position?: string;
    };
  } | null;
}

function parseAnswers(answersJson?: string): Record<string, any> {
  if (!answersJson) return {};
  try {
    return JSON.parse(answersJson);
  } catch {
    return {};
  }
}

function parseOptions(optionsJson?: string): string[] {
  if (!optionsJson) return [];
  try {
    return JSON.parse(optionsJson);
  } catch {
    return [];
  }
}

function getScoreColor(score: number, max = 10) {
  const pct = score / max;
  if (pct >= 0.7) return { text: "text-rose-500", bg: "bg-rose-500", badge: "bg-rose-500/10 text-rose-400 border-rose-500/20" };
  if (pct >= 0.4) return { text: "text-amber-500", bg: "bg-amber-500", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
  return { text: "text-emerald-500", bg: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
}

export default function AssessmentDetailModal({ isOpen, onClose, assessment }: AssessmentDetailModalProps) {
  if (!isOpen || !assessment) return null;

  const answers = parseAnswers(assessment.answersJson);
  const questions = assessment.questionnaire?.questions ?? [];
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
  const totalScore = assessment.totalScore;
  const scoreColors = totalScore != null ? getScoreColor(totalScore) : null;

  return (
    <HalcyonPortal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 !m-0 !p-0 z-[99999999] flex items-center justify-center p-6 overflow-hidden"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" />

        {/* Modal */}
        <div
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-[2.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.6)] animate-in zoom-in-95 fade-in duration-300 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Accent bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-[var(--primary)] to-teal-400" />

          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-8 pt-8 pb-6 border-b border-[var(--card-border)] shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <ClipboardList className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight leading-none">
                  {assessment.questionnaire?.name ?? "Assessment"}
                </h2>
                {assessment.questionnaire?.description && (
                  <p className="text-[10px] text-[var(--text-muted)] font-medium italic mt-1.5">
                    {assessment.questionnaire.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  {assessment.completedAt && (
                    <span className="flex items-center gap-1.5 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                      <Calendar className="w-3 h-3" />
                      {new Date(assessment.completedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </span>
                  )}
                  {assessment.assessor && (
                    <span className="flex items-center gap-1.5 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                      <User className="w-3 h-3" />
                      {assessment.assessor.firstName} {assessment.assessor.lastName}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest font-mono">
                    <Hash className="w-3 h-3" />
                    {assessment.assessmentResponseId.slice(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {totalScore != null && scoreColors && (
                <div className={`px-4 py-2 rounded-xl border text-center ${scoreColors.badge}`}>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-70 mb-0.5">Total Score</p>
                  <p className={`text-xl font-bold leading-none ${scoreColors.text}`}>{totalScore}</p>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--primary)]/40 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4 custom-scrollbar">

            {/* Score summary bar (if we have a numeric total) */}
            {totalScore != null && scoreColors && (
              <div className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                    <BarChart3 className="w-3.5 h-3.5 text-[var(--primary)]" />
                    Composite Score
                  </span>
                  <span className={`text-[11px] font-black uppercase tracking-widest ${scoreColors.text}`}>
                    {totalScore} pts
                  </span>
                </div>
                <div className="h-2 w-full bg-[var(--card-border)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${scoreColors.bg}`}
                    style={{ width: `${Math.min((totalScore / 30) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Q&A breakdown */}
            {sortedQuestions.length > 0 ? (
              <div className="space-y-3">
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)]" />
                  Response Breakdown — {sortedQuestions.length} item{sortedQuestions.length !== 1 ? "s" : ""}
                </p>
                {sortedQuestions.map((q, idx) => {
                  const rawAnswer = answers[q.questionId] ?? answers[String(q.order)] ?? answers[q.text] ?? null;
                  const options = parseOptions(q.optionsJson);
                  const isNumeric = typeof rawAnswer === "number" || (typeof rawAnswer === "string" && !isNaN(Number(rawAnswer)));
                  const numericVal = isNumeric ? Number(rawAnswer) : null;

                  return (
                    <div
                      key={q.questionId}
                      className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--primary)]/30 transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        {/* Question number */}
                        <div className="w-7 h-7 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0 text-[9px] font-black mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0 space-y-2.5">
                          <div>
                            <p className="text-[11px] font-bold text-[var(--text-primary)] leading-snug">{q.text}</p>
                            {q.subtext && (
                              <p className="text-[9px] text-[var(--text-muted)] italic mt-0.5">{q.subtext}</p>
                            )}
                          </div>

                          {/* Answer display */}
                          {rawAnswer == null ? (
                            <span className="inline-flex text-[9px] text-[var(--text-muted)] italic">— No response recorded</span>
                          ) : isNumeric && numericVal != null ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Score</span>
                                <span className={`text-sm font-bold ${getScoreColor(numericVal).text}`}>{numericVal}</span>
                              </div>
                              <div className="h-1.5 w-full bg-[var(--card-border)] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${getScoreColor(numericVal).bg}`}
                                  style={{ width: `${Math.min((numericVal / 10) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          ) : Array.isArray(rawAnswer) ? (
                            <div className="flex flex-wrap gap-1.5">
                              {rawAnswer.map((v: any, i: number) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-black uppercase tracking-wider border border-[var(--primary)]/20"
                                >
                                  {String(v)}
                                </span>
                              ))}
                            </div>
                          ) : options.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {options.map((opt, i) => (
                                <span
                                  key={i}
                                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${
                                    String(rawAnswer) === opt
                                      ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-md"
                                      : "bg-[var(--card-border)]/30 text-[var(--text-muted)] border-[var(--card-border)]"
                                  }`}
                                >
                                  {opt}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="px-4 py-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                                {String(rawAnswer)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Score badge for numeric answers */}
                        {isNumeric && numericVal != null && (
                          <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold border ${getScoreColor(numericVal).badge}`}>
                            {numericVal}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : Object.keys(answers).length > 0 ? (
              /* Fallback: render raw answers when questions aren't available */
              <div className="space-y-3">
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)]" />
                  Recorded Responses
                </p>
                {Object.entries(answers).map(([key, val], idx) => (
                  <div
                    key={key}
                    className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-[9px] font-black">
                        {idx + 1}
                      </div>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{key}</p>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">{String(val)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 opacity-60">
                <AlertCircle className="w-10 h-10 text-[var(--text-muted)]" />
                <div>
                  <p className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-widest">No Response Data</p>
                  <p className="text-[9px] text-[var(--text-muted)] mt-1">Answer data is not available for this assessment.</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-[var(--card-border)] shrink-0 flex items-center justify-between">
            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-50 flex items-center gap-2">
              <Zap className="w-3 h-3" />
              Halcyon Clinical OS · Encrypted Record
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--primary)]/30 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}
