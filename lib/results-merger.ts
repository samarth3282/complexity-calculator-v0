/**
 * Results Merger
 * Combines static analysis with empirical results for accurate complexity estimation
 */

import { StaticAnalysisResult } from './static-analyzer';
import { EmpiricalAnalysisResult } from './empirical-runner';
import { RegressionAnalysis } from './curve-fitting-engine';

export interface MergedComplexityResult {
  finalComplexity: {
    timeComplexity: string;
    spaceComplexity: string;
    confidence: number;
    bounds: {
      lower: string;
      upper: string;
    };
  };
  analysis: {
    static: StaticAnalysisResult;
    empirical: EmpiricalAnalysisResult;
    regression: RegressionAnalysis;
  };
  agreement: {
    level: 'high' | 'medium' | 'low' | 'conflict';
    explanation: string;
    consensusReached: boolean;
  };
  recommendations: string[];
  warnings: string[];
  caseAnalysis: {
    bestCase: string;
    averageCase: string;
    worstCase: string;
    explanation: string;
  };
  validation: {
    staticValidation: boolean;
    empiricalValidation: boolean;
    crossValidation: boolean;
    overallReliability: number;
  };
}

export class ComplexityResultsMerger {
  private staticResult: StaticAnalysisResult;
  private empiricalResult: EmpiricalAnalysisResult;
  private regressionResult: RegressionAnalysis;

  constructor(
    staticResult: StaticAnalysisResult,
    empiricalResult: EmpiricalAnalysisResult,
    regressionResult: RegressionAnalysis
  ) {
    this.staticResult = staticResult;
    this.empiricalResult = empiricalResult;
    this.regressionResult = regressionResult;
  }

  /**
   * Merge all analysis results into a comprehensive conclusion
   */
  public merge(): MergedComplexityResult {
    const agreement = this.analyzeAgreement();
    const finalComplexity = this.determineFinalComplexity(agreement);
    const caseAnalysis = this.analyzeCases();
    const validation = this.validateResults();
    const recommendations = this.generateRecommendations();
    const warnings = this.generateWarnings();

    return {
      finalComplexity,
      analysis: {
        static: this.staticResult,
        empirical: this.empiricalResult,
        regression: this.regressionResult
      },
      agreement,
      recommendations,
      warnings,
      caseAnalysis,
      validation
    };
  }

  /**
   * Analyze agreement between static and empirical results
   */
  private analyzeAgreement(): MergedComplexityResult['agreement'] {
    const staticComplexity = this.staticResult.overallComplexity.timeComplexity;
    const empiricalComplexity = this.empiricalResult.bestFitComplexity;
    const regressionComplexity = this.regressionResult.bestFit.complexity;

    // Normalize complexity strings for comparison
    const normalizedStatic = this.normalizeComplexity(staticComplexity);
    const normalizedEmpirical = this.normalizeComplexity(empiricalComplexity);
    const normalizedRegression = this.normalizeComplexity(regressionComplexity);

    let level: 'high' | 'medium' | 'low' | 'conflict';
    let explanation: string;
    let consensusReached: boolean;

    // Check for exact matches
    if (normalizedStatic === normalizedEmpirical && normalizedEmpirical === normalizedRegression) {
      level = 'high';
      explanation = 'Perfect agreement between static analysis, empirical testing, and regression analysis.';
      consensusReached = true;
    }
    // Check for partial matches
    else if (normalizedStatic === normalizedEmpirical || normalizedStatic === normalizedRegression || normalizedEmpirical === normalizedRegression) {
      level = 'medium';
      explanation = 'Partial agreement between analyses. Two out of three methods agree.';
      consensusReached = true;
    }
    // Check for compatible complexities (within one order)
    else if (this.areComplexitiesCompatible(normalizedStatic, normalizedEmpirical, normalizedRegression)) {
      level = 'medium';
      explanation = 'Compatible complexity classes detected. Results are within reasonable bounds.';
      consensusReached = true;
    }
    // Check for conflicts
    else if (this.hasSignificantConflict(normalizedStatic, normalizedEmpirical, normalizedRegression)) {
      level = 'conflict';
      explanation = 'Significant disagreement between analyses. Manual review recommended.';
      consensusReached = false;
    }
    else {
      level = 'low';
      explanation = 'Limited agreement between analyses. Results suggest different complexity behaviors.';
      consensusReached = false;
    }

    return { level, explanation, consensusReached };
  }

