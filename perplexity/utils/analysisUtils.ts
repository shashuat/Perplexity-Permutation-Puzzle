// utils/analysisUtils.ts
import _ from "lodash";
import { FileData, AnalysisResult } from "@/types/types";
import { calculatePerplexity } from "./perplexityUtils";

export const analyzeFiles = async (
  selectedFiles: FileData[],
  useRemoteApi: boolean,
  onApiError: () => void
): Promise<AnalysisResult> => {
  // Basic file statistics
  const fileStats = selectedFiles.map(file => {
    const textLengths = file.data.map(row => 
      row.text ? row.text.toString().split(' ').length : 0
    );
    
    return {
      name: file.name,
      rowCount: file.data.length,
      avgWordCount: parseFloat(_.mean(textLengths).toFixed(2)),
      maxWordCount: _.max(textLengths) || 0,
      minWordCount: _.min(textLengths) || 0,
    };
  });
  
  // File comparison if multiple files
  let comparison = null;
  if (selectedFiles.length > 1) {
    const file1 = selectedFiles[0];
    const file2 = selectedFiles[1];
    
    const comparisonData = [];
    
    // Find common IDs between the two files
    const file1Ids = file1.data.map(row => row.id);
    const file2Ids = file2.data.map(row => row.id);
    const commonIds = _.intersection(file1Ids, file2Ids);
    
    for (const id of commonIds) {
      const file1Row = file1.data.find(row => row.id === id);
      const file2Row = file2.data.find(row => row.id === id);
      
      if (file1Row && file2Row) {
        const text1 = file1Row.text?.toString() || '';
        const text2 = file2Row.text?.toString() || '';
        
        const wordsMatch = _.isEqual(
          _.countBy(text1.split(' ')),
          _.countBy(text2.split(' '))
        );
        
        const textsDifferent = text1 !== text2;
        
        comparisonData.push({
          id,
          file1Text: text1,
          file2Text: text2,
          wordsMatch,
          textsDifferent
        });
      }
    }
    
    comparison = {
      file1Name: file1.name,
      file2Name: file2.name,
      data: comparisonData,
      differentTexts: comparisonData.filter(item => item.textsDifferent).length,
      sameWords: comparisonData.filter(item => item.wordsMatch).length
    };
  }
  
  // Calculate perplexity scores for each file
  const perplexityScores = await Promise.all(
    selectedFiles.map(async (file) => {
      const scores = await Promise.all(
        file.data.map(async (row) => {
          const text = row.text?.toString() || '';
          const perplexity = await calculatePerplexity(text, useRemoteApi, onApiError);
          
          return {
            id: row.id,
            text,
            perplexity
          };
        })
      );
      
      // Calculate average perplexity
      const avgPerplexity = _.mean(scores.map(s => s.perplexity));
      
      // Create distribution buckets for histogram
      const perplexityValues = scores.map(s => s.perplexity);
      const min = Math.floor(_.min(perplexityValues) || 0);
      const max = Math.ceil(_.max(perplexityValues) || 30);
      const range = max - min;
      const bucketSize = range / 10; // 10 buckets
      
      const buckets = _.range(min, max + bucketSize, bucketSize);
      const distribution = buckets.map(bucket => ({
        bucket,
        count: perplexityValues.filter(
          p => p >= bucket && p < bucket + bucketSize
        ).length
      }));
      
      return {
        name: file.name,
        avgPerplexity,
        scores,
        distribution
      };
    })
  );
  
  // Find best texts (lowest perplexity) per ID across all files
  const allScores = _.flatten(
    perplexityScores.map(file => 
      file.scores.map(score => ({
        ...score,
        source: file.name
      }))
    )
  );
  
  const uniqueIds = _.uniq(allScores.map(score => score.id));
  
  const bestTexts = uniqueIds.map(id => {
    const scoresForId = allScores.filter(score => score.id === id);
    const bestScore = _.minBy(scoresForId, 'perplexity');
    return bestScore;
  }).filter(Boolean);
  
  // Calculate common IDs across all files
  const allIds = selectedFiles.map(file => 
    file.data.map(row => row.id.toString())
  );
  
  const commonIds = _.intersection(...allIds);
  const totalUniqueIds = _.union(...allIds).length;
  
  // Return analysis result
  return {
    fileStats,
    comparison,
    commonIds: commonIds.length,
    totalUniqueIds,
    perplexityScores,
    bestTexts
  };
};