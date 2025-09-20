/**
 * Curve Fitting Engine
 * Advanced regression analysis for complexity determination
 */

export interface CurveFitResult {
  complexity: string;
  rSquared: number;
  coefficient: number;
  confidence: number;
  standardError: number;
  pValue: number;
  residuals: number[];
  predictedValues: number[];
}

export interface RegressionAnalysis {
  bestFit: CurveFitResult;
  allFits: CurveFitResult[];
  recommendation: string;
  reliability: 'high' | 'medium' | 'low';
  dataQuality: {
    sampleSize: number;
    variance: number;
    outliers: number[];
    monotonicity: number;
  };
}

export class CurveFittingEngine {
  private inputSizes: number[];
  private executionTimes: number[];
  private memoryUsages: number[];

  constructor(inputSizes: number[], executionTimes: number[], memoryUsages: number[] = []) {
    this.inputSizes = inputSizes;
    this.executionTimes = executionTimes;
    this.memoryUsages = memoryUsages;
  }

  /**
   * Perform comprehensive regression analysis
   */
  public analyze(): RegressionAnalysis {
    // Validate data quality
    const dataQuality = this.assessDataQuality();
    
    // Test all complexity functions
    const allFits = this.fitAllComplexities();
    
    // Find the best fit
    const bestFit = this.selectBestFit(allFits);
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(bestFit, dataQuality);
    
    // Determine reliability
    const reliability = this.assessReliability(bestFit, dataQuality);

    return {
      bestFit,
      allFits,
      recommendation,
      reliability,
      dataQuality
    };
  }

  /**
   * Assess the quality of input data
   */
  private assessDataQuality(): RegressionAnalysis['dataQuality'] {
    const sampleSize = this.inputSizes.length;
    const variance = this.calculateVariance(this.executionTimes);
    const outliers = this.detectOutliers(this.executionTimes);
    const monotonicity = this.calculateMonotonicity();

    return {
      sampleSize,
      variance,
      outliers,
      monotonicity
    };
  }

  /**
   * Calculate variance of execution times
   */
  private calculateVariance(data: number[]): number {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
  }

