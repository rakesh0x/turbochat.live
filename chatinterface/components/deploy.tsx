"use client";

import { useState, useEffect } from "react";
import posthog from "posthog-js";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lineicons } from "@lineiconshq/react-lineicons";
import { Spinner3Outlined, Globe1Outlined, GithubOutlined, Rocket5Outlined, CopyAiOutlined, Download1Outlined } from "@lineiconshq/free-icons";

export function DeployPage({ chatbot }: { chatbot: any }) {
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [isSharePublic, setIsSharePublic] = useState(false);
  const [host, setHost] = useState('');

  useEffect(() => {
    setHost(window.location.origin);
  }, []);

  useEffect(() => {
    const loadShareState = async () => {
      if (!chatbot?.id) return;
      try {
        const response = await fetch(`/api/chatbots/${chatbot.id}/share`);
        if (!response.ok) return;
        const data = await response.json();
        setShareSlug(data?.shareSlug || null);
        setIsSharePublic(Boolean(data?.isPublic));
      } catch {
        // best-effort share status load
      }
    };

    loadShareState();
  }, [chatbot?.id]);

  const reliableHost = host.replace('localhost', '127.0.0.1');
  const hostedShareUrl = shareSlug ? `${host}/share/${shareSlug}` : '';

  const handleCopy = (code: string): void => {
    navigator.clipboard.writeText(code);
    toast.success('Copied to clipboard');
  };

  const handlePublishHosted = async () => {
    if (!chatbot?.id) return;
    setShareLoading(true);
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/share/publish`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || data?.message || 'Failed to publish hosted page');
      setShareSlug(data?.shareSlug || null);
      setIsSharePublic(true);
      posthog.capture("chatbot_published", {
        chatbot_id: chatbot?.id,
        chatbot_name: chatbot?.name,
        share_slug: data?.shareSlug,
      })
      toast.success('Hosted chatbot page published');
    } catch (error: any) {
      posthog.captureException(error)
      toast.error(error?.message || 'Failed to publish hosted page');
    } finally {
      setShareLoading(false);
    }
  };

  const handleUnpublishHosted = async () => {
    if (!chatbot?.id) return;
    setShareLoading(true);
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/share/unpublish`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || data?.message || 'Failed to unpublish hosted page');
      setIsSharePublic(false);
      posthog.capture("chatbot_unpublished", {
        chatbot_id: chatbot?.id,
        chatbot_name: chatbot?.name,
      })
      toast.success('Hosted chatbot page unpublished');
    } catch (error: any) {
      posthog.captureException(error)
      toast.error(error?.message || 'Failed to unpublish hosted page');
    } finally {
      setShareLoading(false);
    }
  };

  if (!chatbot) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-muted-foreground">Please select a chatbot to deploy</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Tabs defaultValue="html" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 gap-2 rounded-2xl border border-white/80 bg-white/80 p-2 backdrop-blur md:grid-cols-2 dark:border-slate-800/80 dark:bg-slate-900/70">
          <TabsTrigger value="html">HTML</TabsTrigger>
          <TabsTrigger value="publish">Publish</TabsTrigger>
        </TabsList>

        <TabsContent value="publish" className="space-y-4">
          <Card className="border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
            <CardHeader>
              <CardTitle>Publish Hosted Mini Site</CardTitle>
              <CardDescription>Publish a live share page for this chatbot with one click.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Visibility</p>
                  <p className="text-xs text-muted-foreground">
                    {isSharePublic ? 'Public link is active' : 'Public link is currently private'}
                  </p>
                </div>
                <Badge variant={isSharePublic ? 'default' : 'secondary'}>
                  {isSharePublic ? 'Published' : 'Unpublished'}
                </Badge>
              </div>

              {hostedShareUrl ? (
                <div className="relative">
                  <pre className="overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-950 p-4 text-sm text-slate-100 dark:border-slate-800">
                    <code>{hostedShareUrl}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute right-2 top-2"
                    onClick={() => handleCopy(hostedShareUrl)}
                  >
                    <Lineicons icon={CopyAiOutlined} size={16} />
                  </Button>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button onClick={handlePublishHosted} disabled={shareLoading} className="gap-2">
                  {shareLoading ? <Lineicons icon={Spinner3Outlined} size={16} className="animate-spin" /> : <Lineicons icon={Globe1Outlined} size={16} />}
                  Publish Mini Site
                </Button>
                <Button variant="outline" onClick={handleUnpublishHosted} disabled={shareLoading || !isSharePublic}>
                  Unpublish
                </Button>
                <Button
                  variant="outline"
                  onClick={() => hostedShareUrl && window.open(hostedShareUrl, '_blank', 'noopener,noreferrer')}
                  disabled={!hostedShareUrl || !isSharePublic}
                >
                  Open Live Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="html" className="space-y-4">
          <Card className="border-white/80 bg-white/90 shadow-xl shadow-slate-200/60 dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none">
            <CardHeader>
              <CardTitle>HTML Export</CardTitle>
              <CardDescription>Generate standalone files for simple website deployment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/70">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lineicons icon={GithubOutlined} size={20} className="text-primary" />
                  </div>
                  <h4 className="font-semibold text-sm">Option A: GitHub Repo</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Users can download this bundle, commit to GitHub, and enable GitHub Pages for instant hosting.
                  </p>
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => {
                    posthog.capture("chatbot_embed_downloaded", {
                      chatbot_id: chatbot?.id,
                      chatbot_name: chatbot?.name,
                      download_type: "github_repo_bundle",
                    })
                    const blob = new Blob([`# My Chatbot: ${chatbot.name}

This repository contains my AI Chatbot frontend, powered by [ChatBot AI RAG-as-a-Service].

## Deployment
1. Upload to GitHub.
2. Enable GitHub Pages.
3. Your bot is live!
`], { type: 'text/plain' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'README.md';
                    a.click();

                    // Also trigger the HTML download
                    setTimeout(() => {
                      const htmlBlob = new Blob([`<!DOCTYPE html><html><head><title>${chatbot.name}</title></head><body><script src="${reliableHost}/widget.js"></script><script>window.addEventListener('load', function(){ChatbotWidget.init({chatbotId: "${chatbot.id}", apiUrl: "${reliableHost}/api"});});</script></body></html>`], { type: 'text/html' });
                      const htmlUrl = window.URL.createObjectURL(htmlBlob);
                      const htmlA = document.createElement('a');
                      htmlA.href = htmlUrl;
                      htmlA.download = 'index.html';
                      htmlA.click();
                    }, 500);
                  }}>
                    <Lineicons icon={Download1Outlined} size={12} />
                    Download Repo Bundle
                  </Button>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-amber-50 p-4 dark:border-slate-800 dark:from-slate-900 dark:to-amber-950/20">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lineicons icon={Rocket5Outlined} size={20} className="text-primary" />
                  </div>
                  <h4 className="font-semibold text-sm">Option B: All-in-One Site</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A single HTML file containing both the structure and the interactive widget. Perfect for landing pages.
                  </p>
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => {
                    posthog.capture("chatbot_embed_downloaded", {
                      chatbot_id: chatbot?.id,
                      chatbot_name: chatbot?.name,
                      download_type: "all_in_one_html",
                    })
                    const htmlBlob = new Blob([`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${chatbot.name} - AI Chat</title>
    <style>
        body { margin: 0; font-family: system-ui; background: #000; color: #fff; height: 100vh; display: flex; align-items: center; justify-content: center; }
        .hero { text-align: center; }
        h1 { font-size: 3rem; margin-bottom: 0.5rem; }
        p { color: #888; }
    </style>
</head>
<body>
    <div class="hero">
        <h1>${chatbot.name}</h1>
        <p>AI Assistant Powered by RAG-as-a-Service</p>
    </div>
    <script src="${reliableHost}/widget.js"></script>
    <script>
        window.addEventListener('load', function() {
            ChatbotWidget.init({
                chatbotId: "${chatbot.id}",
                apiUrl: "${reliableHost}/api"
            });
        });
    </script>
</body>
</html>`], { type: 'text/html' });
                    const htmlUrl = window.URL.createObjectURL(htmlBlob);
                    const htmlA = document.createElement('a');
                    htmlA.href = htmlUrl;
                    htmlA.download = 'index.html';
                    htmlA.click();
                  }}>
                    <Lineicons icon={Download1Outlined} size={12} />
                    Export index.html
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div >
  );
}
