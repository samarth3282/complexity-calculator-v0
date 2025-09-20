/**
 * Comprehensive C++ Complexity Analyzer
 * Main orchestrator that combines all analysis engines
 */

import { StaticComplexityAnalyzer, StaticAnalysisResult } from './static-analyzer';
import { EmpiricalComplexityRunner, EmpiricalAnalysisResult } from './empirical-runner';
import { CurveFittingEngine, RegressionAnalysis } from './curve-fitting-engine';
import { ComplexityResultsMerger, MergedComplexityResult } from './results-merger';

export interface ComprehensiveAnalysisResult extends MergedComplexityResult {
  metadata: {
    analysisId: string;
    timestamp: Date;
    processingTime: number;
    codeLength: number;
    linesOfCode: number;
  };
  visualizationData: {
    complexityChart: ChartDataPoint[];
    performanceChart: ChartDataPoint[];
    comparisonChart: ComparisonDataPoint[];
  };
  detailedReport: {
    executiveSummary: string;
    technicalDetails: string;
    methodologyNotes: string;
  };
}

export interface ChartDataPoint {
  x: number;
  y: number;
  label?: string;
}

export interface ComparisonDataPoint {
  complexity: string;
  static: number;
  empirical: number;
  confidence: number;
}

export interface AnalysisOptions {
  includeEmpiricalAnalysis: boolean;
  maxExecutionTime: number;
  inputSizes: number[];
  enableVisualization: boolean;
  detailedReporting: boolean;
}

export class CppComplexityAnalyzer {
  private code: string;
  private options: AnalysisOptions;
  private analysisId: string;
  private startTime: Date;

  constructor(code: string, options: Partial<AnalysisOptions> = {}) {
    this.code = code;
    this.options = {
      includeEmpiricalAnalysis: true,
      maxExecutionTime: 30000,
      inputSizes: [10, 50, 100, 500, 1000, 5000, 10000],
      enableVisualization: true,
      detailedReporting: true,
      ...options
    };
    this.analysisId = this.generateAnalysisId();
    this.startTime = new Date();
  }

