"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const examples = {
  constant: {
    title: "O(1) - Constant Time",
    description: "Operations that take the same amount of time regardless of input size",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    examples: [
      {
        name: "Array Access",
        code: `function getFirstElement(arr) {
  return arr[0]; // Always takes same time
}`,
        explanation: "Accessing an array element by index is always O(1)",
      },
      {
        name: "Hash Table Lookup",
        code: `function getValue(hashTable, key) {
  return hashTable[key]; // Direct access
}`,
        explanation: "Hash table lookups are typically O(1) on average",
      },
    ],
  },
  logarithmic: {
    title: "O(log n) - Logarithmic Time",
    description: "Algorithms that divide the problem in half each time",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    examples: [
      {
        name: "Binary Search",
        code: `function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
        explanation: "Each iteration eliminates half of the remaining elements",
      },
    ],
  },
  linear: {
    title: "O(n) - Linear Time",
    description: "Algorithms that process each element once",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    examples: [
      {
        name: "Array Sum",
        code: `function sumArray(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i]; // Visit each element once
  }
  return sum;
}`,
        explanation: "Must visit each element exactly once to calculate sum",
      },
      {
        name: "Linear Search",
        code: `function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}`,
        explanation: "In worst case, must check every element",
      },
    ],
  },
  quadratic: {
    title: "O(n²) - Quadratic Time",
    description: "Algorithms with nested loops over the input",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    examples: [
      {
        name: "Bubble Sort",
        code: `function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}`,
        explanation: "Nested loops create n × n operations",
      },
      {
        name: "Find Duplicates",
        code: `function findDuplicates(arr) {
  const duplicates = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) {
        duplicates.push(arr[i]);
      }
    }
  }
  return duplicates;
}`,
        explanation: "Comparing each element with every other element",
      },
    ],
  },
}

export function ComplexityExamples() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Common Algorithm Examples</CardTitle>
          <CardDescription>Real-world examples of different time complexities with code samples</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="constant" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="constant">O(1)</TabsTrigger>
          <TabsTrigger value="logarithmic">O(log n)</TabsTrigger>
          <TabsTrigger value="linear">O(n)</TabsTrigger>
          <TabsTrigger value="quadratic">O(n²)</TabsTrigger>
        </TabsList>

        {Object.entries(examples).map(([key, category]) => (
          <TabsContent key={key} value={key} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge className={category.color}>{category.title.split(" - ")[0]}</Badge>
                  <div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="grid gap-4">
              {category.examples.map((example, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-base">{example.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted rounded-lg p-4">
                      <pre className="text-sm font-mono overflow-x-auto">
                        <code>{example.code}</code>
                      </pre>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{example.explanation}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
