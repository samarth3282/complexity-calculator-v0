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
        code: `#include <vector>
using namespace std;

int getElement(vector<int>& arr, int index) {
    return arr[index]; // Direct access - O(1)
}`,
        explanation: "Accessing an array element by index is always O(1)",
      },
      {
        name: "Simple Math",
        code: `int constantTimeFunction(int a, int b) {
    int sum = a + b;
    int product = a * b;
    return sum * product;
}`,
        explanation: "Basic arithmetic operations are constant time",
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
        code: `#include <vector>
using namespace std;

int binarySearch(vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
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
        code: `#include <vector>
using namespace std;

int sumArray(vector<int>& arr) {
    int sum = 0;
    for (int i = 0; i < arr.size(); i++) {
        sum += arr[i];
    }
    return sum;
}`,
        explanation: "Each element is visited exactly once",
      },
      {
        name: "Linear Search",
        code: `#include <vector>
using namespace std;

int linearSearch(vector<int>& arr, int target) {
    for (int i = 0; i < arr.size(); i++) {
        if (arr[i] == target) {
            return i;
        }
    }
    return -1;
}`,
        explanation: "In worst case, we check every element",
      },
    ],
  },
  nlogn: {
    title: "O(n log n) - Linearithmic Time",
    description: "Efficient divide-and-conquer algorithms",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    examples: [
      {
        name: "Merge Sort",
        code: `#include <vector>
using namespace std;

void merge(vector<int>& arr, int left, int mid, int right) {
    vector<int> temp(right - left + 1);
    int i = left, j = mid + 1, k = 0;
    
    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j]) {
            temp[k++] = arr[i++];
        } else {
            temp[k++] = arr[j++];
        }
    }
    
    while (i <= mid) temp[k++] = arr[i++];
    while (j <= right) temp[k++] = arr[j++];
    
    for (int i = 0; i < k; i++) {
        arr[left + i] = temp[i];
    }
}

void mergeSort(vector<int>& arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}`,
        explanation: "Divides array in half (log n levels) and merges in O(n) time",
      },
    ],
  },
  quadratic: {
    title: "O(n²) - Quadratic Time",
    description: "Algorithms with nested loops over the input",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    examples: [
      {
        name: "Bubble Sort",
        code: `#include <vector>
using namespace std;

void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
            }
        }
    }
}`,
        explanation: "Nested loops create n × n operations",
      },
      {
        name: "Find All Pairs",
        code: `#include <vector>
using namespace std;

vector<pair<int, int>> findAllPairs(vector<int>& arr) {
    vector<pair<int, int>> pairs;
    for (int i = 0; i < arr.size(); i++) {
        for (int j = i + 1; j < arr.size(); j++) {
            pairs.push_back({arr[i], arr[j]});
        }
    }
    return pairs;
}`,
        explanation: "Generates all possible pairs from the array",
      },
    ],
  },
  exponential: {
    title: "O(2ⁿ) - Exponential Time",
    description: "Algorithms that explore all possible combinations",
    color: "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100",
    examples: [
      {
        name: "Fibonacci (Naive)",
        code: `int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}`,
        explanation: "Each call branches into two recursive calls",
      },
      {
        name: "Power Set",
        code: `#include <vector>
#include <string>
using namespace std;

void generateSubsets(string s, int index, string current, vector<string>& result) {
    if (index == s.length()) {
        result.push_back(current);
        return;
    }
    
    generateSubsets(s, index + 1, current + s[index], result);
    generateSubsets(s, index + 1, current, result);
}

vector<string> powerSet(string s) {
    vector<string> result;
    generateSubsets(s, 0, "", result);
    return result;
}`,
        explanation: "Generates all 2^n possible subsets",
      },
    ],
  },
}

export function ComplexityExamples() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>C++ Test Examples</CardTitle>
          <CardDescription>
            Copy these examples to test your complexity calculator with different complexity classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="constant" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="constant">O(1)</TabsTrigger>
              <TabsTrigger value="logarithmic">O(log n)</TabsTrigger>
              <TabsTrigger value="linear">O(n)</TabsTrigger>
              <TabsTrigger value="nlogn">O(n log n)</TabsTrigger>
              <TabsTrigger value="quadratic">O(n²)</TabsTrigger>
              <TabsTrigger value="exponential">O(2ⁿ)</TabsTrigger>
            </TabsList>

            {Object.entries(examples).map(([key, category]) => (
              <TabsContent key={key} value={key} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className={category.color}>
                    {category.title}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {category.description}
                  </span>
                </div>

                <div className="grid gap-4">
                  {category.examples.map((example, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg">{example.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
                          <code>{example.code}</code>
                        </pre>
                        <p className="text-sm text-muted-foreground">
                          {example.explanation}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}