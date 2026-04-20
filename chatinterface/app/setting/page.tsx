import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "recharts";
import { Input } from "@/components/ui/input";
import { SelectIcon, } from "@radix-ui/react-select";
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/landing/components/ui/select";
import { Button } from "@/components/ui/button";

function SettingsPage({ chatbot }: { chatbot: any }) {
  if (!chatbot) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-muted-foreground">Please select a chatbot to configure</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Chatbot Name</Label>
            <Input defaultValue={chatbot.name} />
          </div>
          <div className="space-y-2">
            <Label>Website URL</Label>
            <Input defaultValue={chatbot.website} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
        <CardHeader>
          <CardTitle>AI Model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Model</Label>
            <Select defaultValue="gpt-4">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4 Turbo</SelectItem>
                <SelectItem value="gpt-3.5">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="claude">Claude 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/40 bg-destructive/5 shadow-lg shadow-red-100/60 dark:shadow-none">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <div className="font-medium text-sm">Delete Chatbot</div>
              <div className="text-xs text-muted-foreground">Permanently delete this chatbot</div>
            </div>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}
