// types/types.ts

export type FileData = {
    id: string;
    name: string;
    content: string;
    data: any[];
    fields: string[];
    isValid: boolean;
  };
  
  export type FileStats = {
    name: string;
    rowCount: number;
    avgWordCount: number;
    maxWordCount: number;
    minWordCount: number;
  };
  
  export type FileComparison = {
    file1Name: string;
    file2Name: string;
    data: {
      id: string | number;
      file1Text: string;
      file2Text: string;
      wordsMatch: boolean;
      textsDifferent: boolean;
    }[];
    differentTexts: number;
    sameWords: number;
  };
  
  export type PerplexityScore = {
    name: string;
    avgPerplexity: number;
    scores: {
      id: string | number;
      text: string;
      perplexity: number;
    }[];
    distribution: {
      bucket: number;
      count: number;
    }[];
  };
  
  export type BestText = {
    id: string | number;
    text: string;
    perplexity: number;
    source: string;
  };
  
  export type AnalysisResult = {
    fileStats: FileStats[];
    comparison: FileComparison | null;
    commonIds: number;
    totalUniqueIds: number;
    perplexityScores: PerplexityScore[];
    bestTexts?: BestText[];
  };
