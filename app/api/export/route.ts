/**
 * API Route for Exporting Analysis Results
 * Provides different export formats for analysis results
 */

import { NextRequest, NextResponse } from 'next/server';
import { CppComplexityAnalyzer } from '@/lib/cpp-complexity-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, format, options } = body;

    // Validate input
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing code parameter' },
        { status: 400 }
      );
    }

    const validFormats = ['json', 'markdown', 'csv'];
    const exportFormat = format || 'json';
    
    if (!validFormats.includes(exportFormat)) {
      return NextResponse.json(
        { error: `Invalid format. Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      );
    }

    // Run analysis
    const analyzer = new CppComplexityAnalyzer(code, options);
    const result = await analyzer.analyze();

    // Export in requested format
    const exportedData = analyzer.exportResults(result, exportFormat as 'json' | 'markdown' | 'csv');

    // Set appropriate content type
    let contentType = 'application/json';
    let filename = `complexity-analysis-${result.metadata.analysisId}`;
    
    switch (exportFormat) {
      case 'markdown':
        contentType = 'text/markdown';
        filename += '.md';
        break;
      case 'csv':
        contentType = 'text/csv';
        filename += '.csv';
        break;
      default:
        contentType = 'application/json';
        filename += '.json';
    }

    return new NextResponse(exportedData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Export failed',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'C++ Complexity Analysis Export API',
    version: '1.0.0',
    description: 'Export analysis results in different formats',
    supportedFormats: [
      {
        format: 'json',
        description: 'Complete analysis results in JSON format',
        contentType: 'application/json'
      },
      {
        format: 'markdown',
        description: 'Human-readable report in Markdown format',
        contentType: 'text/markdown'
      },
      {
        format: 'csv',
        description: 'Key metrics in CSV format for spreadsheet analysis',
        contentType: 'text/csv'
      }
    ],
    example: {
      request: {
        code: '// Your C++ code here',
        format: 'markdown',
        options: {
          includeEmpiricalAnalysis: true,
          enableVisualization: true
        }
      }
    }
  });
}