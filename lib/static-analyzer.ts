/**
 * Static Complexity Analyzer
 * Analyzes C++ code using the AST parser and provides detailed complexity analysis
 */

import { CppParser, ASTNode, ComplexityInfo } from './cpp-parser';

export interface StaticAnalysisResult {
  overallComplexity: ComplexityInfo;
  functionAnalysis: FunctionAnalysis[];
  loopAnalysis: LoopAnalysis[];
  algorithmPatterns: AlgorithmPattern[];
  recommendations: string[];
  warnings: string[];
  confidence: number;
}

export interface FunctionAnalysis {
  name: string;
  complexity: ComplexityInfo;
  isRecursive: boolean;
  recursionType?: 'linear' | 'binary-tree' | 'divide-conquer' | 'unknown';
  callCount: number;
  lineRange: { start: number; end: number };
}

export interface LoopAnalysis {
  type: 'for' | 'while' | 'do-while' | 'range-based';
  complexity: ComplexityInfo;
  nestingLevel: number;
  iterationPattern: string;
  bodyComplexity: ComplexityInfo;
  lineRange: { start: number; end: number };
}

export interface AlgorithmPattern {
  name: string;
  description: string;
  complexity: ComplexityInfo;
  confidence: number;
  evidence: string[];
  lineRange: { start: number; end: number };
}

export class StaticComplexityAnalyzer {
  private ast: ASTNode;
  private code: string;
  private lines: string[];

  constructor(code: string) {
    this.code = code;
    this.lines = code.split('\n');
    const parser = new CppParser(code);
    this.ast = parser.parse();
  }

  /**
   * Perform comprehensive static analysis
   */
  public analyze(): StaticAnalysisResult {
    const functionAnalysis = this.analyzeFunctions();
    const loopAnalysis = this.analyzeLoops();
    const algorithmPatterns = this.detectAlgorithmPatterns();
    const recommendations = this.generateRecommendations(functionAnalysis, loopAnalysis, algorithmPatterns);
    const warnings = this.generateWarnings(functionAnalysis, loopAnalysis);
    
    // Calculate overall confidence based on individual analyses
    const confidence = this.calculateOverallConfidence(functionAnalysis, loopAnalysis, algorithmPatterns);

    return {
      overallComplexity: this.ast.complexity,
      functionAnalysis,
      loopAnalysis,
      algorithmPatterns,
      recommendations,
      warnings,
      confidence
    };
  }

  /**
   * Analyze all functions in the code
   */
  private analyzeFunctions(): FunctionAnalysis[] {
    const functions: FunctionAnalysis[] = [];
    this.traverseAST(this.ast, (node) => {
      if (node.type === 'function' && node.name) {
        const recursionType = this.determineRecursionType(node);
        const callCount = this.countFunctionCalls(node.name);
        
        functions.push({
          name: node.name,
          complexity: node.complexity,
          isRecursive: node.metadata.isRecursive || false,
          recursionType,
          callCount,
          lineRange: {
            start: node.metadata.lineStart,
            end: node.metadata.lineEnd
          }
        });
      }
    });
    return functions;
  }

  /**
   * Analyze all loops in the code
   */
  private analyzeLoops(): LoopAnalysis[] {
    const loops: LoopAnalysis[] = [];
    let nestingLevel = 0;
    
    this.traverseAST(this.ast, (node, depth) => {
      if (node.type === 'loop') {
        const bodyComplexity = this.calculateBodyComplexity(node);
        
        loops.push({
          type: node.metadata.loopType as 'for' | 'while' | 'do-while' | 'range-based',
          complexity: node.complexity,
          nestingLevel: depth,
          iterationPattern: node.metadata.iterationPattern || 'unknown',
          bodyComplexity,
          lineRange: {
            start: node.metadata.lineStart,
            end: node.metadata.lineEnd
          }
        });
      }
    });
    return loops;
  }

