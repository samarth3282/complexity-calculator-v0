"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ComplexityChart } from "@/components/complexity-chart"
import { ComplexityExamples } from "@/components/complexity-examples"
import { Calculator, Code, BarChart3, BookOpen } from "lucide-react"

interface ComplexityResult {
  timeComplexity: string
  spaceComplexity: string
  explanation: string
  category: "excellent" | "good" | "fair" | "poor" | "terrible"
}

export function ComplexityCalculator() {
  const [code, setCode] = useState("")
  const [result, setResult] = useState<ComplexityResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const analyzeComplexity = async () => {
    if (!code.trim()) return

    setIsAnalyzing(true)

    // Simulate analysis delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Simple pattern matching for demo purposes
    const analysis = analyzeCodePatterns(code)
    setResult(analysis)
    setIsAnalyzing(false)
  }

  const analyzeCodePatterns = (code: string): ComplexityResult => {
    const lowerCode = code.toLowerCase()
    
    // Remove comments and strings to avoid false positives
    const cleanCode = lowerCode
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .replace(/["'`](?:[^"'`\\]|\\.)*["'`]/g, '') // Remove strings

    // More comprehensive loop detection patterns
    const loopPatterns = [
      /\bfor\s*\(/g, // for loops (C/C++/JS)
      /\bwhile\s*\(/g, // while loops
      /\bdo\s*{[\s\S]*?}\s*while/g, // do-while loops
      /\.forEach\s*\(/g, // forEach (JS)
      /\.map\s*\(/g, // map (JS)
      /\.filter\s*\(/g, // filter (JS)
      /\.reduce\s*\(/g, // reduce (JS)
      /\.find\s*\(/g, // find (JS)
      /\.some\s*\(/g, // some (JS)
      /\.every\s*\(/g, // every (JS)
      /\bfor\s*\.\.\.\s*of\b/g, // for...of (JS)
      /\bfor\s*\.\.\.\s*in\b/g, // for...in (JS)
      /for\s*\(\s*\w+\s*:\s*\w+\s*\)/g, // range-based for (C++11)
    ]

    // Count all loop occurrences
    let totalLoops = 0
    loopPatterns.forEach(pattern => {
      const matches = cleanCode.match(pattern) || []
      totalLoops += matches.length
    })

    // Detect nested loops by counting brackets and loop keywords
    const nestedLoops = countNestedLoops(cleanCode)
    
    // Better recursion detection
    const hasRecursion = detectRecursion(cleanCode)
    
    // Detect specific algorithm patterns
    const algorithmPattern = detectAlgorithmPatterns(cleanCode)

    // Determine complexity based on analysis
    if (algorithmPattern) {
      return algorithmPattern
    } else if (nestedLoops >= 3) {
      return {
        timeComplexity: "O(n³) or higher",
        spaceComplexity: "O(1) to O(n)",
        explanation: "Three or more nested loops detected. This creates cubic or higher time complexity.",
        category: "terrible",
      }
    } else if (nestedLoops === 2) {
      return {
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1) to O(n)",
        explanation: "Two nested loops detected. This creates quadratic time complexity.",
        category: "poor",
      }
    } else if (hasRecursion) {
      const recursionType = analyzeRecursionType(cleanCode)
      return recursionType
    } else if (totalLoops > 0) {
      return {
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        explanation: `${totalLoops} loop(s) detected. This creates linear time complexity.`,
        category: "good",
      }
    } else {
      return {
        timeComplexity: "O(1)",
        spaceComplexity: "O(1)",
        explanation: "No loops or recursion detected. This appears to be constant time.",
        category: "excellent",
      }
    }
  }

  // Helper function to count nested loops more accurately
  const countNestedLoops = (code: string): number => {
    const lines = code.split('\n')
    let maxNesting = 0
    let currentNesting = 0
    let braceDepth = 0

    for (const line of lines) {
      const trimmed = line.trim()
      
      // Count opening braces
      const openBraces = (trimmed.match(/{/g) || []).length
      const closeBraces = (trimmed.match(/}/g) || []).length
      braceDepth += openBraces - closeBraces

      // Check if this line contains a loop
      const isLoop = /\b(for|while|do)\b/.test(trimmed) || 
                    /\.(forEach|map|filter|reduce)\s*\(/.test(trimmed)

      if (isLoop) {
        currentNesting++
        maxNesting = Math.max(maxNesting, currentNesting)
      }

      // Reset nesting when we exit a block
      if (closeBraces > 0 && braceDepth < currentNesting) {
        currentNesting = Math.max(0, braceDepth)
      }
    }

    return maxNesting
  }

  // Improved recursion detection
  const detectRecursion = (code: string): boolean => {
    // Look for JavaScript/TypeScript function definitions
    const functionMatches = code.match(/function\s+(\w+)/g) || []
    const arrowFunctionMatches = code.match(/const\s+(\w+)\s*=/g) || []
    
    // Look for C/C++ function definitions
    const cppFunctionMatches = code.match(/(?:void|int|float|double|char|string|vector<.*?>)\s+(\w+)\s*\(/g) || []
    
    // Check JavaScript/TypeScript functions
    for (const match of functionMatches) {
      const funcName = match.match(/function\s+(\w+)/)?.[1]
      if (funcName && code.includes(`${funcName}(`)) {
        const funcStart = code.indexOf(match)
        const funcBody = code.substring(funcStart)
        const nextFunction = funcBody.indexOf('function', 1)
        const funcCode = nextFunction > 0 ? funcBody.substring(0, nextFunction) : funcBody
        
        if (funcCode.includes(`${funcName}(`)) {
          return true
        }
      }
    }

    // Check C/C++ functions
    for (const match of cppFunctionMatches) {
      const funcName = match.match(/\b(\w+)\s*\(/)?.[1]
      if (funcName && funcName !== 'if' && funcName !== 'while' && funcName !== 'for') {
        // Look for recursive calls within the function
        const funcPattern = new RegExp(`\\b${funcName}\\s*\\(`, 'g')
        const matches = code.match(funcPattern) || []
        if (matches.length > 1) { // More than one occurrence means recursion
          return true
        }
      }
    }

    // Check for recursive patterns in arrow functions
    return /(\w+)\s*=.*=>\s*{[\s\S]*?\1\s*\(/.test(code)
  }

  // Analyze recursion type for better complexity estimation
  const analyzeRecursionType = (code: string): ComplexityResult => {
    // Check if this is already handled by specific algorithm detection
    const algorithmResult = detectAlgorithmPatterns(code)
    if (algorithmResult) {
      return algorithmResult
    }

    // Count recursive calls in the same function
    const recursiveCallCount = countRecursiveCalls(code)
    
    // Binary tree recursion (like fibonacci) - multiple recursive calls with simple operations
    if (recursiveCallCount >= 2 && (/\breturn.*\+.*\(/g.test(code) || /\breturn.*\*.*\(/g.test(code)) && 
        /\w+\s*\(\s*\w+\s*-\s*1/.test(code)) {
      return {
        timeComplexity: "O(2ⁿ)",
        spaceComplexity: "O(n)",
        explanation: "Binary recursion detected (like Fibonacci). Multiple recursive calls create exponential time complexity.",
        category: "terrible",
      }
    }
    
    // Divide and conquer with linear work (like merge sort) - multiple recursive calls with mid calculation
    if (recursiveCallCount >= 2 && (/\/\s*2/.test(code) || />>>\s*1/.test(code) || /mid/.test(code))) {
      return {
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(log n) to O(n)",
        explanation: "Divide and conquer recursion with linear work detected. Multiple recursive calls on halved input with additional processing.",
        category: "good",
      }
    }

    // Simple divide and conquer (like binary search) - single recursive call
    if (recursiveCallCount === 1 && (/\/\s*2/.test(code) || />>>\s*1/.test(code))) {
      return {
        timeComplexity: "O(log n)",
        spaceComplexity: "O(log n)",
        explanation: "Simple divide and conquer recursion detected. Single recursive call on halved input.",
        category: "excellent",
      }
    }

    // Linear recursion - single recursive call with linear reduction
    if (recursiveCallCount === 1) {
      return {
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        explanation: "Linear recursion detected. Single recursive call with linear reduction in problem size.",
        category: "fair",
      }
    }

    // Multiple recursive calls without clear pattern
    if (recursiveCallCount > 1) {
      return {
        timeComplexity: "O(2ⁿ) or higher",
        spaceComplexity: "O(n)",
        explanation: "Multiple recursive calls detected. This typically creates exponential time complexity.",
        category: "terrible",
      }
    }

    // Default case
    return {
      timeComplexity: "O(n)",
      spaceComplexity: "O(n)",
      explanation: "Recursion detected. Time complexity depends on recursion depth and work per call.",
      category: "fair",
    }
  }

  // Helper function to count recursive calls in functions
  const countRecursiveCalls = (code: string): number => {
    // Extract function names and count their recursive calls
    const funcNames = [
      ...(code.match(/function\s+(\w+)/g) || []).map(m => m.match(/function\s+(\w+)/)?.[1]),
      ...(code.match(/(?:void|int|float|double|char|string|vector<.*?>)\s+(\w+)\s*\(/g) || [])
        .map(m => m.match(/\b(\w+)\s*\(/)?.[1])
        .filter(name => name && !['if', 'while', 'for', 'return'].includes(name))
    ].filter(Boolean) as string[]

    let maxRecursiveCalls = 0
    
    for (const funcName of funcNames) {
      const pattern = new RegExp(`\\b${funcName}\\s*\\(`, 'g')
      const matches = code.match(pattern) || []
      // Subtract 1 for the function definition itself
      const recursiveCalls = Math.max(0, matches.length - 1)
      maxRecursiveCalls = Math.max(maxRecursiveCalls, recursiveCalls)
    }

    return maxRecursiveCalls
  }

  // Detect specific algorithm patterns
  const detectAlgorithmPatterns = (code: string): ComplexityResult | null => {
    // Merge Sort pattern detection
    if (isMergeSort(code)) {
      return {
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n)",
        explanation: "Merge sort algorithm detected. Divides array in half recursively and merges sorted halves, creating O(n log n) time complexity.",
        category: "good",
      }
    }

    // Quick Sort pattern detection
    if (isQuickSort(code)) {
      return {
        timeComplexity: "O(n log n) average, O(n²) worst",
        spaceComplexity: "O(log n)",
        explanation: "Quick sort algorithm detected. Uses divide-and-conquer with partitioning, average case O(n log n).",
        category: "good",
      }
    }

    // Binary search pattern (more specific than merge sort mid calculation)
    if (isBinarySearch(code)) {
      return {
        timeComplexity: "O(log n)",
        spaceComplexity: "O(1)",
        explanation: "Binary search pattern detected. This creates logarithmic time complexity.",
        category: "excellent",
      }
    }

    // Heap sort pattern
    if (isHeapSort(code)) {
      return {
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(1)",
        explanation: "Heap sort algorithm detected. Uses heap data structure for O(n log n) sorting.",
        category: "good",
      }
    }

    // Built-in sorting algorithms
    if (/\.sort\s*\(/.test(code)) {
      return {
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(1) to O(n)",
        explanation: "Built-in sort method detected. Most modern implementations use O(n log n) algorithms.",
        category: "good",
      }
    }

    return null
  }

  // Helper function to detect merge sort specifically
  const isMergeSort = (code: string): boolean => {
    const hasMergeFunction = /merge\s*\(/.test(code)
    const hasMidCalculation = /mid\s*=.*\/\s*2/.test(code) || /mid\s*=.*\>\>\>\s*1/.test(code)
    const hasRecursiveCalls = /mergesort.*mergesort/i.test(code) || 
                             code.split(/mergesort\s*\(/i).length > 2
    const hasMergeCall = /merge\s*\(/i.test(code)
    const hasArrayMerging = /temp|aux/i.test(code) || /push_back|push/i.test(code)
    
    // Look for typical merge sort patterns
    const hasLeftRight = /\b(left|right)\b/.test(code) && /\b(low|high|mid)\b/.test(code)
    const hasWhileLoops = /while\s*\(/.test(code)
    
    return hasMergeFunction && hasMidCalculation && hasRecursiveCalls && 
           (hasMergeCall || hasArrayMerging) && hasLeftRight && hasWhileLoops
  }

  // Helper function to detect quick sort
  const isQuickSort = (code: string): boolean => {
    const hasPartition = /partition\s*\(/i.test(code)
    const hasPivot = /pivot/i.test(code)
    const hasRecursiveCalls = /quicksort.*quicksort/i.test(code) || 
                             code.split(/quicksort\s*\(/i).length > 2
    const hasSwapping = /swap\s*\(|temp\s*=/i.test(code)
    
    return (hasPartition || hasPivot) && hasRecursiveCalls && hasSwapping
  }

  // Helper function to detect binary search (more specific)
  const isBinarySearch = (code: string): boolean => {
    const hasMidCalculation = /mid\s*=.*\/\s*2/.test(code) || /mid\s*=.*\>\>\>\s*1/.test(code)
    const hasLeftRight = /\b(left|right)\b.*\bmid\b/.test(code)
    const hasTargetComparison = /target|key|search/i.test(code)
    const hasWhileLoop = /while\s*\(.*left.*right/.test(code)
    const noMergeFunction = !/merge\s*\(/i.test(code)
    const noRecursiveCalls = !/binarysearch.*binarysearch/i.test(code)
    
    return hasMidCalculation && hasLeftRight && hasTargetComparison && 
           hasWhileLoop && noMergeFunction && noRecursiveCalls
  }

  // Helper function to detect heap sort
  const isHeapSort = (code: string): boolean => {
    const hasHeapify = /heapify/i.test(code)
    const hasHeap = /heap/i.test(code)
    const hasParentChild = /parent|child/i.test(code) || /2\s*\*\s*i/i.test(code)
    
    return hasHeapify || (hasHeap && hasParentChild)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "excellent":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "good":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "fair":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "poor":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "terrible":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const resetCalculator = () => {
    setCode("")
    setResult(null)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Tabs defaultValue="calculator" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculator
          </TabsTrigger>
          <TabsTrigger value="visualization" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Visualization
          </TabsTrigger>
          <TabsTrigger value="examples" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Examples
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Code Input
                </CardTitle>
                <CardDescription>Paste your algorithm or code snippet below for analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="// Enter your code here - try these examples:

// Example 1: Nested loops (O(n²))
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
    console.log(i, j);
  }
}

// Example 2: Array methods (O(n))
arr.forEach(item => console.log(item));

// Example 3: Binary search (O(log n))
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button onClick={analyzeComplexity} disabled={!code.trim() || isAnalyzing} className="flex-1">
                    {isAnalyzing ? "Analyzing..." : "Analyze Complexity"}
                  </Button>
                  <Button variant="outline" onClick={resetCalculator}>
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>Big O notation and complexity analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Time Complexity</label>
                        <div className="text-2xl font-mono font-bold text-primary">{result.timeComplexity}</div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Space Complexity</label>
                        <div className="text-2xl font-mono font-bold text-primary">{result.spaceComplexity}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Performance Category</label>
                      <Badge className={getCategoryColor(result.category)}>
                        {result.category.charAt(0).toUpperCase() + result.category.slice(1)}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Explanation</label>
                      <p className="text-sm text-foreground leading-relaxed">{result.explanation}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter your code above and click "Analyze Complexity" to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="visualization">
          <ComplexityChart />
        </TabsContent>

        <TabsContent value="examples">
          <ComplexityExamples />
        </TabsContent>
      </Tabs>
    </div>
  )
}