  /**
   * Normalize complexity strings for comparison
   */
  private normalizeComplexity(complexity: string): string {
    // Remove spaces and convert to standard format
    const normalized = complexity.replace(/\s/g, '').toLowerCase();
    
    // Map variations to standard forms
    const mappings: { [key: string]: string } = {
      'o(1)': 'O(1)',
      'constant': 'O(1)',
      'o(logn)': 'O(log n)',
      'o(log(n))': 'O(log n)',
      'logarithmic': 'O(log n)',
      'o(n)': 'O(n)',
      'linear': 'O(n)',
      'o(nlogn)': 'O(n log n)',
      'o(nlog(n))': 'O(n log n)',
      'linearithmic': 'O(n log n)',
      'o(n²)': 'O(n²)',
      'o(n^2)': 'O(n²)',
      'o(n*n)': 'O(n²)',
      'quadratic': 'O(n²)',
      'o(n³)': 'O(n³)',
      'o(n^3)': 'O(n³)',
      'cubic': 'O(n³)',
      'o(2^n)': 'O(2^n)',
      'o(2**n)': 'O(2^n)',
      'exponential': 'O(2^n)',
      'o(n!)': 'O(n!)',
      'factorial': 'O(n!)'
    };

    return mappings[normalized] || complexity;
  }

  /**
   * Check if complexities are compatible (within reasonable bounds)
   */
  private areComplexitiesCompatible(c1: string, c2: string, c3: string): boolean {
    const complexityOrder = ['O(1)', 'O(log n)', 'O(√n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(2^n)', 'O(n!)'];
    
    const getIndex = (complexity: string): number => {
      const index = complexityOrder.indexOf(complexity);
      return index >= 0 ? index : -1;
    };

    const indices = [getIndex(c1), getIndex(c2), getIndex(c3)].filter(i => i >= 0);
    if (indices.length < 2) return false;

    const maxDiff = Math.max(...indices) - Math.min(...indices);
    return maxDiff <= 2; // Allow up to 2 orders of difference
  }

  /**
   * Check for significant conflicts between analyses
   */
  private hasSignificantConflict(c1: string, c2: string, c3: string): boolean {
    const complexityOrder = ['O(1)', 'O(log n)', 'O(√n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(2^n)', 'O(n!)'];
    
    const getIndex = (complexity: string): number => {
      const index = complexityOrder.indexOf(complexity);
      return index >= 0 ? index : -1;
    };

    const indices = [getIndex(c1), getIndex(c2), getIndex(c3)].filter(i => i >= 0);
    if (indices.length < 2) return false;

    const maxDiff = Math.max(...indices) - Math.min(...indices);
    return maxDiff > 3; // Significant conflict if more than 3 orders apart
  }

  /**
   * Determine the final complexity based on agreement analysis
   */
  private determineFinalComplexity(agreement: MergedComplexityResult['agreement']): MergedComplexityResult['finalComplexity'] {
    let timeComplexity: string;
    let confidence: number;
    let bounds: { lower: string; upper: string };

    const staticComplexity = this.normalizeComplexity(this.staticResult.overallComplexity.timeComplexity);
    const empiricalComplexity = this.normalizeComplexity(this.empiricalResult.bestFitComplexity);
    const regressionComplexity = this.normalizeComplexity(this.regressionResult.bestFit.complexity);

    switch (agreement.level) {
      case 'high':
        timeComplexity = staticComplexity; // All agree, use static as primary
        confidence = Math.min(
          this.staticResult.confidence,
          this.regressionResult.bestFit.confidence,
          0.95
        );
        bounds = { lower: timeComplexity, upper: timeComplexity };
        break;

      case 'medium':
        // Choose the most reliable result based on confidence scores
        const results = [
          { complexity: staticComplexity, confidence: this.staticResult.confidence },
          { complexity: empiricalComplexity, confidence: this.regressionResult.bestFit.confidence },
          { complexity: regressionComplexity, confidence: this.regressionResult.bestFit.confidence }
        ];
        
        results.sort((a, b) => b.confidence - a.confidence);
        timeComplexity = results[0].complexity;
        confidence = results[0].confidence * 0.8; // Reduce confidence due to disagreement
        
        // Set bounds based on the range of results
        const complexities = [staticComplexity, empiricalComplexity, regressionComplexity];
        const sortedComplexities = this.sortComplexitiesByOrder(complexities);
        bounds = { lower: sortedComplexities[0], upper: sortedComplexities[sortedComplexities.length - 1] };
        break;

      case 'low':
        // Use empirical result as it's measured, but with low confidence
        timeComplexity = empiricalComplexity;
        confidence = Math.min(this.regressionResult.bestFit.confidence * 0.6, 0.5);
        
        const allComplexities = [staticComplexity, empiricalComplexity, regressionComplexity];
        const sorted = this.sortComplexitiesByOrder(allComplexities);
        bounds = { lower: sorted[0], upper: sorted[sorted.length - 1] };
        break;

      case 'conflict':
        // In case of conflict, be conservative and report the range
        timeComplexity = `Between ${staticComplexity} and ${empiricalComplexity}`;
        confidence = 0.3; // Very low confidence
        bounds = { 
          lower: this.getLowerBound(staticComplexity, empiricalComplexity),
          upper: this.getUpperBound(staticComplexity, empiricalComplexity)
        };
        break;
    }

    return {
      timeComplexity,
      spaceComplexity: this.staticResult.overallComplexity.spaceComplexity, // Static analysis is more reliable for space
      confidence,
      bounds
    };
  }