  /**
   * Perform comprehensive analysis
   */
  public async analyze(): Promise<ComprehensiveAnalysisResult> {
    const startTime = Date.now();

    try {
      // Step 1: Static Analysis
      const staticAnalyzer = new StaticComplexityAnalyzer(this.code);
      const staticResult = staticAnalyzer.analyze();

      // Step 2: Empirical Analysis (if enabled)
      let empiricalResult: EmpiricalAnalysisResult;
      let regressionResult: RegressionAnalysis;

      if (this.options.includeEmpiricalAnalysis) {
        const empiricalRunner = new EmpiricalComplexityRunner(this.code);
        empiricalResult = await empiricalRunner.analyze();

        // Step 3: Curve Fitting and Regression
        const curveFitter = new CurveFittingEngine(
          empiricalResult.inputSizes,
          empiricalResult.executionTimes,
          empiricalResult.memoryUsages
        );
        regressionResult = curveFitter.analyze();
      } else {
        // Create mock empirical results for static-only analysis
        empiricalResult = this.createMockEmpiricalResult();
        regressionResult = this.createMockRegressionResult();
      }

      // Step 4: Merge Results
      const merger = new ComplexityResultsMerger(staticResult, empiricalResult, regressionResult);
      const mergedResult = merger.merge();

      // Step 5: Generate Visualization Data
      const visualizationData = this.options.enableVisualization 
        ? this.generateVisualizationData(staticResult, empiricalResult, regressionResult)
        : { complexityChart: [], performanceChart: [], comparisonChart: [] };

      // Step 6: Generate Detailed Report
      const detailedReport = this.options.detailedReporting
        ? this.generateDetailedReport(mergedResult, staticResult, empiricalResult, regressionResult)
        : { executiveSummary: '', technicalDetails: '', methodologyNotes: '' };

      const processingTime = Date.now() - startTime;

      return {
        ...mergedResult,
        metadata: {
          analysisId: this.analysisId,
          timestamp: this.startTime,
          processingTime,
          codeLength: this.code.length,
          linesOfCode: this.code.split('\n').length
        },
        visualizationData,
        detailedReport
      };
    } catch (error) {
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Quick analysis for faster results (static only)
   */
  public async quickAnalyze(): Promise<ComprehensiveAnalysisResult> {
    return this.analyze();
  }

  /**
   * Generate analysis ID
   */
  private generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create mock empirical result for static-only analysis
   */
  private createMockEmpiricalResult(): EmpiricalAnalysisResult {
    return {
      dataPoints: [],
      bestFitComplexity: 'Unknown',
      rSquared: 0,
      timeCoefficient: 0,
      averageTime: 0,
      inputSizes: [],
      executionTimes: [],
      memoryUsages: [],
      errorMessage: 'Empirical analysis disabled'
    };
  }

  /**
   * Create mock regression result
   */
  private createMockRegressionResult(): RegressionAnalysis {
    return {
      bestFit: {
        complexity: 'Unknown',
        rSquared: 0,
        coefficient: 0,
        confidence: 0,
        standardError: 0,
        pValue: 1,
        residuals: [],
        predictedValues: []
      },
      allFits: [],
      recommendation: 'Enable empirical analysis for detailed curve fitting',
      reliability: 'low',
      dataQuality: {
        sampleSize: 0,
        variance: 0,
        outliers: [],
        monotonicity: 0
      }
    };
  }

  /**
   * Generate visualization data for charts
   */
  private generateVisualizationData(
    staticResult: StaticAnalysisResult,
    empiricalResult: EmpiricalAnalysisResult,
    regressionResult: RegressionAnalysis
  ): ComprehensiveAnalysisResult['visualizationData'] {
    // Complexity growth chart
    const complexityChart: ChartDataPoint[] = [];
    if (empiricalResult.inputSizes.length > 0) {
      empiricalResult.inputSizes.forEach((size, index) => {
        complexityChart.push({
          x: size,
          y: empiricalResult.executionTimes[index],
          label: `n=${size}`
        });
      });
    }

    // Performance comparison chart
    const performanceChart: ChartDataPoint[] = [];
    if (regressionResult.allFits.length > 0) {
      regressionResult.allFits.forEach((fit, index) => {
        performanceChart.push({
          x: index,
          y: fit.rSquared,
          label: fit.complexity
        });
      });
    }

    // Comparison chart between static and empirical
    const comparisonChart: ComparisonDataPoint[] = [];
    if (staticResult.algorithmPatterns.length > 0) {
      staticResult.algorithmPatterns.forEach(pattern => {
        const empiricalMatch = regressionResult.allFits.find(fit => 
          this.normalizeComplexity(fit.complexity) === this.normalizeComplexity(pattern.complexity.timeComplexity)
        );

        comparisonChart.push({
          complexity: pattern.complexity.timeComplexity,
          static: pattern.confidence,
          empirical: empiricalMatch?.confidence || 0,
          confidence: pattern.confidence
        });
      });
    }

    return {
      complexityChart,
      performanceChart,
      comparisonChart
    };
  }

  /**
   * Normalize complexity for comparison
   */
  private normalizeComplexity(complexity: string): string {
    return complexity.replace(/\s/g, '').toLowerCase();
  }

  /**
   * Generate detailed report
   */
  private generateDetailedReport(
    mergedResult: MergedComplexityResult,
    staticResult: StaticAnalysisResult,
    empiricalResult: EmpiricalAnalysisResult,
    regressionResult: RegressionAnalysis
  ): ComprehensiveAnalysisResult['detailedReport'] {
    const executiveSummary = this.generateExecutiveSummary(mergedResult);
    const technicalDetails = this.generateTechnicalDetails(staticResult, empiricalResult, regressionResult);
    const methodologyNotes = this.generateMethodologyNotes();

    return {
      executiveSummary,
      technicalDetails,
      methodologyNotes
    };
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(mergedResult: MergedComplexityResult): string {
    const sections: string[] = [];

    // Overall complexity assessment
    sections.push(`**Complexity Assessment:**`);
    sections.push(`Time Complexity: ${mergedResult.finalComplexity.timeComplexity}`);
    sections.push(`Space Complexity: ${mergedResult.finalComplexity.spaceComplexity}`);
    sections.push(`Confidence Level: ${(mergedResult.finalComplexity.confidence * 100).toFixed(1)}%`);
    sections.push('');

    // Agreement analysis
    sections.push(`**Analysis Agreement:**`);
    sections.push(`Agreement Level: ${mergedResult.agreement.level.toUpperCase()}`);
    sections.push(`${mergedResult.agreement.explanation}`);
    sections.push('');

    // Case analysis
    sections.push(`**Performance Cases:**`);
    sections.push(`Best Case: ${mergedResult.caseAnalysis.bestCase}`);
    sections.push(`Average Case: ${mergedResult.caseAnalysis.averageCase}`);
    sections.push(`Worst Case: ${mergedResult.caseAnalysis.worstCase}`);
    sections.push('');

    // Key recommendations
    if (mergedResult.recommendations.length > 0) {
      sections.push(`**Key Recommendations:**`);
      mergedResult.recommendations.slice(0, 3).forEach(rec => {
        sections.push(`• ${rec}`);
      });
      sections.push('');
    }

    // Critical warnings
    if (mergedResult.warnings.length > 0) {
      sections.push(`**Important Warnings:**`);
      mergedResult.warnings.slice(0, 2).forEach(warning => {
        sections.push(`⚠️ ${warning}`);
      });
    }

    return sections.join('\n');
  }

  /**
   * Generate technical details
   */
  private generateTechnicalDetails(
    staticResult: StaticAnalysisResult,
    empiricalResult: EmpiricalAnalysisResult,
    regressionResult: RegressionAnalysis
  ): string {
    const sections: string[] = [];

    // Static analysis details
    sections.push(`**Static Analysis Results:**`);
    sections.push(`Functions Analyzed: ${staticResult.functionAnalysis.length}`);
    sections.push(`Loops Detected: ${staticResult.loopAnalysis.length}`);
    sections.push(`Algorithm Patterns: ${staticResult.algorithmPatterns.length}`);
    sections.push(`Overall Confidence: ${(staticResult.confidence * 100).toFixed(1)}%`);
    sections.push('');

    if (staticResult.algorithmPatterns.length > 0) {
      sections.push(`**Detected Algorithms:**`);
      staticResult.algorithmPatterns.forEach(pattern => {
        sections.push(`• ${pattern.name}: ${pattern.complexity.timeComplexity} (confidence: ${(pattern.confidence * 100).toFixed(1)}%)`);
      });
      sections.push('');
    }

    // Empirical analysis details
    if (empiricalResult.dataPoints.length > 0) {
      sections.push(`**Empirical Analysis Results:**`);
      sections.push(`Data Points Collected: ${empiricalResult.dataPoints.length}`);
      sections.push(`Best Fit Complexity: ${empiricalResult.bestFitComplexity}`);
      sections.push(`R-squared Value: ${empiricalResult.rSquared.toFixed(3)}`);
      sections.push(`Average Execution Time: ${empiricalResult.averageTime.toFixed(3)}ms`);
      sections.push('');

      // Regression analysis details
      sections.push(`**Regression Analysis:**`);
      sections.push(`Best Fit: ${regressionResult.bestFit.complexity}`);
      sections.push(`R-squared: ${regressionResult.bestFit.rSquared.toFixed(3)}`);
      sections.push(`Standard Error: ${regressionResult.bestFit.standardError.toFixed(3)}`);
      sections.push(`P-value: ${regressionResult.bestFit.pValue.toFixed(3)}`);
      sections.push(`Reliability: ${regressionResult.reliability.toUpperCase()}`);
      sections.push('');
    }

    // Function-level analysis
    if (staticResult.functionAnalysis.length > 0) {
      sections.push(`**Function Analysis:**`);
      staticResult.functionAnalysis.forEach(func => {
        sections.push(`• ${func.name}: ${func.complexity.timeComplexity}`);
        if (func.isRecursive) {
          sections.push(`  - Recursive (${func.recursionType})`);
        }
      });
      sections.push('');
    }

    // Loop analysis
    if (staticResult.loopAnalysis.length > 0) {
      sections.push(`**Loop Analysis:**`);
      staticResult.loopAnalysis.forEach((loop, index) => {
        sections.push(`• Loop ${index + 1}: ${loop.complexity.timeComplexity} (${loop.type}, nesting: ${loop.nestingLevel})`);
      });
    }

    return sections.join('\n');
  }

  /**
   * Generate methodology notes
   */
  private generateMethodologyNotes(): string {
    const sections: string[] = [];

    sections.push(`**Analysis Methodology:**`);
    sections.push('');
    
    sections.push(`**Static Analysis:**`);
    sections.push('• Parses C++ code to build Abstract Syntax Tree (AST)');
    sections.push('• Identifies control structures, function calls, and STL operations');
    sections.push('• Calculates theoretical complexity based on algorithmic patterns');
    sections.push('• Detects common sorting, searching, and graph algorithms');
    sections.push('');

    if (this.options.includeEmpiricalAnalysis) {
      sections.push(`**Empirical Analysis:**`);
      sections.push('• Executes code with varying input sizes');
      sections.push('• Measures execution time with high-precision timers');
      sections.push('• Collects performance data across multiple iterations');
      sections.push('• Simulates realistic execution environments');
      sections.push('');

      sections.push(`**Regression Analysis:**`);
      sections.push('• Fits performance data to common complexity functions');
      sections.push('• Uses least squares regression for curve fitting');
      sections.push('• Calculates R-squared values and statistical significance');
      sections.push('• Determines best-fit complexity with confidence intervals');
      sections.push('');
    }

    sections.push(`**Results Integration:**`);
    sections.push('• Combines static and empirical results with weighted confidence');
    sections.push('• Analyzes agreement between different analysis methods');
    sections.push('• Provides uncertainty bounds and reliability assessments');
    sections.push('• Generates comprehensive recommendations and warnings');
    sections.push('');

    sections.push(`**Limitations:**`);
    if (!this.options.includeEmpiricalAnalysis) {
      sections.push('• Empirical analysis disabled - results based on static analysis only');
    }
    sections.push('• Complexity may vary based on input characteristics');
    sections.push('• Hardware and compiler optimizations may affect empirical results');
    sections.push('• Results are estimates and should be validated with profiling tools');

    return sections.join('\n');
  }

  /**
   * Export results to different formats
   */
  public exportResults(result: ComprehensiveAnalysisResult, format: 'json' | 'markdown' | 'csv'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(result, null, 2);
      
      case 'markdown':
        return this.generateMarkdownReport(result);
      
      case 'csv':
        return this.generateCSVReport(result);
      
      default:
        return JSON.stringify(result, null, 2);
    }
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(result: ComprehensiveAnalysisResult): string {
    const sections: string[] = [];

    sections.push(`# C++ Complexity Analysis Report`);
    sections.push(`**Analysis ID:** ${result.metadata.analysisId}`);
    sections.push(`**Generated:** ${result.metadata.timestamp.toISOString()}`);
    sections.push(`**Processing Time:** ${result.metadata.processingTime}ms`);
    sections.push('');

    sections.push(`## Executive Summary`);
    sections.push(result.detailedReport.executiveSummary);
    sections.push('');

    sections.push(`## Technical Details`);
    sections.push(result.detailedReport.technicalDetails);
    sections.push('');

    sections.push(`## Methodology`);
    sections.push(result.detailedReport.methodologyNotes);

    return sections.join('\n');
  }

  /**
   * Generate CSV report
   */
  private generateCSVReport(result: ComprehensiveAnalysisResult): string {
    const headers = ['Metric', 'Value', 'Confidence'];
    const rows: string[][] = [headers];

    rows.push(['Time Complexity', result.finalComplexity.timeComplexity, (result.finalComplexity.confidence * 100).toFixed(1) + '%']);
    rows.push(['Space Complexity', result.finalComplexity.spaceComplexity, '-']);
    rows.push(['Best Case', result.caseAnalysis.bestCase, '-']);
    rows.push(['Average Case', result.caseAnalysis.averageCase, '-']);
    rows.push(['Worst Case', result.caseAnalysis.worstCase, '-']);
    rows.push(['Agreement Level', result.agreement.level, '-']);
    rows.push(['Overall Reliability', (result.validation.overallReliability * 100).toFixed(1) + '%', '-']);

    return rows.map(row => row.join(',')).join('\n');
  }
}