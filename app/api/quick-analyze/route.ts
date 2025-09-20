/**
 * API Route for Quick Analysis (Static Only)
 * Provides faster analysis using only static methods
 */

import { NextRequest, NextResponse } from 'next/server';
import { StaticComplexityAnalyzer } from '@/lib/static-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

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

    // Run static analysis only
    const analyzer = new StaticComplexityAnalyzer(code);
    const result = analyzer.analyze();

    return NextResponse.json({
      type: 'quick-analysis',
      result,
      metadata: {
        analysisType: 'static-only',
        timestamp: new Date().toISOString(),
        codeLength: code.length,
        linesOfCode: code.split('\n').length
      }
    });

  } catch (error) {
    console.error('Quick analysis error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Quick analysis failed',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'C++ Quick Analysis API',
    version: '1.0.0',
    description: 'Provides fast static analysis of C++ code complexity',
    endpoints: {
      quickAnalyze: {
        method: 'POST',
        description: 'Quick static analysis of C++ code',
        parameters: {
          code: 'string (required) - C++ code to analyze'
        },
        features: [
          'Static complexity analysis',
          'Algorithm pattern detection',
          'Function and loop analysis',
          'Recommendations and warnings',
          'Fast response time'
        ]
      }
    }
  });
}