import { ComplexityCalculator } from "@/components/complexity-calculator"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Complexity Calculator</h1>
            <p className="text-sm text-muted-foreground">Analyze algorithmic complexity with Big O notation</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <ComplexityCalculator />
      </main>
    </div>
  )
}
