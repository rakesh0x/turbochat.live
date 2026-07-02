
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Lineicons } from "@lineiconshq/react-lineicons";
import { BotpressOutlined, Spinner3Outlined, MenuMeatballs1Outlined, PlayOutlined, PlusOutlined, RefreshCircle1ClockwiseOutlined, Trash3Outlined } from "@lineiconshq/free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import type { MyChatbotsPageProps } from "@/lib/interfaces";
import posthog from "posthog-js";

export default function MyChatbotsPage({
  chatbots,
  loading,
  onSelectChatbot,
  onRefresh,
  canCreateChatbot,
  onCreateChatbot,
}: MyChatbotsPageProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatbotToDelete, setChatbotToDelete] = useState<string | null>(null);
  const { data: session } = useSession();

  const handleDelete = async () => {
    try {
      await fetch(`/api/chatbots/${chatbotToDelete}`, {
        method: 'DELETE'
      });
      posthog.capture("chatbot_deleted", {
        chatbot_id: chatbotToDelete,
        user_email: session?.user?.email,
      });
      toast.success('Chatbot deleted');
      onRefresh();
    } catch (error) {
      posthog.captureException(error);
      toast.error('Failed to delete chatbot');
    }
    setDeleteDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Lineicons icon={Spinner3Outlined} size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (chatbots.length === 0) {
    return (
      <Card className="mx-auto max-w-2xl border-white/80 bg-gradient-to-br from-white via-slate-50 to-amber-50 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/20 dark:shadow-none">
        <CardContent className="pt-12 pb-12 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 shadow-lg shadow-slate-400/40 dark:from-slate-100 dark:to-slate-300">
            <Lineicons icon={BotpressOutlined} size={32} className="text-white dark:text-slate-900" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No chatbots yet</h3>
            <p className="text-muted-foreground text-sm mt-1">Create your first chatbot to get started</p>
          </div>
          <Button onClick={onCreateChatbot} disabled={!canCreateChatbot}>
            <Lineicons icon={PlusOutlined} size={16} className="mr-2" />
            Create Chatbot
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{chatbots.length} chatbots</p>
        <Button onClick={onRefresh} variant="outline" size="sm" className="rounded-xl border-slate-300/80 bg-white/85 dark:border-slate-700 dark:bg-slate-900/70">
          <Lineicons icon={RefreshCircle1ClockwiseOutlined} size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chatbots.map((bot) => (
          <Card key={bot.id} className="border-white/80 bg-white/90 shadow-lg shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-md shadow-slate-300/60 dark:from-slate-100 dark:to-slate-300 dark:text-slate-900 dark:shadow-none">
                    <Lineicons icon={BotpressOutlined} size={20} className="text-white dark:text-slate-900" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{bot.name}</CardTitle>
                    <CardDescription className="text-xs">{bot.website}</CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Lineicons icon={MenuMeatballs1Outlined} size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { posthog.capture("chatbot_selected", { chatbot_id: bot.id, chatbot_name: bot.name }); onSelectChatbot(bot); }}>
                      <Lineicons icon={PlayOutlined} size={16} className="mr-2" />
                      Test
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setChatbotToDelete(bot.id); setDeleteDialogOpen(true); }}>
                      <Lineicons icon={Trash3Outlined} size={16} className="mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={bot.status === 'active' ? 'default' : 'secondary'} className="text-xs capitalize rounded-full px-2.5">
                  {bot.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pages</span>
                <span className="stat-value font-medium">{bot.pagesScraped}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Messages</span>
                <span className="stat-value font-medium">{bot.monthlyMessages}</span>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Updated {new Date(bot.lastUpdated).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chatbot</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chatbot? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}