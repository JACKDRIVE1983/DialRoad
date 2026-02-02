import { useMemo } from 'react';
import centersData from '@/data/centri_dialisi.json';

interface CenterWithAI {
  id: string;
  ai_responses?: string[];
}

// Create a lookup map for AI responses by center ID
const aiResponsesMap = new Map<string, string[]>();

// Initialize the map from JSON data
(centersData as CenterWithAI[]).forEach(center => {
  if (center.id && center.ai_responses && center.ai_responses.length > 0) {
    aiResponsesMap.set(center.id, center.ai_responses);
  }
});

console.log(`[useAIResponses] Loaded AI responses for ${aiResponsesMap.size} centers`);

/**
 * Hook to get AI responses for a specific center
 * Returns the responses array from the JSON file
 */
export function useAIResponses(centerId: string): string[] {
  return useMemo(() => {
    const responses = aiResponsesMap.get(centerId) || [];
    console.log(`[useAIResponses] Center ${centerId}: ${responses.length} responses`);
    return responses;
  }, [centerId]);
}

/**
 * Get AI responses synchronously (for non-hook usage)
 */
export function getAIResponses(centerId: string): string[] {
  return aiResponsesMap.get(centerId) || [];
}
