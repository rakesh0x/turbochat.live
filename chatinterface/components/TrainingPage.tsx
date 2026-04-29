import { Download, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TrainingPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-3xl border border-white/80 bg-gradient-to-br from-white via-emerald-50 to-teal-50 p-6 shadow-xl shadow-emerald-100/70 dark:border-slate-800/80 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 dark:shadow-none">
        <h2 className="text-xl font-semibold tracking-tight">Training Studio</h2>
        <p className="mt-1 text-sm text-muted-foreground">Feed your assistant with fresh docs, URLs, and product updates to improve response quality.</p>
      </section>

      <Card className="border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>Add content to improve your chatbot</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl border-slate-300/80 bg-white/85 dark:border-slate-700 dark:bg-slate-900/70">
              <Globe className="w-6 h-6" />
              <span>Add Website</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl border-slate-300/80 bg-white/85 dark:border-slate-700 dark:bg-slate-900/70">
              <Download className="w-6 h-6" />
              <span>Upload Files</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