  /**
   * Detect specific algorithm patterns
   */
  private detectAlgorithmPatterns(): AlgorithmPattern[] {
    const patterns: AlgorithmPattern[] = [];

    // Detect sorting algorithms
    const sortingPatterns = this.detectSortingAlgorithms();
    patterns.push(...sortingPatterns);

    // Detect searching algorithms
    const searchingPatterns = this.detectSearchingAlgorithms();
    patterns.push(...searchingPatterns);

    // Detect graph algorithms
    const graphPatterns = this.detectGraphAlgorithms();
    patterns.push(...graphPatterns);

    // Detect dynamic programming patterns
    const dpPatterns = this.detectDynamicProgramming();
    patterns.push(...dpPatterns);

    // Detect tree algorithms
    const treePatterns = this.detectTreeAlgorithms();
    patterns.push(...treePatterns);

    return patterns;
  }

  /**
   * Detect sorting algorithms
   */
  private detectSortingAlgorithms(): AlgorithmPattern[] {
    const patterns: AlgorithmPattern[] = [];
    const codeText = this.code.toLowerCase();

    // Merge Sort
    if (this.isMergeSort()) {
      patterns.push({
        name: 'Merge Sort',
        description: 'Divide-and-conquer sorting algorithm that recursively divides the array and merges sorted halves',
        complexity: {
          timeComplexity: 'O(n log n)',
          spaceComplexity: 'O(n)',
          factors: ['divide-and-conquer', 'stable-sort'],
          confidence: 0.95,
          isExact: true
        },
        confidence: 0.95,
        evidence: ['recursive division', 'merge function', 'temporary arrays'],
        lineRange: { start: 0, end: this.lines.length - 1 }
      });
    }

    // Quick Sort
    if (this.isQuickSort()) {
      patterns.push({
        name: 'Quick Sort',
        description: 'Divide-and-conquer sorting algorithm using partitioning around a pivot element',
        complexity: {
          timeComplexity: 'O(n log n) average, O(n²) worst',
          spaceComplexity: 'O(log n)',
          factors: ['divide-and-conquer', 'in-place', 'pivot-based'],
          confidence: 0.9,
          isExact: true
        },
        confidence: 0.9,
        evidence: ['partition function', 'pivot selection', 'recursive calls'],
        lineRange: { start: 0, end: this.lines.length - 1 }
      });
    }

    // Heap Sort
    if (this.isHeapSort()) {
      patterns.push({
        name: 'Heap Sort',
        description: 'Comparison-based sorting algorithm using binary heap data structure',
        complexity: {
          timeComplexity: 'O(n log n)',
          spaceComplexity: 'O(1)',
          factors: ['heap-based', 'in-place'],
          confidence: 0.9,
          isExact: true
        },
        confidence: 0.9,
        evidence: ['heapify operations', 'heap building', 'extract max/min'],
        lineRange: { start: 0, end: this.lines.length - 1 }
      });
    }

    // Bubble Sort
    if (this.isBubbleSort()) {
      patterns.push({
        name: 'Bubble Sort',
        description: 'Simple comparison-based sorting with adjacent element swapping',
        complexity: {
          timeComplexity: 'O(n²)',
          spaceComplexity: 'O(1)',
          factors: ['comparison-based', 'stable', 'in-place'],
          confidence: 0.85,
          isExact: true
        },
        confidence: 0.85,
        evidence: ['nested loops', 'adjacent comparisons', 'swapping'],
        lineRange: { start: 0, end: this.lines.length - 1 }
      });
    }

    // Insertion Sort
    if (this.isInsertionSort()) {
      patterns.push({
        name: 'Insertion Sort',
        description: 'Builds sorted array one element at a time by inserting elements in correct position',
        complexity: {
          timeComplexity: 'O(n²) worst, O(n) best',
          spaceComplexity: 'O(1)',
          factors: ['comparison-based', 'stable', 'adaptive'],
          confidence: 0.8,
          isExact: true
        },
        confidence: 0.8,
        evidence: ['key element selection', 'shifting elements', 'insertion'],
        lineRange: { start: 0, end: this.lines.length - 1 }
      });
    }

    return patterns;
  }

