// utils/perplexityUtils.ts

// API endpoint for Python-based perplexity calculation
const API_ENDPOINTS = {
    CALCULATE_PERPLEXITY: "/api/perplexity",
  };
  
  export const calculatePerplexity = async (
    text: string, 
    useRemoteApi: boolean,
    onApiError?: () => void
  ): Promise<number> => {
    if (!useRemoteApi) {
      // Dummy perplexity score based on text characteristics
      const wordCount = text.split(' ').length;
      const uniqueWords = new Set(text.toLowerCase().split(' ')).size;
      const entropy = uniqueWords / wordCount;
      
      // Generate a score between 5 and 30, lower is better
      // Formula designed to make more coherent texts get lower scores
      const score = 5 + 25 * (1 - entropy) * Math.random();
      return score;
    }
    
    try {
      const response = await fetch(API_ENDPOINTS.CALCULATE_PERPLEXITY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.perplexity;
    } catch (error) {
      console.error('Error calculating perplexity:', error);
      if (onApiError) onApiError();
      
      // Fallback to dummy calculation
      return calculatePerplexity(text, false);
    }
  };