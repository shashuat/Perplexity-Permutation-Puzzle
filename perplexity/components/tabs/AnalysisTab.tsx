// components/tabs/AnalysisTab.tsx
import { useState } from 'react';
import { AnalysisResult } from "@/types/types";
import FileStats from "@/components/analysis/FileStats";
import PerplexityCharts from "@/components/analysis/PerplexityCharts";
import TextAnalysis from "@/components/analysis/TextAnalysis";

interface AnalysisTabProps {
  analysisResult: AnalysisResult;
}

export default function AnalysisTab({ analysisResult }: AnalysisTabProps) {
  const [showTextDetails, setShowTextDetails] = useState<boolean>(true);

  return (
    <div>
      {/* Toggle text display */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowTextDetails(!showTextDetails)}
          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md"
        >
          {showTextDetails ? 'Hide Text Details' : 'Show Text Details'}
        </button>
      </div>
      
      {/* File statistics */}
      <FileStats 
        fileStats={analysisResult.fileStats}
        perplexityScores={analysisResult.perplexityScores}
        commonIds={analysisResult.commonIds}
        totalUniqueIds={analysisResult.totalUniqueIds}
      />
      
      {/* Perplexity charts */}
      <PerplexityCharts 
        perplexityScores={analysisResult.perplexityScores}
        showTextDetails={showTextDetails}
      />
      
      {/* Text analysis */}
      {showTextDetails && (
        <TextAnalysis 
          bestTexts={analysisResult.bestTexts}
          comparison={analysisResult.comparison}
        />
      )}
    </div>
  );
}