  /**
   * Detect searching algorithms
   */
  private detectSearchingAlgorithms(): AlgorithmPattern[] {
    const patterns: AlgorithmPattern[] = [];

    // Binary Search
    if (this.isBinarySearch()) {
      patterns.push({
        name: 'Binary Search',
        description: 'Efficient search algorithm for sorted arrays using divide-and-conquer',
        complexity: {
          timeComplexity: 'O(log n)',
          spaceComplexity: 'O(1)',
          factors: ['divide-and-conquer', 'sorted-input'],
          confidence: 0.95,
          isExact: true
        },
        confidence: 0.95,
        evidence: ['mid calculation', 'left/right bounds', 'logarithmic reduction'],
        lineRange: { start: 0, end: this.lines.length - 1 }
      });
    }

    // Linear Search
    if (this.isLinearSearch()) {
      patterns.push({
        name: 'Linear Search',
        description: 'Sequential search through elements until target is found',
        complexity: {
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(1)',
          factors: ['sequential', 'unsorted-input'],
          confidence: 0.8,
          isExact: true
        },
        confidence: 0.8,
        evidence: ['sequential iteration', 'element comparison'],
        lineRange: { start: 0, end: this.lines.length - 1 }
      });
    }

    return patterns;
  }

  /**
   * Detect graph algorithms
   */
  private detectGraphAlgorithms(): AlgorithmPattern[] {
    const patterns: AlgorithmPattern[] = [];
    const codeText = this.code.toLowerCase();

    // Depth-First Search (DFS)
    if (codeText.includes('dfs') || this.isDFSPattern()) {
      patterns.push({
        name: 'Depth-First Search (DFS)',
        description: 'Graph traversal algorithm exploring as far as possible along each branch',
        complexity: {
          timeComplexity: 'O(V + E)',
          spaceComplexity: 'O(V)',
          factors: ['graph-traversal', 'recursive'],
          confidence: 0.85,
          isExact: true
        },
        confidence: 0.85,
        evidence: ['recursive calls', 'visited array', 'adjacency exploration'],
        lineRange: { start: 0, end: this.lines.length - 1 }
      });
    }

    // Breadth-First Search (BFS)
    if (codeText.includes('bfs') || this.isBFSPattern()) {
      patterns.push({
        name: 'Breadth-First Search (BFS)',
        description: 'Graph traversal algorithm exploring neighbors before going deeper',
        complexity: {
          timeComplexity: 'O(V + E)',
          spaceComplexity: 'O(V)',
          factors: ['graph-traversal', 'queue-based'],
          confidence: 0.85,
          isExact: true
        },
        confidence: 0.85,
        evidence: ['queue usage', 'level-by-level traversal', 'visited tracking'],
        lineRange: { start: 0, end: this.lines.length - 1 }
      });
    }

    // Dijkstra's Algorithm
    if (codeText.includes('dijkstra') || this.isDijkstraPattern()) {
      patterns.push({
        name: "Dijkstra's Shortest Path",
        description: 'Algorithm for finding shortest paths from source to all vertices',
        complexity: {
          timeComplexity: 'O((V + E) log V)',
          spaceComplexity: 'O(V)',
          factors: ['shortest-path', 'priority-queue'],
          confidence: 0.9,
          isExact: true
        },
        confidence: 0.9,
        evidence: ['priority queue', 'distance array', 'relaxation'],
        lineRange: { start: 0, end: this.lines.length - 1 }
      });
    }

    return patterns;
  }

  /**
   * Detect dynamic programming patterns
   */
  private detectDynamicProgramming(): AlgorithmPattern[] {
    const patterns: AlgorithmPattern[] = [];
    const codeText = this.code.toLowerCase();

    if (this.isDynamicProgramming()) {
      patterns.push({
        name: 'Dynamic Programming',
        description: 'Optimization technique using memoization to solve overlapping subproblems',
        complexity: {
          timeComplexity: 'O(n) to O(n²)',
          spaceComplexity: 'O(n)',
          factors: ['memoization', 'optimal-substructure'],
          confidence: 0.8,
          isExact: false
        },
        confidence: 0.8,
        evidence: ['memoization array', 'subproblem solving', 'optimal combination'],
        lineRange: { start: 0, end: this.lines.length - 1 }
      });
    }

    return patterns;
  }

  /**
   * Detect tree algorithms
   */
  private detectTreeAlgorithms(): AlgorithmPattern[] {
    const patterns: AlgorithmPattern[] = [];
    const codeText = this.code.toLowerCase();

    // Tree Traversal
    if (this.isTreeTraversal()) {
      patterns.push({
        name: 'Tree Traversal',
        description: 'Systematic visiting of tree nodes (inorder, preorder, postorder)',
        complexity: {
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(h)',
          factors: ['tree-traversal', 'recursive'],
          confidence: 0.85,
          isExact: true
        },
        confidence: 0.85,
        evidence: ['recursive structure', 'left/right traversal', 'node processing'],
        lineRange: { start: 0, end: this.lines.length - 1 }
      });
    }

    return patterns;
  }

