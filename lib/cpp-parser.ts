/**
 * C++ Code Parser and Abstract Syntax Tree Builder
 * Handles C++ specific syntax and creates complexity expression trees
 */

export interface ASTNode {
  type: 'program' | 'function' | 'loop' | 'conditional' | 'expression' | 'variable' | 'block' | 'call' | 'return';
  name?: string;
  children: ASTNode[];
  complexity: ComplexityInfo;
  metadata: {
    lineStart: number;
    lineEnd: number;
    loopType?: 'for' | 'while' | 'do-while' | 'range-based';
    functionType?: string;
    isRecursive?: boolean;
    iterationPattern?: string;
    stlOperations?: string[];
  };
}

export interface ComplexityInfo {
  timeComplexity: string;
  spaceComplexity: string;
  factors: string[];
  confidence: number;
  isExact: boolean;
}

export class CppParser {
  private code: string;
  private lines: string[];
  private currentLine: number = 0;

  constructor(code: string) {
    this.code = this.preprocessCode(code);
    this.lines = this.code.split('\n');
  }

  /**
   * Preprocess C++ code to remove comments, strings, and normalize whitespace
   */
  private preprocessCode(code: string): string {
    // Remove block comments
    let processed = code.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove line comments
    processed = processed.replace(/\/\/.*$/gm, '');
    
    // Remove string literals to avoid false positives
    processed = processed.replace(/"(?:[^"\\]|\\.)*"/g, '""');
    processed = processed.replace(/'(?:[^'\\]|\\.)*'/g, "''");
    
    // Normalize whitespace
    processed = processed.replace(/\s+/g, ' ');
    
    return processed;
  }

  /**
   * Parse C++ code and build Abstract Syntax Tree
   */
  public parse(): ASTNode {
    const root: ASTNode = {
      type: 'program',
      children: [],
      complexity: { timeComplexity: 'O(1)', spaceComplexity: 'O(1)', factors: [], confidence: 1.0, isExact: false },
      metadata: { lineStart: 0, lineEnd: this.lines.length - 1 }
    };

    this.currentLine = 0;
    while (this.currentLine < this.lines.length) {
      const node = this.parseStatement();
      if (node) {
        root.children.push(node);
      }
      this.currentLine++;
    }

    // Calculate program-level complexity
    root.complexity = this.calculateProgramComplexity(root);
    
    return root;
  }

  /**
   * Parse individual statements
   */
  private parseStatement(): ASTNode | null {
    const line = this.lines[this.currentLine]?.trim();
    if (!line) return null;

    // Function declarations
    if (this.isFunctionDeclaration(line)) {
      return this.parseFunction();
    }

    // Loop statements
    if (this.isLoopStatement(line)) {
      return this.parseLoop();
    }

    // Conditional statements
    if (this.isConditionalStatement(line)) {
      return this.parseConditional();
    }

    // Variable declarations with STL containers
    if (this.isVariableDeclaration(line)) {
      return this.parseVariableDeclaration(line);
    }

    // Function calls and STL operations
    if (this.isFunctionCall(line)) {
      return this.parseFunctionCall(line);
    }

    // Return statements
    if (line.startsWith('return')) {
      return this.parseReturnStatement(line);
    }

    return null;
  }

  /**
   * Check if line is a function declaration
   */
  private isFunctionDeclaration(line: string): boolean {
    const patterns = [
      /^\s*(void|int|float|double|char|string|bool|vector<.*?>|list<.*?>|set<.*?>|map<.*?>)\s+\w+\s*\(/,
      /^\s*template\s*<.*>\s*(void|int|float|double|char|string|bool|vector<.*?>)\s+\w+\s*\(/,
      /^\s*(inline|static|const|virtual)?\s*(void|int|float|double|char|string|bool|vector<.*?>)\s+\w+\s*\(/
    ];
    return patterns.some(pattern => pattern.test(line));
  }

  /**
   * Parse function declarations and definitions
   */
  private parseFunction(): ASTNode {
    const startLine = this.currentLine;
    const line = this.lines[this.currentLine];
    
    // Extract function name and return type
    const funcMatch = line.match(/(?:void|int|float|double|char|string|bool|vector<.*?>|list<.*?>|set<.*?>|map<.*?>)\s+(\w+)\s*\(/);
    const functionName = funcMatch?.[1] || 'unknown';
    const returnType = line.match(/(void|int|float|double|char|string|bool|vector<.*?>|list<.*?>|set<.*?>|map<.*?>)/)?.[1] || 'void';

    const functionNode: ASTNode = {
      type: 'function',
      name: functionName,
      children: [],
      complexity: { timeComplexity: 'O(1)', spaceComplexity: 'O(1)', factors: [], confidence: 1.0, isExact: false },
      metadata: { 
        lineStart: startLine, 
        lineEnd: startLine, 
        functionType: returnType,
        isRecursive: false 
      }
    };

    // Find function body
    const bodyStart = this.findNextOpenBrace();
    if (bodyStart !== -1) {
      this.currentLine = bodyStart;
      const bodyEnd = this.findMatchingCloseBrace();
      functionNode.metadata.lineEnd = bodyEnd;

      // Parse function body
      this.currentLine = bodyStart + 1;
      while (this.currentLine < bodyEnd) {
        const statement = this.parseStatement();
        if (statement) {
          functionNode.children.push(statement);
        }
        this.currentLine++;
      }

      // Check for recursion
      functionNode.metadata.isRecursive = this.checkRecursion(functionName, bodyStart, bodyEnd);
      
      // Calculate function complexity
      functionNode.complexity = this.calculateFunctionComplexity(functionNode);
    }

    return functionNode;
  }

  /**
   * Check if line contains a loop statement
   */
  private isLoopStatement(line: string): boolean {
    return /^\s*(for|while|do)\s*[\(\{]/.test(line) || 
           /^\s*for\s*\(\s*\w+\s*:\s*\w+\s*\)/.test(line); // range-based for
  }

  /**
   * Parse loop statements
   */
  private parseLoop(): ASTNode {
    const startLine = this.currentLine;
    const line = this.lines[this.currentLine];
    
    let loopType: 'for' | 'while' | 'do-while' | 'range-based' = 'for';
    let iterationPattern = '';

    // Determine loop type and pattern
    if (line.includes('for (')) {
      if (line.includes(':')) {
        loopType = 'range-based';
        iterationPattern = 'linear';
      } else {
        loopType = 'for';
        iterationPattern = this.analyzeForLoopPattern(line);
      }
    } else if (line.includes('while')) {
      loopType = 'while';
      iterationPattern = this.analyzeWhileLoopPattern(line);
    } else if (line.includes('do')) {
      loopType = 'do-while';
      iterationPattern = 'unknown';
    }

    const loopNode: ASTNode = {
      type: 'loop',
      children: [],
      complexity: { timeComplexity: 'O(n)', spaceComplexity: 'O(1)', factors: [], confidence: 0.8, isExact: false },
      metadata: { 
        lineStart: startLine, 
        lineEnd: startLine,
        loopType,
        iterationPattern
      }
    };

    // Find loop body
    const bodyStart = this.findNextOpenBrace();
    if (bodyStart !== -1) {
      this.currentLine = bodyStart;
      const bodyEnd = this.findMatchingCloseBrace();
      loopNode.metadata.lineEnd = bodyEnd;

      // Parse loop body
      this.currentLine = bodyStart + 1;
      while (this.currentLine < bodyEnd) {
        const statement = this.parseStatement();
        if (statement) {
          loopNode.children.push(statement);
        }
        this.currentLine++;
      }

      // Calculate loop complexity based on pattern and nested operations
      loopNode.complexity = this.calculateLoopComplexity(loopNode);
    }

    return loopNode;
  }

  /**
   * Analyze for loop iteration patterns
   */
  private analyzeForLoopPattern(line: string): string {
    // Check for nested loop patterns
    if (/i\s*<\s*n.*j\s*<\s*n/.test(line) || /i\s*<\s*size.*j\s*<\s*size/.test(line)) {
      return 'quadratic';
    }
    
    // Check for logarithmic patterns
    if (/i\s*\*=\s*2|i\s*<<=\s*1|i\s*\/=\s*2|i\s*>>=\s*1/.test(line)) {
      return 'logarithmic';
    }
    
    // Check for exponential patterns
    if (/i\s*=\s*pow|i\s*\*\s*i/.test(line)) {
      return 'exponential';
    }
    
    // Default linear pattern
    return 'linear';
  }

  /**
   * Analyze while loop patterns
   */
  private analyzeWhileLoopPattern(line: string): string {
    // Binary search pattern
    if (/left\s*<=?\s*right|low\s*<=?\s*high/.test(line)) {
      return 'logarithmic';
    }
    
    // List traversal
    if (/ptr\s*!=\s*null|node\s*!=\s*null|next/.test(line)) {
      return 'linear';
    }
    
    return 'unknown';
  }

  /**
   * Parse conditional statements
   */
  private isConditionalStatement(line: string): boolean {
    return /^\s*if\s*\(/.test(line) || /^\s*else/.test(line) || /^\s*switch\s*\(/.test(line);
  }

  private parseConditional(): ASTNode {
    const startLine = this.currentLine;
    const line = this.lines[this.currentLine];

    const conditionalNode: ASTNode = {
      type: 'conditional',
      children: [],
      complexity: { timeComplexity: 'O(1)', spaceComplexity: 'O(1)', factors: [], confidence: 0.9, isExact: false },
      metadata: { lineStart: startLine, lineEnd: startLine }
    };

    // Find conditional body
    const bodyStart = this.findNextOpenBrace();
    if (bodyStart !== -1) {
      this.currentLine = bodyStart;
      const bodyEnd = this.findMatchingCloseBrace();
      conditionalNode.metadata.lineEnd = bodyEnd;

      // Parse conditional body
      this.currentLine = bodyStart + 1;
      while (this.currentLine < bodyEnd) {
        const statement = this.parseStatement();
        if (statement) {
          conditionalNode.children.push(statement);
        }
        this.currentLine++;
      }

      conditionalNode.complexity = this.calculateConditionalComplexity(conditionalNode);
    }

    return conditionalNode;
  }

  /**
   * Parse variable declarations with STL containers
   */
  private isVariableDeclaration(line: string): boolean {
    return /^\s*(int|float|double|char|string|bool|vector<.*?>|list<.*?>|set<.*?>|map<.*?>|queue<.*?>|stack<.*?>|priority_queue<.*?>)\s+\w+/.test(line);
  }

  private parseVariableDeclaration(line: string): ASTNode {
    const startLine = this.currentLine;
    
    // Extract variable type and name
    const varMatch = line.match(/^\s*(int|float|double|char|string|bool|vector<.*?>|list<.*?>|set<.*?>|map<.*?>|queue<.*?>|stack<.*?>|priority_queue<.*?>)\s+(\w+)/);
    const varType = varMatch?.[1] || 'unknown';
    const varName = varMatch?.[2] || 'unknown';

    const spaceComplexity = this.getSTLSpaceComplexity(varType);

    return {
      type: 'variable',
      name: varName,
      children: [],
      complexity: { 
        timeComplexity: 'O(1)', 
        spaceComplexity, 
        factors: [varType], 
        confidence: 1.0, 
        isExact: true 
      },
      metadata: { lineStart: startLine, lineEnd: startLine }
    };
  }

  /**
   * Get space complexity for STL containers
   */
  private getSTLSpaceComplexity(type: string): string {
    if (type.includes('vector') || type.includes('list') || type.includes('deque')) {
      return 'O(n)';
    }
    if (type.includes('set') || type.includes('map') || type.includes('multiset') || type.includes('multimap')) {
      return 'O(n)';
    }
    if (type.includes('unordered_set') || type.includes('unordered_map')) {
      return 'O(n)';
    }
    if (type.includes('queue') || type.includes('stack') || type.includes('priority_queue')) {
      return 'O(n)';
    }
    return 'O(1)';
  }

  /**
   * Parse function calls and STL operations
   */
  private isFunctionCall(line: string): boolean {
    return /\w+\s*\([^)]*\)/.test(line) && !this.isFunctionDeclaration(line);
  }

  private parseFunctionCall(line: string): ASTNode {
    const startLine = this.currentLine;
    
    // Extract function name
    const funcMatch = line.match(/(\w+)\s*\(/);
    const functionName = funcMatch?.[1] || 'unknown';

    // Detect STL operations and their complexities
    const stlOperations = this.detectSTLOperations(line);
    const complexity = this.getSTLOperationComplexity(functionName, line);

    return {
      type: 'call',
      name: functionName,
      children: [],
      complexity,
      metadata: { 
        lineStart: startLine, 
        lineEnd: startLine,
        stlOperations 
      }
    };
  }

  /**
   * Detect STL operations in the line
   */
  private detectSTLOperations(line: string): string[] {
    const operations: string[] = [];
    const patterns = [
      'push_back', 'push_front', 'pop_back', 'pop_front', 'insert', 'erase', 'find',
      'sort', 'stable_sort', 'partial_sort', 'nth_element', 'reverse', 'rotate',
      'binary_search', 'lower_bound', 'upper_bound', 'equal_range',
      'make_heap', 'push_heap', 'pop_heap', 'sort_heap',
      'begin', 'end', 'size', 'empty', 'clear', 'resize'
    ];

    patterns.forEach(op => {
      if (line.includes(op)) {
        operations.push(op);
      }
    });

    return operations;
  }

  /**
   * Get complexity for STL operations
   */
  private getSTLOperationComplexity(functionName: string, line: string): ComplexityInfo {
    const stlComplexities: { [key: string]: { time: string; space: string; confidence: number } } = {
      'push_back': { time: 'O(1)', space: 'O(1)', confidence: 0.9 },
      'push_front': { time: 'O(1)', space: 'O(1)', confidence: 0.9 },
      'pop_back': { time: 'O(1)', space: 'O(1)', confidence: 1.0 },
      'pop_front': { time: 'O(1)', space: 'O(1)', confidence: 1.0 },
      'insert': { time: 'O(n)', space: 'O(1)', confidence: 0.8 },
      'erase': { time: 'O(n)', space: 'O(1)', confidence: 0.8 },
      'find': { time: 'O(n)', space: 'O(1)', confidence: 0.9 },
      'sort': { time: 'O(n log n)', space: 'O(log n)', confidence: 1.0 },
      'stable_sort': { time: 'O(n log n)', space: 'O(n)', confidence: 1.0 },
      'binary_search': { time: 'O(log n)', space: 'O(1)', confidence: 1.0 },
      'lower_bound': { time: 'O(log n)', space: 'O(1)', confidence: 1.0 },
      'upper_bound': { time: 'O(log n)', space: 'O(1)', confidence: 1.0 },
      'make_heap': { time: 'O(n)', space: 'O(1)', confidence: 1.0 },
      'push_heap': { time: 'O(log n)', space: 'O(1)', confidence: 1.0 },
      'pop_heap': { time: 'O(log n)', space: 'O(1)', confidence: 1.0 },
      'reverse': { time: 'O(n)', space: 'O(1)', confidence: 1.0 },
      'rotate': { time: 'O(n)', space: 'O(1)', confidence: 1.0 }
    };

    const complexity = stlComplexities[functionName];
    if (complexity) {
      return {
        timeComplexity: complexity.time,
        spaceComplexity: complexity.space,
        factors: [functionName],
        confidence: complexity.confidence,
        isExact: true
      };
    }

    // Default for unknown function calls
    return {
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(1)',
      factors: [functionName],
      confidence: 0.5,
      isExact: false
    };
  }

  /**
   * Parse return statements
   */
  private parseReturnStatement(line: string): ASTNode {
    return {
      type: 'return',
      children: [],
      complexity: { timeComplexity: 'O(1)', spaceComplexity: 'O(1)', factors: [], confidence: 1.0, isExact: true },
      metadata: { lineStart: this.currentLine, lineEnd: this.currentLine }
    };
  }

  /**
   * Helper methods for parsing structure
   */
  private findNextOpenBrace(): number {
    for (let i = this.currentLine; i < this.lines.length; i++) {
      if (this.lines[i].includes('{')) {
        return i;
      }
    }
    return -1;
  }

  private findMatchingCloseBrace(): number {
    let braceCount = 0;
    let foundOpen = false;
    
    for (let i = this.currentLine; i < this.lines.length; i++) {
      const line = this.lines[i];
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      
      if (openBraces > 0) foundOpen = true;
      braceCount += openBraces - closeBraces;
      
      if (foundOpen && braceCount === 0) {
        return i;
      }
    }
    return this.lines.length - 1;
  }

  /**
   * Check for recursion in function
   */
  private checkRecursion(functionName: string, startLine: number, endLine: number): boolean {
    for (let i = startLine; i <= endLine; i++) {
      if (this.lines[i] && this.lines[i].includes(`${functionName}(`)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Complexity calculation methods
   */
  private calculateProgramComplexity(node: ASTNode): ComplexityInfo {
    if (node.children.length === 0) {
      return { timeComplexity: 'O(1)', spaceComplexity: 'O(1)', factors: [], confidence: 1.0, isExact: true };
    }

    // Find the dominant complexity among all functions
    let maxTimeComplexity = 'O(1)';
    let maxSpaceComplexity = 'O(1)';
    let minConfidence = 1.0;
    const allFactors: string[] = [];

    node.children.forEach(child => {
      const childComplexity = child.complexity;
      if (this.isHigherComplexity(childComplexity.timeComplexity, maxTimeComplexity)) {
        maxTimeComplexity = childComplexity.timeComplexity;
      }
      if (this.isHigherComplexity(childComplexity.spaceComplexity, maxSpaceComplexity)) {
        maxSpaceComplexity = childComplexity.spaceComplexity;
      }
      minConfidence = Math.min(minConfidence, childComplexity.confidence);
      allFactors.push(...childComplexity.factors);
    });

    return {
      timeComplexity: maxTimeComplexity,
      spaceComplexity: maxSpaceComplexity,
      factors: [...new Set(allFactors)],
      confidence: minConfidence,
      isExact: false
    };
  }

  private calculateFunctionComplexity(node: ASTNode): ComplexityInfo {
    if (node.children.length === 0) {
      return { timeComplexity: 'O(1)', spaceComplexity: 'O(1)', factors: [], confidence: 1.0, isExact: true };
    }

    // Handle recursion
    if (node.metadata.isRecursive) {
      return this.calculateRecursiveComplexity(node);
    }

    // Calculate based on child complexities
    let resultTime = 'O(1)';
    let resultSpace = 'O(1)';
    let minConfidence = 1.0;
    const allFactors: string[] = [];

    node.children.forEach(child => {
      if (child.type === 'loop') {
        // Nested loops multiply complexities
        resultTime = this.multiplyComplexities(resultTime, child.complexity.timeComplexity);
      } else {
        // Sequential operations take the maximum
        if (this.isHigherComplexity(child.complexity.timeComplexity, resultTime)) {
          resultTime = child.complexity.timeComplexity;
        }
      }
      
      if (this.isHigherComplexity(child.complexity.spaceComplexity, resultSpace)) {
        resultSpace = child.complexity.spaceComplexity;
      }
      
      minConfidence = Math.min(minConfidence, child.complexity.confidence);
      allFactors.push(...child.complexity.factors);
    });

    return {
      timeComplexity: resultTime,
      spaceComplexity: resultSpace,
      factors: [...new Set(allFactors)],
      confidence: minConfidence,
      isExact: false
    };
  }

  private calculateLoopComplexity(node: ASTNode): ComplexityInfo {
    const pattern = node.metadata.iterationPattern;
    let baseTimeComplexity = 'O(n)';
    
    // Adjust base complexity based on iteration pattern
    switch (pattern) {
      case 'logarithmic':
        baseTimeComplexity = 'O(log n)';
        break;
      case 'quadratic':
        baseTimeComplexity = 'O(n²)';
        break;
      case 'exponential':
        baseTimeComplexity = 'O(2^n)';
        break;
      default:
        baseTimeComplexity = 'O(n)';
    }

    // Calculate body complexity
    let bodyComplexity = 'O(1)';
    let spaceComplexity = 'O(1)';
    let minConfidence = 0.8;
    const allFactors: string[] = [];

    node.children.forEach(child => {
      if (this.isHigherComplexity(child.complexity.timeComplexity, bodyComplexity)) {
        bodyComplexity = child.complexity.timeComplexity;
      }
      if (this.isHigherComplexity(child.complexity.spaceComplexity, spaceComplexity)) {
        spaceComplexity = child.complexity.spaceComplexity;
      }
      minConfidence = Math.min(minConfidence, child.complexity.confidence);
      allFactors.push(...child.complexity.factors);
    });

    // Multiply loop complexity with body complexity
    const finalTimeComplexity = this.multiplyComplexities(baseTimeComplexity, bodyComplexity);

    return {
      timeComplexity: finalTimeComplexity,
      spaceComplexity,
      factors: [...new Set(allFactors), node.metadata.loopType || 'loop'],
      confidence: minConfidence,
      isExact: false
    };
  }

  private calculateConditionalComplexity(node: ASTNode): ComplexityInfo {
    if (node.children.length === 0) {
      return { timeComplexity: 'O(1)', spaceComplexity: 'O(1)', factors: [], confidence: 1.0, isExact: true };
    }

    // Conditionals take the maximum complexity of their branches
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

  private calculateRecursiveComplexity(node: ASTNode): ComplexityInfo {
    // Analyze recursion pattern based on recursive calls and problem size reduction
    const functionBody = this.lines.slice(node.metadata.lineStart, node.metadata.lineEnd + 1).join(' ');
    
    // Count recursive calls
    const recursiveCalls = (functionBody.match(new RegExp(node.name || '', 'g')) || []).length - 1; // Subtract 1 for function definition
    
    // Check for divide and conquer patterns
    if (recursiveCalls >= 2 && (functionBody.includes('/2') || functionBody.includes('>>1') || functionBody.includes('mid'))) {
      if (functionBody.includes('merge') || functionBody.includes('sort')) {
        return {
          timeComplexity: 'O(n log n)',
          spaceComplexity: 'O(n)',
          factors: ['recursive', 'divide-and-conquer', 'merge'],
          confidence: 0.9,
          isExact: false
        };
      } else {
        return {
          timeComplexity: 'O(log n)',
          spaceComplexity: 'O(log n)',
          factors: ['recursive', 'divide-and-conquer'],
          confidence: 0.8,
          isExact: false
        };
      }
    }
    
    // Binary tree recursion (like Fibonacci)
    if (recursiveCalls >= 2 && (functionBody.includes('-1') || functionBody.includes('n-1'))) {
      return {
        timeComplexity: 'O(2^n)',
        spaceComplexity: 'O(n)',
        factors: ['recursive', 'binary-tree'],
        confidence: 0.9,
        isExact: false
      };
    }
    
    // Linear recursion
    if (recursiveCalls === 1) {
      return {
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        factors: ['recursive', 'linear'],
        confidence: 0.8,
        isExact: false
      };
    }

    // Default recursive case
    return {
      timeComplexity: 'O(2^n)',
      spaceComplexity: 'O(n)',
      factors: ['recursive'],
      confidence: 0.6,
      isExact: false
    };
  }

  /**
   * Utility methods for complexity comparison and calculation
   */
  private isHigherComplexity(complexity1: string, complexity2: string): boolean {
    const order = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(2^n)', 'O(n!)'];
    const index1 = order.findIndex(c => complexity1.includes(c.replace(/[()]/g, '')));
    const index2 = order.findIndex(c => complexity2.includes(c.replace(/[()]/g, '')));
    return index1 > index2;
  }

  private multiplyComplexities(complexity1: string, complexity2: string): string {
    // Simplified complexity multiplication
    if (complexity1 === 'O(1)') return complexity2;
    if (complexity2 === 'O(1)') return complexity1;
    
    const multiplications: { [key: string]: string } = {
      'O(log n)O(log n)': 'O(log² n)',
      'O(log n)O(n)': 'O(n log n)',
      'O(log n)O(n log n)': 'O(n log² n)',
      'O(n)O(n)': 'O(n²)',
      'O(n)O(n log n)': 'O(n² log n)',
      'O(n)O(n²)': 'O(n³)',
      'O(n log n)O(n log n)': 'O(n² log² n)'
    };

    const key = complexity1 + complexity2;
    return multiplications[key] || 'O(n²)'; // Default to quadratic for unknown combinations
  }
}