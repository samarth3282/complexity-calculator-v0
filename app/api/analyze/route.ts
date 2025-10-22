/**
 * API Route for C++ Complexity Analysis
 * Handles requests for comprehensive complexity analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { CppComplexityAnalyzer, AnalysisOptions } from '@/lib/cpp-complexity-analyzer';
import { performAuxiliaryAnalysis, integrateAuxiliaryResults } from '@/lib/enhanced-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, options } = body;

    // Validate input
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing code parameter' },
        { status: 400 }
      );
    }

    if (code.trim().length === 0) {
      return NextResponse.json(
        { error: 'Code cannot be empty' },
        { status: 400 }
      );
    }

    if (code.length > 50000) {
      return NextResponse.json(
        { error: 'Code is too large (max 50,000 characters)' },
        { status: 400 }
      );
    }

    // Parse options
    const analysisOptions: AnalysisOptions = {
      includeEmpiricalAnalysis: options?.includeEmpiricalAnalysis ?? true,
      maxExecutionTime: Math.min(options?.maxExecutionTime ?? 30000, 60000), // Max 60 seconds
      inputSizes: options?.inputSizes ?? [10, 50, 100, 500, 1000, 5000, 10000],
      enableVisualization: options?.enableVisualization ?? true,
      detailedReporting: options?.detailedReporting ?? true,
    };

    // Create analyzer and run analysis
    const analyzer = new CppComplexityAnalyzer(code, analysisOptions);
    const result = await analyzer.analyze();

    // Perform auxiliary verification for enhanced accuracy
    const auxiliaryResult = await performAuxiliaryAnalysis(code);
    
    // Integrate results seamlessly
    const finalResult = integrateAuxiliaryResults(result, auxiliaryResult);

    return NextResponse.json(finalResult);

  } catch (error) {
    console.error('Analysis error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Analysis failed',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'C++ Complexity Analyzer API',
    version: '1.0.0',
    endpoints: {
      analyze: {
        method: 'POST',
        description: 'Analyze C++ code complexity',
        parameters: {
          code: 'string (required) - C++ code to analyze',
          options: {
            includeEmpiricalAnalysis: 'boolean (optional) - Enable empirical testing',
            maxExecutionTime: 'number (optional) - Max execution time in ms',
            inputSizes: 'number[] (optional) - Input sizes for testing',
            enableVisualization: 'boolean (optional) - Generate chart data',
            detailedReporting: 'boolean (optional) - Include detailed reports'
          }
        }
      }
    },
    examples: {
      basicRequest: {
        code: `
#include <iostream>
#include <vector>
#include <algorithm>

void bubbleSort(std::vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n-1; i++) {
        for (int j = 0; j < n-i-1; j++) {
            if (arr[j] > arr[j+1]) {
                std::swap(arr[j], arr[j+1]);
            }
        }
    }
}
        `,
        options: {
          includeEmpiricalAnalysis: true,
          enableVisualization: true
        }
      }
    }
  });
}