  /**
   * Algorithm pattern detection helper methods
   */
  private isMergeSort(): boolean {
    const code = this.code.toLowerCase();
    const hasMerge = /merge\s*\(/.test(code);
    const hasDivision = /mid\s*=.*\/\s*2|mid\s*=.*>>\s*1/.test(code);
    const hasRecursiveCalls = /mergesort.*mergesort|sort.*sort/i.test(code);
    const hasArrayMerging = /while.*left.*right|temp\[|aux\[/.test(code);
    
    return hasMerge && hasDivision && hasRecursiveCalls && hasArrayMerging;
  }

  private isQuickSort(): boolean {
    const code = this.code.toLowerCase();
    const hasPartition = /partition\s*\(/i.test(code);
    const hasPivot = /pivot/i.test(code);
    const hasRecursiveCalls = /quicksort.*quicksort|sort.*sort/i.test(code);
    const hasSwapping = /swap\s*\(|std::swap/i.test(code);
    
    return (hasPartition || hasPivot) && hasRecursiveCalls && hasSwapping;
  }

  private isHeapSort(): boolean {
    const code = this.code.toLowerCase();
    const hasHeapify = /heapify/i.test(code);
    const hasHeapOperations = /make_heap|push_heap|pop_heap/i.test(code);
    const hasParentChild = /parent|child|2\s*\*\s*i|\(\s*i\s*-\s*1\s*\)\s*\/\s*2/.test(code);
    
    return hasHeapify || hasHeapOperations || hasParentChild;
  }

  private isBubbleSort(): boolean {
    const code = this.code.toLowerCase();
    const hasNestedLoops = /for.*for|while.*while/.test(code);
    const hasSwapping = /swap|temp\s*=.*arr\[.*\].*arr\[.*\]\s*=.*temp/.test(code);
    const hasAdjacentComparison = /arr\[\s*i\s*\]\s*>\s*arr\[\s*i\s*\+\s*1\s*\]|arr\[\s*j\s*\]\s*>\s*arr\[\s*j\s*\+\s*1\s*\]/.test(code);
    
    return hasNestedLoops && hasSwapping && hasAdjacentComparison;
  }

  private isInsertionSort(): boolean {
    const code = this.code.toLowerCase();
    const hasKeyElement = /key\s*=|temp\s*=.*arr\[/.test(code);
    const hasShifting = /arr\[\s*j\s*\+\s*1\s*\]\s*=\s*arr\[\s*j\s*\]/.test(code);
    const hasInsertion = /arr\[\s*j\s*\+\s*1\s*\]\s*=\s*key|arr\[\s*j\s*\]\s*=\s*temp/.test(code);
    
    return hasKeyElement && hasShifting && hasInsertion;
  }

  private isBinarySearch(): boolean {
    const code = this.code.toLowerCase();
    const hasMidCalculation = /mid\s*=.*\/\s*2|mid\s*=.*>>\s*1|\(\s*left\s*\+\s*right\s*\)\s*\/\s*2/.test(code);
    const hasBounds = /left\s*<=?\s*right|low\s*<=?\s*high|start\s*<=?\s*end/.test(code);
    const hasComparison = /arr\[\s*mid\s*\].*target|data\[\s*mid\s*\].*key/.test(code);
    const hasUpdate = /left\s*=\s*mid|right\s*=\s*mid|high\s*=\s*mid|low\s*=\s*mid/.test(code);
    
    return hasMidCalculation && hasBounds && hasComparison && hasUpdate;
  }

  private isLinearSearch(): boolean {
    const code = this.code.toLowerCase();
    const hasLoop = /for.*i.*length|while.*i.*size/.test(code);
    const hasComparison = /arr\[\s*i\s*\].*target|data\[\s*i\s*\].*key/.test(code);
    const hasReturn = /return\s*i|return\s*true|found/.test(code);
    
    return hasLoop && hasComparison && hasReturn && !this.isBinarySearch();
  }

  private isDFSPattern(): boolean {
    const code = this.code.toLowerCase();
    const hasRecursion = /dfs\s*\(.*\)\s*{[\s\S]*dfs\s*\(/i.test(code);
    const hasVisited = /visited\[|visit\[/.test(code);
    const hasAdjacency = /adj\[|graph\[|neighbors/.test(code);
    
    return hasRecursion && hasVisited && hasAdjacency;
  }

  private isBFSPattern(): boolean {
    const code = this.code.toLowerCase();
    const hasQueue = /queue|std::queue/.test(code);
    const hasVisited = /visited\[|visit\[/.test(code);
    const hasLoop = /while.*!.*empty|while.*queue\.size/.test(code);
    
    return hasQueue && hasVisited && hasLoop;
  }

  private isDijkstraPattern(): boolean {
    const code = this.code.toLowerCase();
    const hasPriorityQueue = /priority_queue|std::priority_queue/.test(code);
    const hasDistance = /dist\[|distance\[/.test(code);
    const hasRelaxation = /dist\[.*\]\s*>\s*dist\[.*\]\s*\+/.test(code);
    
    return hasPriorityQueue && hasDistance && hasRelaxation;
  }

  private isDynamicProgramming(): boolean {
    const code = this.code.toLowerCase();
    const hasMemo = /memo\[|dp\[|cache\[/.test(code);
    const hasBaseCase = /if.*return|base.*case/.test(code);
    const hasRecurrence = /dp\[.*\]\s*=.*dp\[.*\]|memo\[.*\]\s*=.*memo\[.*\]/.test(code);
    
    return hasMemo && hasBaseCase && hasRecurrence;
  }

  private isTreeTraversal(): boolean {
    const code = this.code.toLowerCase();
    const hasTreeStructure = /left|right|node\s*->|tree/.test(code);
    const hasRecursion = /traverse.*traverse|inorder.*inorder|preorder.*preorder|postorder.*postorder/i.test(code);
    const hasNullCheck = /if.*null|if.*nullptr|if.*!/.test(code);
    
    return hasTreeStructure && hasRecursion && hasNullCheck;
  }

  /**
   * Helper methods for analysis
   */
  private determineRecursionType(node: ASTNode): 'linear' | 'binary-tree' | 'divide-conquer' | 'unknown' | undefined {
    if (!node.metadata.isRecursive) return undefined;

    const functionBody = this.lines.slice(node.metadata.lineStart, node.metadata.lineEnd + 1).join(' ');
    const recursiveCalls = (functionBody.match(new RegExp(node.name || '', 'g')) || []).length - 1;

    if (recursiveCalls >= 2 && (functionBody.includes('/2') || functionBody.includes('mid'))) {
      return 'divide-conquer';
    } else if (recursiveCalls >= 2) {
      return 'binary-tree';
    } else if (recursiveCalls === 1) {
      return 'linear';
    }
    
    return 'unknown';
  }

  private countFunctionCalls(functionName: string): number {
    const pattern = new RegExp(`\\b${functionName}\\s*\\(`, 'g');
    return (this.code.match(pattern) || []).length;
  }

  private calculateBodyComplexity(node: ASTNode): ComplexityInfo {
    if (node.children.length === 0) {
      return { timeComplexity: 'O(1)', spaceComplexity: 'O(1)', factors: [], confidence: 1.0, isExact: true };
    }

    let maxTimeComplexity = 'O(1)';
    let maxSpaceComplexity = 'O(1)';
    let minConfidence = 1.0;
    const allFactors: string[] = [];

    node.children.forEach(child => {
      if (this.isHigherComplexity(child.complexity.timeComplexity, maxTimeComplexity)) {
        maxTimeComplexity = child.complexity.timeComplexity;
      }
      if (this.isHigherComplexity(child.complexity.spaceComplexity, maxSpaceComplexity)) {
        maxSpaceComplexity = child.complexity.spaceComplexity;
      }
      minConfidence = Math.min(minConfidence, child.complexity.confidence);
      allFactors.push(...child.complexity.factors);
    });

    return {
      timeComplexity: maxTimeComplexity,
      spaceComplexity: maxSpaceComplexity,
      factors: [...new Set(allFactors)],
      confidence: minConfidence,
      isExact: false
    };
  }

  private isHigherComplexity(complexity1: string, complexity2: string): boolean {
    const order = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(2^n)', 'O(n!)'];
    const index1 = order.findIndex(c => complexity1.includes(c.replace(/[()]/g, '')));
    const index2 = order.findIndex(c => complexity2.includes(c.replace(/[()]/g, '')));
    return index1 > index2;
  }

  private traverseAST(node: ASTNode, callback: (node: ASTNode, depth: number) => void, depth: number = 0): void {
    callback(node, depth);
    node.children.forEach(child => this.traverseAST(child, callback, depth + 1));
  }

  private generateRecommendations(
    functions: FunctionAnalysis[], 
    loops: LoopAnalysis[], 
    algorithms: AlgorithmPattern[]
  ): string[] {
    const recommendations: string[] = [];

    // Function-based recommendations
    functions.forEach(func => {
      if (func.complexity.timeComplexity.includes('O(2^n)')) {
        recommendations.push(`Consider memoization for function '${func.name}' to reduce exponential time complexity`);
      }
      if (func.isRecursive && func.recursionType === 'linear') {
        recommendations.push(`Function '${func.name}' uses linear recursion - consider iterative approach to reduce space complexity`);
      }
    });

    // Loop-based recommendations
    loops.forEach(loop => {
      if (loop.nestingLevel > 2) {
        recommendations.push(`Deep loop nesting detected (level ${loop.nestingLevel}) - consider algorithmic optimization`);
      }
      if (loop.complexity.timeComplexity.includes('O(n²)') && loop.type === 'for') {
        recommendations.push('Quadratic nested loops detected - consider using hash tables or efficient data structures');
      }
    });

    // Algorithm-based recommendations
    if (algorithms.some(alg => alg.name === 'Bubble Sort')) {
      recommendations.push('Bubble sort detected - consider using more efficient sorting algorithms like Quick Sort or Merge Sort');
    }
    if (algorithms.some(alg => alg.name === 'Linear Search') && this.code.includes('sort')) {
      recommendations.push('Linear search on sorted data - consider using binary search for O(log n) complexity');
    }

    return recommendations;
  }

  private generateWarnings(functions: FunctionAnalysis[], loops: LoopAnalysis[]): string[] {
    const warnings: string[] = [];

    // Complexity warnings
    functions.forEach(func => {
      if (func.complexity.timeComplexity.includes('O(2^n)') || func.complexity.timeComplexity.includes('O(n!)')) {
        warnings.push(`Exponential/factorial complexity in function '${func.name}' - may not scale for large inputs`);
      }
    });

    loops.forEach(loop => {
      if (loop.nestingLevel > 3) {
        warnings.push(`Very deep loop nesting (level ${loop.nestingLevel}) detected - review algorithm design`);
      }
    });

    // Recursion warnings
    const recursiveFunctions = functions.filter(f => f.isRecursive);
    if (recursiveFunctions.length > 0) {
      recursiveFunctions.forEach(func => {
        if (func.recursionType === 'binary-tree') {
          warnings.push(`Binary tree recursion in '${func.name}' - stack overflow risk for large inputs`);
        }
      });
    }

    return warnings;
  }

  private calculateOverallConfidence(
    functions: FunctionAnalysis[], 
    loops: LoopAnalysis[], 
    algorithms: AlgorithmPattern[]
  ): number {
    const confidences: number[] = [];
    
    // Add function confidences
    functions.forEach(func => confidences.push(func.complexity.confidence));
    
    // Add loop confidences
    loops.forEach(loop => confidences.push(loop.complexity.confidence));
    
    // Add algorithm pattern confidences
    algorithms.forEach(alg => confidences.push(alg.confidence));
    
    // Add AST confidence
    confidences.push(this.ast.complexity.confidence);

    // Calculate weighted average (give more weight to algorithm patterns)
    if (confidences.length === 0) return 0.5; // Default confidence
    
    const algorithmWeight = 0.4;
    const otherWeight = 0.6;
    
    const algorithmConfidence = algorithms.length > 0 
      ? algorithms.reduce((sum, alg) => sum + alg.confidence, 0) / algorithms.length 
      : 0.5;
    
    const otherConfidence = functions.length + loops.length > 0
      ? [...functions.map(f => f.complexity.confidence), ...loops.map(l => l.complexity.confidence)]
          .reduce((sum, conf) => sum + conf, 0) / (functions.length + loops.length)
      : 0.5;

    return algorithmWeight * algorithmConfidence + otherWeight * otherConfidence;
  }
}