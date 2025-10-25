"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const complexityData = [
  { n: 1, "O(1)": 1, "O(log n)": 1, "O(n)": 1, "O(n log n)": 1, "O(n²)": 1, "O(2ⁿ)": 2 },
  { n: 2, "O(1)": 1, "O(log n)": 1, "O(n)": 2, "O(n log n)": 2, "O(n²)": 4, "O(2ⁿ)": 4 },
  { n: 4, "O(1)": 1, "O(log n)": 2, "O(n)": 4, "O(n log n)": 8, "O(n²)": 16, "O(2ⁿ)": 16 },
  { n: 8, "O(1)": 1, "O(log n)": 3, "O(n)": 8, "O(n log n)": 24, "O(n²)": 64, "O(2ⁿ)": 256 },
  { n: 16, "O(1)": 1, "O(log n)": 4, "O(n)": 16, "O(n log n)": 64, "O(n²)": 256, "O(2ⁿ)": 1000 },
  { n: 32, "O(1)": 1, "O(log n)": 5, "O(n)": 32, "O(n log n)": 160, "O(n²)": 1024, "O(2ⁿ)": 2000 },
]

export function ComplexityChart() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Big O Complexity Comparison</CardTitle>
          <CardDescription>Visual comparison of different time complexities as input size grows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={complexityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="n"
                  className="text-muted-foreground"
                  label={{ value: "Input Size (n)", position: "insideBottom", offset: -10 }}
                />
                <YAxis
                  className="text-muted-foreground"
                  label={{ value: "Operations", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Legend />
                {/* <div className="pt-1000"> */}
                <Line type="monotone" dataKey="O(1)" stroke="#10b981" strokeWidth={2}/>
                <Line type="monotone" dataKey="O(log n)" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="O(n)" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="O(n log n)" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="O(n²)" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="O(2ⁿ)" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" />
                {/* </div> */}
                
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            complexity: "O(1)",
            name: "Constant",
            color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            description: "Best case - execution time stays constant regardless of input size",
          },
          {
            complexity: "O(log n)",
            name: "Logarithmic",
            color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
            description: "Very efficient - execution time grows slowly with input size",
          },
          {
            complexity: "O(n)",
            name: "Linear",
            color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
            description: "Good - execution time grows proportionally with input size",
          },
          {
            complexity: "O(n log n)",
            name: "Linearithmic",
            color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
            description: "Fair - common in efficient sorting algorithms",
          },
          {
            complexity: "O(n²)",
            name: "Quadratic",
            color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
            description: "Poor - execution time grows quadratically with input size",
          },
          {
            complexity: "O(2ⁿ)",
            name: "Exponential",
            color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
            description: "Terrible - execution time doubles with each additional input",
          },
        ].map((item) => (
          <Card key={item.complexity}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className={`inline-block px-2 py-1 rounded text-sm font-mono font-bold ${item.color}`}>
                  {item.complexity}
                </div>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
