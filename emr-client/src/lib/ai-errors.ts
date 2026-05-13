"use client";

type ToastShowFn = (message: string, type: "success" | "error" | "info") => void;

export function handleModelImageInputError(err: unknown, showToast: ToastShowFn): boolean {
  const errorMessage = err instanceof Error ? err.message : String(err);
  
  if (errorMessage.includes("does not support image input") || errorMessage.includes("Cannot read")) {
    showToast("AI model does not support image input. Clinical note saved without AI enhancement.", "error");
    return true;
  }
  
  return false;
}