  /**
   * Sort complexities by their order
   */
  private sortComplexitiesByOrder(complexities: string[]): string[] {
    const complexityOrder = ['O(1)', 'O(log n)', 'O(√n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(2^n)', 'O(n!)'];
    
    return complexities.sort((a, b) => {
      const indexA = complexityOrder.indexOf(a);
      const indexB = complexityOrder.indexOf(b);
      return (indexA >= 0 ? indexA : 999) - (indexB >= 0 ? indexB : 999);
    });
  }

  private getLowerBound(c1: string, c2: string): string {
    const sorted = this.sortComplexitiesByOrder([c1, c2]);
    return sorted[0];
  }

  private getUpperBound(c1: string, c2: string): string {
    const sorted = this.sortComplexitiesByOrder([c1, c2]);
    return sorted[sorted.length - 1];
  }

  /**
   * Analyze best, average, and worst case complexities
   */
  private analyzeCases(): MergedComplexityResult['caseAnalysis'] {
    // Analyze static results for case variations
    const hasConditionals = this.staticResult.functionAnalysis.some(func => 
      func.complexity.factors.includes('conditional')
    );
    
    const hasRecursion = this.staticResult.functionAnalysis.some(func => func.isRecursive);
    const hasLoops = this.staticResult.loopAnalysis.length > 0;
    
    const algorithmPatterns = this.staticResult.algorithmPatterns;
    const baseComplexity = this.staticResult.overallComplexity.timeComplexity;

    let bestCase: string;
    let averageCase: string;
    let worstCase: string;
    let explanation: string;

    // Detect specific algorithm patterns
    const quickSortPattern = algorithmPatterns.find(p => p.name === 'Quick Sort');
    const insertionSortPattern = algorithmPatterns.find(p => p.name === 'Insertion Sort');
    const binarySearchPattern = algorithmPatterns.find(p => p.name === 'Binary Search');

    if (quickSortPattern) {
      bestCase = 'O(n log n)';
      averageCase = 'O(n log n)';
      worstCase = 'O(n²)';
      explanation = 'Quick Sort: Best and average case when pivot splits array evenly, worst case when pivot is always min/max.';
    } else if (insertionSortPattern) {
      bestCase = 'O(n)';
      averageCase = 'O(n²)';
      worstCase = 'O(n²)';
      explanation = 'Insertion Sort: Best case for already sorted array, quadratic for random/reverse sorted arrays.';
    } else if (binarySearchPattern) {
      bestCase = 'O(1)';
      averageCase = 'O(log n)';
      worstCase = 'O(log n)';
      explanation = 'Binary Search: Best case when target is at middle, logarithmic for other cases.';
    } else if (hasRecursion) {
      const recursiveFunc = this.staticResult.functionAnalysis.find(f => f.isRecursive);
      if (recursiveFunc?.recursionType === 'binary-tree') {
        bestCase = 'O(2^n)';
        averageCase = 'O(2^n)';
        worstCase = 'O(2^n)';
        explanation = 'Binary tree recursion: Exponential complexity in all cases due to overlapping subproblems.';
      } else if (recursiveFunc?.recursionType === 'divide-conquer') {
        bestCase = 'O(n log n)';
        averageCase = 'O(n log n)';
        worstCase = 'O(n log n)';
        explanation = 'Divide and conquer: Consistent logarithmic depth with linear work per level.';
      } else {
        bestCase = baseComplexity;
        averageCase = baseComplexity;
        worstCase = baseComplexity;
        explanation = 'Recursive algorithm: Complexity depends on recursion depth and work per call.';
      }
    } else if (hasConditionals && hasLoops) {
      bestCase = this.reduceComplexity(baseComplexity);
      averageCase = baseComplexity;
      worstCase = this.increaseComplexity(baseComplexity);
      explanation = 'Algorithm with conditionals: Complexity varies based on input characteristics and branch execution.';
    } else {
      bestCase = baseComplexity;
      averageCase = baseComplexity;
      worstCase = baseComplexity;
      explanation = 'Consistent complexity across all cases based on algorithm structure.';
    }

    return { bestCase, averageCase, worstCase, explanation };
  }