  /**
   * Detect outliers using IQR method
   */
  private detectOutliers(data: number[]): number[] {
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = this.percentile(sorted, 25);
    const q3 = this.percentile(sorted, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return data.map((val, index) => 
      val < lowerBound || val > upperBound ? index : -1
    ).filter(index => index !== -1);
  }

  /**
   * Calculate percentile of sorted array
   */
  private percentile(sorted: number[], p: number): number {
    const index = (p / 100) * (sorted.length - 1);
    if (Math.floor(index) === index) {
      return sorted[index];
    } else {
      const lower = sorted[Math.floor(index)];
      const upper = sorted[Math.ceil(index)];
      return lower + (upper - lower) * (index - Math.floor(index));
    }
  }

  /**
   * Calculate monotonicity (how much the data increases)
   */
  private calculateMonotonicity(): number {
    let increasingCount = 0;
    for (let i = 1; i < this.executionTimes.length; i++) {
      if (this.executionTimes[i] >= this.executionTimes[i - 1]) {
        increasingCount++;
      }
    }
    return increasingCount / (this.executionTimes.length - 1);
  }

  /**
   * Fit all common complexity functions
   */
  private fitAllComplexities(): CurveFitResult[] {
    const complexityFunctions = [
      { name: 'O(1)', func: (n: number) => 1 },
      { name: 'O(log n)', func: (n: number) => Math.log2(n) },
      { name: 'O(√n)', func: (n: number) => Math.sqrt(n) },
      { name: 'O(n)', func: (n: number) => n },
      { name: 'O(n log n)', func: (n: number) => n * Math.log2(n) },
      { name: 'O(n√n)', func: (n: number) => n * Math.sqrt(n) },
      { name: 'O(n²)', func: (n: number) => n * n },
      { name: 'O(n² log n)', func: (n: number) => n * n * Math.log2(n) },
      { name: 'O(n³)', func: (n: number) => n * n * n },
      { name: 'O(2^n)', func: (n: number) => Math.pow(2, Math.min(n, 30)) },
      { name: 'O(n!)', func: (n: number) => this.factorial(Math.min(n, 10)) }
    ];

    return complexityFunctions.map(cf => this.fitComplexity(cf.name, cf.func));
  }

  /**
   * Fit a specific complexity function
   */
  private fitComplexity(name: string, complexityFunc: (n: number) => number): CurveFitResult {
    const predictedComplexity = this.inputSizes.map(complexityFunc);
    
    // Handle edge cases
    if (predictedComplexity.some(val => !isFinite(val) || isNaN(val))) {
      return {
        complexity: name,
        rSquared: 0,
        coefficient: 0,
        confidence: 0,
        standardError: Infinity,
        pValue: 1,
        residuals: [],
        predictedValues: []
      };
    }

    // Linear regression: y = a * f(x)
    const regression = this.performLinearRegression(this.executionTimes, predictedComplexity);
    
    // Calculate statistical measures
    const predictedValues = predictedComplexity.map(x => regression.coefficient * x);
    const residuals = this.executionTimes.map((y, i) => y - predictedValues[i]);
    const standardError = this.calculateStandardError(residuals, this.inputSizes.length - 1);
    const pValue = this.calculatePValue(regression.rSquared, this.inputSizes.length);
    const confidence = this.calculateConfidence(regression.rSquared, standardError, this.inputSizes.length);

    return {
      complexity: name,
      rSquared: regression.rSquared,
      coefficient: regression.coefficient,
      confidence,
      standardError,
      pValue,
      residuals,
      predictedValues
    };
  }

  /**
   * Perform linear regression
   */
  private performLinearRegression(y: number[], x: number[]): { coefficient: number; rSquared: number } {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    // Calculate coefficient (slope)
    const coefficient = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Calculate R-squared
    const meanY = sumY / n;
    const totalSumSquares = y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
    
    const predictedValues = x.map(xVal => coefficient * xVal);
    const residualSumSquares = y.reduce((sum, yVal, i) => 
      sum + Math.pow(yVal - predictedValues[i], 2), 0);
    
    const rSquared = totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;

    return {
      coefficient: isFinite(coefficient) ? coefficient : 0,
      rSquared: Math.max(0, Math.min(1, rSquared))
    };
  }

  /**
   * Calculate standard error
   */
  private calculateStandardError(residuals: number[], degreesOfFreedom: number): number {
    const sumSquaredResiduals = residuals.reduce((sum, res) => sum + res * res, 0);
    return Math.sqrt(sumSquaredResiduals / degreesOfFreedom);
  }

  /**
   * Calculate p-value approximation
   */
  private calculatePValue(rSquared: number, n: number): number {
    if (n <= 2) return 1;
    
    const fStatistic = (rSquared / (1 - rSquared)) * (n - 2);
    
    // Simplified p-value approximation
    if (fStatistic > 10) return 0.001;
    if (fStatistic > 5) return 0.01;
    if (fStatistic > 2) return 0.05;
    if (fStatistic > 1) return 0.1;
    return 0.5;
  }

  /**
   * Calculate confidence based on statistical measures
   */
  private calculateConfidence(rSquared: number, standardError: number, sampleSize: number): number {
    let confidence = rSquared; // Base confidence from R-squared
    
    // Adjust for sample size
    if (sampleSize < 5) {
      confidence *= 0.5;
    } else if (sampleSize < 10) {
      confidence *= 0.7;
    } else if (sampleSize >= 15) {
      confidence *= 1.1;
    }
    
    // Adjust for standard error
    if (standardError > 1000) {
      confidence *= 0.5;
    } else if (standardError > 100) {
      confidence *= 0.7;
    } else if (standardError < 10) {
      confidence *= 1.1;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Select the best fitting complexity
   */
  private selectBestFit(fits: CurveFitResult[]): CurveFitResult {
    // Filter out invalid fits
    const validFits = fits.filter(fit => 
      isFinite(fit.rSquared) && 
      isFinite(fit.coefficient) && 
      fit.rSquared > 0
    );

    if (validFits.length === 0) {
      return fits[0]; // Return first fit as fallback
    }

    // Sort by a composite score considering R-squared, confidence, and simplicity
    validFits.sort((a, b) => {
      const scoreA = this.calculateCompositeScore(a);
      const scoreB = this.calculateCompositeScore(b);
      return scoreB - scoreA;
    });

    return validFits[0];
  }

  /**
   * Calculate composite score for fit selection
   */
  private calculateCompositeScore(fit: CurveFitResult): number {
    // Weighted score considering multiple factors
    const rSquaredWeight = 0.4;
    const confidenceWeight = 0.3;
    const simplicityWeight = 0.2;
    const pValueWeight = 0.1;

    // Simplicity score (simpler complexities get higher scores)
    const simplicityOrder = ['O(1)', 'O(log n)', 'O(√n)', 'O(n)', 'O(n log n)', 'O(n√n)', 'O(n²)', 'O(n² log n)', 'O(n³)', 'O(2^n)', 'O(n!)'];
    const simplicityIndex = simplicityOrder.indexOf(fit.complexity);
    const simplicityScore = simplicityIndex >= 0 ? (simplicityOrder.length - simplicityIndex) / simplicityOrder.length : 0;

    // P-value score (lower p-value is better, so we use 1 - pValue)
    const pValueScore = Math.max(0, 1 - fit.pValue);

    return (
      rSquaredWeight * fit.rSquared +
      confidenceWeight * fit.confidence +
      simplicityWeight * simplicityScore +
      pValueWeight * pValueScore
    );
  }

  /**
   * Generate recommendation based on analysis
   */
  private generateRecommendation(bestFit: CurveFitResult, dataQuality: RegressionAnalysis['dataQuality']): string {
    const recommendations: string[] = [];

    // R-squared recommendations
    if (bestFit.rSquared > 0.9) {
      recommendations.push(`Excellent fit (R² = ${bestFit.rSquared.toFixed(3)}) - high confidence in ${bestFit.complexity} complexity.`);
    } else if (bestFit.rSquared > 0.7) {
      recommendations.push(`Good fit (R² = ${bestFit.rSquared.toFixed(3)}) - ${bestFit.complexity} complexity is likely.`);
    } else if (bestFit.rSquared > 0.5) {
      recommendations.push(`Moderate fit (R² = ${bestFit.rSquared.toFixed(3)}) - ${bestFit.complexity} complexity suggested but consider more testing.`);
    } else {
      recommendations.push(`Poor fit (R² = ${bestFit.rSquared.toFixed(3)}) - complexity unclear, more data needed.`);
    }

    // Sample size recommendations
    if (dataQuality.sampleSize < 5) {
      recommendations.push('Small sample size - collect more data points for better accuracy.');
    } else if (dataQuality.sampleSize < 10) {
      recommendations.push('Consider collecting additional data points to improve confidence.');
    }

    // Variance recommendations
    if (dataQuality.variance > 1000000) {
      recommendations.push('High variance in measurements - consider running more iterations per test.');
    }

    // Outlier recommendations
    if (dataQuality.outliers.length > 0) {
      recommendations.push(`${dataQuality.outliers.length} outlier(s) detected - verify test conditions.`);
    }

    // Monotonicity recommendations
    if (dataQuality.monotonicity < 0.7) {
      recommendations.push('Non-monotonic behavior detected - check for measurement errors or algorithm variations.');
    }

    return recommendations.join(' ');
  }

  /**
   * Assess overall reliability
   */
  private assessReliability(bestFit: CurveFitResult, dataQuality: RegressionAnalysis['dataQuality']): 'high' | 'medium' | 'low' {
    let score = 0;

    // R-squared contribution
    if (bestFit.rSquared > 0.9) score += 3;
    else if (bestFit.rSquared > 0.7) score += 2;
    else if (bestFit.rSquared > 0.5) score += 1;

    // Sample size contribution
    if (dataQuality.sampleSize >= 10) score += 2;
    else if (dataQuality.sampleSize >= 5) score += 1;

    // Monotonicity contribution
    if (dataQuality.monotonicity > 0.8) score += 2;
    else if (dataQuality.monotonicity > 0.6) score += 1;

    // Outlier penalty
    if (dataQuality.outliers.length === 0) score += 1;
    else if (dataQuality.outliers.length > dataQuality.sampleSize * 0.2) score -= 1;

    // P-value contribution
    if (bestFit.pValue < 0.01) score += 2;
    else if (bestFit.pValue < 0.05) score += 1;

    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  /**
   * Calculate factorial (with limits to prevent overflow)
   */
  private factorial(n: number): number {
    if (n <= 1) return 1;
    if (n > 10) return Infinity; // Prevent overflow
    
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  /**
   * Additional analysis methods
   */
  
  /**
   * Detect if the algorithm has different complexity behaviors
   */
  public detectComplexityChanges(): {
    hasChange: boolean;
    changePoint?: number;
    beforeComplexity?: string;
    afterComplexity?: string;
  } {
    if (this.inputSizes.length < 6) {
      return { hasChange: false };
    }

    const midPoint = Math.floor(this.inputSizes.length / 2);
    
    // Analyze first half
    const firstHalf = {
      inputSizes: this.inputSizes.slice(0, midPoint),
      executionTimes: this.executionTimes.slice(0, midPoint)
    };
    
    // Analyze second half
    const secondHalf = {
      inputSizes: this.inputSizes.slice(midPoint),
      executionTimes: this.executionTimes.slice(midPoint)
    };

    const firstAnalyzer = new CurveFittingEngine(firstHalf.inputSizes, firstHalf.executionTimes);
    const secondAnalyzer = new CurveFittingEngine(secondHalf.inputSizes, secondHalf.executionTimes);

    const firstResult = firstAnalyzer.analyze();
    const secondResult = secondAnalyzer.analyze();

    const hasChange = firstResult.bestFit.complexity !== secondResult.bestFit.complexity &&
                     firstResult.bestFit.rSquared > 0.7 && 
                     secondResult.bestFit.rSquared > 0.7;

    return {
      hasChange,
      changePoint: hasChange ? this.inputSizes[midPoint] : undefined,
      beforeComplexity: hasChange ? firstResult.bestFit.complexity : undefined,
      afterComplexity: hasChange ? secondResult.bestFit.complexity : undefined
    };
  }

  /**
   * Predict execution time for a given input size
   */
  public predictExecutionTime(inputSize: number, complexity: string, coefficient: number): number {
    const complexityFunctions: { [key: string]: (n: number) => number } = {
      'O(1)': () => 1,
      'O(log n)': (n) => Math.log2(n),
      'O(√n)': (n) => Math.sqrt(n),
      'O(n)': (n) => n,
      'O(n log n)': (n) => n * Math.log2(n),
      'O(n√n)': (n) => n * Math.sqrt(n),
      'O(n²)': (n) => n * n,
      'O(n² log n)': (n) => n * n * Math.log2(n),
      'O(n³)': (n) => n * n * n,
      'O(2^n)': (n) => Math.pow(2, Math.min(n, 30)),
      'O(n!)': (n) => this.factorial(Math.min(n, 10))
    };

    const func = complexityFunctions[complexity];
    if (!func) return 0;

    return coefficient * func(inputSize);
  }
}