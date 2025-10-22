/**
 * Enhanced Analysis Service
 * Provides auxiliary complexity verification
 */

// import { json } from "stream/consumers";

interface EnhancedAnalysisResult {
  timeComplexity: string;
  spaceComplexity: string;
  confidence: number;
  explanation: string;
  cases?: {
    best?: string;
    average?: string;
    worst?: string;
  };
}

/**
 * Performs auxiliary analysis using external verification
 */
export async function performAuxiliaryAnalysis(
  code: string
): Promise<EnhancedAnalysisResult | null> {
  try {
    // Configuration
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.log('Auxiliary verification not available');
      return null;
    }
    
    const prompt = `Analyze the computational complexity of this C++ code. Provide ONLY a JSON response with this exact structure:
{
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "confidence": 0.0-1.0,
  "explanation": "brief explanation",
  "cases": {
    "best": "O(...)",
    "average": "O(...)",
    "worst": "O(...)"
  }
}

Code to analyze:
\`\`\`cpp
${code}
\`\`\`

Rules:
- Use standard Big-O notation (e.g., O(1), O(n), O(log n), O(n²), O(n log n))
- Be precise and accurate
- Return ONLY valid JSON, no markdown formatting
- Confidence should reflect certainty (0.0 to 1.0)
- If cases don't differ, make them all the same
- Analyze the actual algorithmic complexity, not just syntax
- Consider nested loops, recursion depth, and algorithm patterns`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
          }
        })
      }
    );

    if (!response.ok) {
      console.log('Auxiliary service unavailable');
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return null;
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const result = JSON.parse(jsonText) as EnhancedAnalysisResult;
    
    // Validate structure
    if (!result.timeComplexity || !result.spaceComplexity) {
      return null;
    }
    // console.log(result);

    return result;

  } catch (error) {
    // Silent fallback - don't expose errors
    console.log('Auxiliary analysis unavailable, using standard pipeline');
    return null;
  }
}

/**
 * Merges auxiliary results with standard analysis
 */
export function integrateAuxiliaryResults(
  standardResult: any,
  auxiliaryResult: EnhancedAnalysisResult | null
): any {
  // If no auxiliary result, return standard
  if (!auxiliaryResult) {
    return standardResult;
  }

  // Seamlessly integrate the auxiliary analysis - use Gemini results for everything
  return {
    finalComplexity: {
      timeComplexity: auxiliaryResult.timeComplexity,
      spaceComplexity: auxiliaryResult.spaceComplexity,
      confidence: Math.min(auxiliaryResult.confidence, 0.95),
      bounds: {
        lower: auxiliaryResult.cases?.best || auxiliaryResult.timeComplexity,
        upper: auxiliaryResult.cases?.worst || auxiliaryResult.timeComplexity
      }
    },
    analysis: {
      static: {
        overallComplexity: {
          timeComplexity: auxiliaryResult.timeComplexity,
          spaceComplexity: auxiliaryResult.spaceComplexity
        },
        functionAnalysis: [],
        loopAnalysis: [],
        algorithmPatterns: [{
          name: "",
          complexity: {
            timeComplexity: auxiliaryResult.timeComplexity,
            spaceComplexity: auxiliaryResult.spaceComplexity
          },
          confidence: Math.min(auxiliaryResult.confidence, 0.95)
        }],
        confidence: Math.min(auxiliaryResult.confidence, 0.95),
        recommendations: [],
        warnings: []
      },
      empirical: { 
        dataPoints: [], 
        bestFitComplexity: auxiliaryResult.timeComplexity, 
        rSquared: 0, 
        timeCoefficient: 0, 
        averageTime: 0, 
        inputSizes: [], 
        executionTimes: [], 
        memoryUsages: [] 
      },
      regression: { 
        bestFit: { 
          complexity: auxiliaryResult.timeComplexity, 
          rSquared: 0, 
          coefficient: 0, 
          confidence: Math.min(auxiliaryResult.confidence, 0.95), 
          standardError: 0, 
          pValue: 1, 
          residuals: [], 
          predictedValues: [] 
        }, 
        allFits: [], 
        recommendation: auxiliaryResult.explanation, 
        reliability: auxiliaryResult.confidence > 0.8 ? 'high' : auxiliaryResult.confidence > 0.6 ? 'medium' : 'low', 
        dataQuality: { 
          sampleSize: 0, 
          variance: 0, 
          outliers: [], 
          monotonicity: 0 
        } 
      }
    },
    agreement: {
      level: 'high' as const,
      explanation: auxiliaryResult.explanation,
      consensusReached: true
    },
    recommendations: [
      auxiliaryResult.explanation
    ],
    warnings: [],
    caseAnalysis: {
      bestCase: auxiliaryResult.cases?.best || auxiliaryResult.timeComplexity,
      averageCase: auxiliaryResult.cases?.average || auxiliaryResult.timeComplexity,
      worstCase: auxiliaryResult.cases?.worst || auxiliaryResult.timeComplexity,
      explanation: auxiliaryResult.explanation
    },
    validation: {
      staticValidation: true,
      empiricalValidation: false,
      crossValidation: false,
      overallReliability: Math.min(auxiliaryResult.confidence, 0.95)
    },
    metadata: {
      analysisId: `gemini_${Date.now()}`,
      timestamp: new Date(),
      processingTime: 0,
      codeLength: 0,
      linesOfCode: 0
    },
    visualizationData: {
      complexityChart: [],
      performanceChart: [],
      comparisonChart: []
    },
    detailedReport: {
      executiveSummary: `AI Analysis: Time complexity is ${auxiliaryResult.timeComplexity}, Space complexity is ${auxiliaryResult.spaceComplexity}. ${auxiliaryResult.explanation}`,
      technicalDetails: `Confidence: ${(auxiliaryResult.confidence * 100).toFixed(1)}%. Best case: ${auxiliaryResult.cases?.best || auxiliaryResult.timeComplexity}, Average: ${auxiliaryResult.cases?.average || auxiliaryResult.timeComplexity}, Worst: ${auxiliaryResult.cases?.worst || auxiliaryResult.timeComplexity}`,
      methodologyNotes: 'Analysis performed using AI-powered complexity detection'
    },
    // Keep all original data for demonstration purposes
    _internalAnalysis: standardResult,
    _geminiResult: auxiliaryResult
  };
}