  private reduceComplexity(complexity: string): string {
    const reductions: { [key: string]: string } = {
      'O(n²)': 'O(n)',
      'O(n log n)': 'O(n)',
      'O(n³)': 'O(n²)',
      'O(2^n)': 'O(n²)',
      'O(n!)': 'O(2^n)'
    };
    return reductions[complexity] || complexity;
  }

  private increaseComplexity(complexity: string): string {
    const increases: { [key: string]: string } = {
      'O(1)': 'O(log n)',
      'O(log n)': 'O(n)',
      'O(n)': 'O(n log n)',
      'O(n log n)': 'O(n²)',
      'O(n²)': 'O(n³)'
    };
    return increases[complexity] || complexity;
  }

  /**
   * Validate the reliability of results
   */
  private validateResults(): MergedComplexityResult['validation'] {
    const staticValidation = this.validateStaticResults();
    const empiricalValidation = this.validateEmpiricalResults();
    const crossValidation = this.validateCrossConsistency();
    
    const overallReliability = (
      (staticValidation ? 0.4 : 0) +
      (empiricalValidation ? 0.4 : 0) +
      (crossValidation ? 0.2 : 0)
    );

    return {
      staticValidation,
      empiricalValidation,
      crossValidation,
      overallReliability
    };
  }

  private validateStaticResults(): boolean {
    return (
      this.staticResult.confidence > 0.7 &&
      this.staticResult.functionAnalysis.length > 0 &&
      this.staticResult.overallComplexity.timeComplexity !== 'Unknown'
    );
  }

  private validateEmpiricalResults(): boolean {
    return (
      this.empiricalResult.rSquared > 0.5 &&
      this.empiricalResult.dataPoints.length >= 5 &&
      !this.empiricalResult.errorMessage
    );
  }

  private validateCrossConsistency(): boolean {
    const agreement = this.analyzeAgreement();
    return agreement.level === 'high' || agreement.level === 'medium';
  }

  /**
   * Generate comprehensive recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Add static analysis recommendations
    recommendations.push(...this.staticResult.recommendations);

    // Add empirical recommendations
    if (this.empiricalResult.rSquared < 0.7) {
      recommendations.push('Consider running more test iterations to improve empirical confidence.');
    }

    // Add regression recommendations
    recommendations.push(this.regressionResult.recommendation);

    // Add merger-specific recommendations
    const agreement = this.analyzeAgreement();
    
    if (agreement.level === 'conflict') {
      recommendations.push('Significant disagreement detected - verify algorithm implementation and test conditions.');
    }

    if (agreement.level === 'low') {
      recommendations.push('Consider profiling with larger input sizes to better identify complexity behavior.');
    }

    // Add performance recommendations
    const finalComplexity = this.staticResult.overallComplexity.timeComplexity;
    if (finalComplexity.includes('O(n²)') || finalComplexity.includes('O(n³)')) {
      recommendations.push('Consider algorithmic optimizations to reduce polynomial complexity.');
    }

    if (finalComplexity.includes('O(2^n)') || finalComplexity.includes('O(n!)')) {
      recommendations.push('Exponential complexity detected - consider dynamic programming or memoization.');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Generate comprehensive warnings
   */
  private generateWarnings(): string[] {
    const warnings: string[] = [];

    // Add static analysis warnings
    warnings.push(...this.staticResult.warnings);

    // Add empirical warnings
    if (this.empiricalResult.errorMessage) {
      warnings.push(`Empirical analysis error: ${this.empiricalResult.errorMessage}`);
    }

    // Add merger-specific warnings
    const validation = this.validateResults();
    
    if (!validation.staticValidation) {
      warnings.push('Static analysis validation failed - results may be unreliable.');
    }

    if (!validation.empiricalValidation) {
      warnings.push('Empirical analysis validation failed - insufficient or poor quality data.');
    }

    if (validation.overallReliability < 0.5) {
      warnings.push('Low overall reliability - results should be interpreted with caution.');
    }

    const agreement = this.analyzeAgreement();
    if (agreement.level === 'conflict') {
      warnings.push('Conflicting complexity estimates - manual verification recommended.');
    }

    return [...new Set(warnings)]; // Remove duplicates
  }
}