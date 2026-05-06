"use client";

import { useEffect, useMemo } from "react";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";
import "survey-core/survey-core.min.css";
import "survey-creator-core/survey-creator-core.min.css";

interface Props {
  initialJson?: string;
  onSave: (json: string) => void;
}

export default function SurveyCreatorWidget({ initialJson, onSave }: Props) {
  // Use a stable creator instance to prevent component unmounting/remounting flicker
  const creator = useMemo(() => {
    const options = {
      showLogicTab: true,
      showTranslationTab: true,
      isAutoSave: false, // Prevent background storage hits
      saveSurveyFunc: (no: any, callback: any) => {
        callback(no, true);
      }
    };
    const creator = new SurveyCreator(options);
    creator.isAutoSave = false;
    return creator;
  }, []); // Only create once

  const lastHydratedRef = useMemo(() => ({ json: "" }), []);

  useEffect(() => {
    if (initialJson && creator && initialJson !== lastHydratedRef.json) {
      // Small delay to ensure the designer is fully "ready" for injection
      const timer = setTimeout(() => {
        try {
          if (initialJson !== "{}" && initialJson.length > 20) {
            console.log("Atomic Hydration Triggered");
            creator.text = initialJson;
            lastHydratedRef.json = initialJson;
          }
        } catch (e) {
          console.error("Hydration Error:", e);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialJson, creator, lastHydratedRef]);

  useEffect(() => {
    const handleSaveEvent = () => {
      onSave(creator.text);
    };

    window.addEventListener('save-survey-schema', handleSaveEvent);
    
    creator.saveSurveyFunc = (saveNo: number, callback: (no: number, success: boolean) => void) => {
      onSave(creator.text);
      callback(saveNo, true);
    };

    return () => {
      window.removeEventListener('save-survey-schema', handleSaveEvent);
    };
  }, [creator, onSave]);

  return (
    <div className="absolute inset-0 survey-designer-container bg-[#020617]">
      <SurveyCreatorComponent creator={creator} />
    </div>
  );
}
