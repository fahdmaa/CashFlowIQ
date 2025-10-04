import Header from "@/components/header";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function Reports() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
          <Card className="w-full max-w-2xl p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Construction className="h-24 w-24 text-amber-500 animate-bounce" />
                <div className="absolute inset-0 h-24 w-24 text-amber-500/20 animate-ping">
                  <Construction className="h-24 w-24" />
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Under Construction
            </h1>

            <p className="text-lg text-gray-600 mb-6">
              We're building something awesome! The Reports page will be available soon.
            </p>

            <div className="flex flex-col gap-2 text-sm text-gray-500">
              <p className="flex items-center justify-center gap-2">
                <span className="inline-block w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                Advanced analytics and insights
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="inline-block w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-100"></span>
                Custom report generation
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="inline-block w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-200"></span>
                Export and sharing capabilities
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
