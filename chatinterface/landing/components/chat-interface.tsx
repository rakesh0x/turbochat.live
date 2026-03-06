'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Plus,
  Bot,
  Database,
  PlayCircle,
  Rocket,
  BarChart3,
  CreditCard,
  Settings,
  Bell,
  Globe,
  Loader2,
  Check,
  Copy,
  Github,
  Download,
  Trash2,
  ExternalLink,
  Search,
  Zap,
  TrendingUp,
  MessageSquare,
  Activity,
  RefreshCw,
  Send,
  ArrowUpRight,
  MoreHorizontal,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/landing/lib/supabase/client';
import { Button } from '@/landing/components/ui/button';
import { Input } from '@/landing/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/landing/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/landing/components/ui/tabs';
import { Badge } from '@/landing/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/landing/components/ui/avatar';
import { Progress } from '@/landing/components/ui/progress';
import { Separator } from '@/landing/components/ui/separator';
import { ScrollArea } from '@/landing/components/ui/scroll-area';
import { toast } from 'sonner';
import { Toaster } from '@/landing/components/ui/sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/landing/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/landing/components/ui/select';
import { Textarea } from '@/landing/components/ui/textarea';
import { Switch } from '@/landing/components/ui/switch';
import { Label } from '@/landing/components/ui/label';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/landing/components/ui/dropdown-menu';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  id: string;
}

interface CopyHandlerParams {
  code: string;
}

interface Chatbot {
  id: string;
  name: string;
  website: string;
  status: 'active' | 'inactive' | 'training';
  pagesScraped: number;
  monthlyMessages: number;
  lastUpdated: string;
  model: string;
}

interface Stats {
  totalChatbots: number;
  totalPages: number;
  trainingBots: number;
  totalMessages: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Analytics {
  messagesOverTime: Array<{ date: string; messages: number }>;
  topQuestions: Array<{ question: string; count: number }>;
}

interface LogEntry {
  text: string;
  timestamp: string;
}

interface Plan {
  name: 'Free' | 'Pro' | 'Enterprise';
  price: string;
  popular?: boolean;
  features: string[];
}

interface CopyParams {
  code: string;
}

interface HandleCopyParams {
  code: string;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: Plus, label: 'Create Chatbot', id: 'create' },
  { icon: Bot, label: 'My Chatbots', id: 'chatbots' },
  { icon: Database, label: 'Training & Data', id: 'training' },
  { icon: PlayCircle, label: 'Playground', id: 'playground' },
  { icon: Rocket, label: 'Deploy', id: 'deploy' },
  { icon: BarChart3, label: 'Analytics', id: 'analytics' },
  { icon: CreditCard, label: 'Billing', id: 'billing' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

export function ChatInterface() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [selectedChatbot, setSelectedChatbot] = useState(null);
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [chatbotsRes, statsRes, analyticsRes] = await Promise.all([
        fetch('/api/chatbots'),
        fetch('/api/stats'),
        fetch('/api/analytics')
      ]);

      const chatbotsData = await chatbotsRes.json();
      const statsData = await statsRes.json();
      const analyticsData = await analyticsRes.json();

      setChatbots(Array.isArray(chatbotsData) ? chatbotsData : []);
      setStats(statsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Toaster />

      {/* Sidebar */}
      <aside className="w-64 border-r flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center px-6 border-b">
          <div className="flex items-center gap-2">

            <span className="font-semibold text-sm">Enclose AI</span>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? 'secondary' : 'ghost'}
                className="w-full justify-start text-sm font-normal h-9"
                onClick={() => setCurrentPage(item.id)}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </nav>
        </ScrollArea>

        {/* User Profile */}
        <div className="p-3 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start h-auto p-2">
                <Avatar className="w-7 h-7 mr-2">
                  <AvatarFallback className="text-xs">JD</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium truncate">Rakesh Jha</div>
                  <div className="text-xs text-muted-foreground truncate">john@example.com</div>
                </div>
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold">
              {menuItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
            </Button>
            <Button variant="outline" size="sm">
              <span className="text-sm">Workspace</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              <span className="text-sm">Logout</span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {currentPage === 'dashboard' && <DashboardPage stats={stats} chatbots={chatbots} loading={loading} />}
            {currentPage === 'create' && <CreateChatbotPage onComplete={() => { fetchData(); setCurrentPage('chatbots'); }} />}
            {currentPage === 'chatbots' && <MyChatbotsPage chatbots={chatbots} loading={loading} onSelectChatbot={(bot) => { setSelectedChatbot(bot); setCurrentPage('playground'); }} onRefresh={fetchData} />}
            {currentPage === 'playground' && <PlaygroundPage chatbot={selectedChatbot || chatbots[0]} />}
            {currentPage === 'deploy' && <DeployPage chatbot={selectedChatbot || chatbots[0]} />}
            {currentPage === 'analytics' && <AnalyticsPage analytics={analytics} />}
            {currentPage === 'billing' && <BillingPage />}
            {currentPage === 'settings' && <SettingsPage chatbot={selectedChatbot || chatbots[0]} />}
            {currentPage === 'training' && <TrainingPage />}
          </div>
        </main>
      </div>
    </div>
  );
}

// Dashboard Page
interface DashboardPageProps {
  stats: any;
  chatbots: any[];
  loading: boolean;
}

function DashboardPage({ stats, chatbots, loading }: DashboardPageProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chatbots</CardTitle>
            <Bot className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalChatbots || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages Scraped</CardTitle>
            <Globe className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPages || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">+45 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Status</CardTitle>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.trainingBots || 0} active</div>
            <p className="text-xs text-muted-foreground mt-1">2 completed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Messages</CardTitle>
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMessages?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">+12% vs last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Chatbots */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Chatbots</CardTitle>
              <Button variant="ghost" size="sm">View all</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chatbots?.slice(0, 5).map((bot) => (
                <div key={bot.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{bot.name}</div>
                      <div className="text-xs text-muted-foreground">{bot.website}</div>
                    </div>
                  </div>
                  <Badge variant={bot.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {bot.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create New Chatbot
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Import Data
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Github className="w-4 h-4 mr-2" />
              Clone to GitHub
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Create Chatbot Page
function CreateChatbotPage({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState('');
  const [chatbotName, setChatbotName] = useState('');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<Array<{ text: string; timestamp: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const simulateScraping = async () => {
    setIsProcessing(true);
    const steps = [
      { message: 'Validating URL...', progress: 10 },
      { message: 'Discovering pages...', progress: 25 },
      { message: 'Scraping content from 23 pages...', progress: 50 },
      { message: 'Processing and cleaning data...', progress: 70 },
      { message: 'Creating embeddings...', progress: 85 },
      { message: 'Training chatbot model...', progress: 95 },
      { message: 'Finalizing chatbot...', progress: 100 },
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLogs(prev => [...prev, { text: step.message, timestamp: new Date().toLocaleTimeString() }]);
      setProgress(step.progress);
    }

    try {
      const res = await fetch('/api/chatbots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: chatbotName, website: url })
      });

      if (!res.ok) throw new Error('Failed to create chatbot');

      setStep(3);
      toast.success('Chatbot created successfully!');

      setTimeout(() => {
        onComplete();
      }, 3000);
    } catch (error) {
      toast.error('Failed to create chatbot');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                <span className="text-xs text-muted-foreground mt-2">
                  {s === 1 ? 'Setup' : s === 2 ? 'Training' : 'Complete'}
                </span>
              </div>
              {i < 2 && (
                <div className={`flex-1 h-0.5 mx-2 ${step > s ? 'bg-primary' : 'bg-muted'
                  }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Enter URL */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Your Chatbot</CardTitle>
            <CardDescription>Enter your website URL and chatbot details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Chatbot Name</Label>
              <Input
                placeholder="Customer Support Bot"
                value={chatbotName}
                onChange={(e) => setChatbotName(e.target.value)}
              />
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <p className="text-sm text-muted-foreground">
                We'll scrape your website, process the content, and train an AI model. This usually takes 2-5 minutes.
              </p>
            </div>
          </CardContent>
          <CardContent className="pt-0">
            <Button
              onClick={() => { setStep(2); setTimeout(simulateScraping, 500); }}
              disabled={!url || !chatbotName}
              className="w-full"
            >
              Start Training
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Training */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Training in Progress</CardTitle>
            <CardDescription>This may take a few minutes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Training Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-1 font-mono text-xs">
                    {logs.map((log, i) => (
                      <div key={i} className="text-muted-foreground">
                        <span className="text-foreground">[{log.timestamp}]</span> {log.text}
                      </div>
                    ))}
                    {isProcessing && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Chatbot Created!</h2>
              <p className="text-muted-foreground mt-1">Your chatbot is ready to use</p>
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
              <div className="p-3 rounded-lg border">
                <div className="text-xl font-bold">23</div>
                <div className="text-xs text-muted-foreground">Pages</div>
              </div>
              <div className="p-3 rounded-lg border">
                <div className="text-xl font-bold">GPT-4</div>
                <div className="text-xs text-muted-foreground">Model</div>
              </div>
              <div className="p-3 rounded-lg border">
                <div className="text-xl font-bold">100%</div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// My Chatbots Page
interface MyChatbotsPageProps {
  chatbots: any[];
  loading: boolean;
  onSelectChatbot: (bot: any) => void;
  onRefresh: () => void;
}

function MyChatbotsPage({ chatbots, loading, onSelectChatbot, onRefresh }: MyChatbotsPageProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatbotToDelete, setChatbotToDelete] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      await fetch(`/api/chatbots/${chatbotToDelete}`, { method: 'DELETE' });
      toast.success('Chatbot deleted');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete chatbot');
    }
    setDeleteDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (chatbots.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-12 pb-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Bot className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No chatbots yet</h3>
            <p className="text-muted-foreground text-sm mt-1">Create your first chatbot to get started</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Chatbot
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{chatbots.length} chatbots</p>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chatbots.map((bot) => (
          <Card key={bot.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{bot.name}</CardTitle>
                    <CardDescription className="text-xs">{bot.website}</CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onSelectChatbot(bot)}>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Test
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setChatbotToDelete(bot.id); setDeleteDialogOpen(true); }}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={bot.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                  {bot.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pages</span>
                <span className="font-medium">{bot.pagesScraped}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Messages</span>
                <span className="font-medium">{bot.monthlyMessages}</span>
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

// Playground Page
interface PlaygroundPageProps {
  chatbot: any;
}

function PlaygroundPage({ chatbot }: PlaygroundPageProps) {
  const [messages, setMessages] = useState<Array<{ id: string; role: string; content: string; timestamp: string }>>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(`session-${Date.now()}`);

  useEffect(() => {
    if (chatbot) {
      loadConversation();
    }
  }, [chatbot]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async () => {
    if (!chatbot) return;
    try {
      const res = await fetch(`/api/chatbots/${chatbot.id}/conversation?sessionId=${sessionId.current}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !chatbot) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = input;
    setInput('');
    setIsTyping(true);

    try {
      // Call Python LLM backend via proxy
      const res = await fetch(`/api/chatbots/${chatbot.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          conversation_id: sessionId.current
        })
      });

      if (!res.ok) throw new Error('Failed to send message');
      const data = await res.json();

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to connect to AI. Make sure the backend server is running.');
      setIsTyping(false);
    }
  };

  if (!chatbot) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-muted-foreground">Please select a chatbot to test</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Chatbot Info */}
      <Card className="h-fit">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">{chatbot.name}</CardTitle>
              <CardDescription className="text-xs">{chatbot.website}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model</span>
              <span className="font-medium">{chatbot.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={chatbot.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                {chatbot.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pages</span>
              <span className="font-medium">{chatbot.pagesScraped}</span>
            </div>
          </div>
          <Separator />
          <Button
            variant="outline"
            className="w-full"
            size="sm"
            onClick={() => { setMessages([]); sessionId.current = `session-${Date.now()}`; }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="lg:col-span-3 flex flex-col h-[600px]">
        <CardHeader className="border-b">
          <CardTitle>Chat Playground</CardTitle>
          <CardDescription>Test your chatbot with real conversations</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Start a conversation</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                      }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Deploy Page
function DeployPage({ chatbot }: { chatbot: any }) {
  const [copied, setCopied] = useState(false);

  const [host, setHost] = useState('');

  useEffect(() => {
    setHost(window.location.origin);
  }, []);

  const reliableHost = host.replace('localhost', '127.0.0.1');

  const scriptCode = chatbot ? `<script src="${reliableHost}/widget.js"></script>
<script>
  window.addEventListener('load', function() {
    ChatbotWidget.init({
      chatbotId: "${chatbot.id}",
      apiUrl: "${reliableHost}/api"
    });
  });
</script>` : '';

  const handleCopy = (code: string): void => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
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
    <div className="max-w-4xl mx-auto space-y-6">
      <Tabs defaultValue="script" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="embed">Quick Embed</TabsTrigger>
          <TabsTrigger value="github">GitHub Export</TabsTrigger>
          <TabsTrigger value="react">React UI</TabsTrigger>
          <TabsTrigger value="api">API Ref</TabsTrigger>
        </TabsList>

        <TabsContent value="embed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>One-Line Embed</CardTitle>
              <CardDescription>Paste this onto any website to reveal the chat widget.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto border">
                  <code>{scriptCode}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 backdrop-blur-sm"
                  onClick={() => handleCopy(scriptCode)}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="github" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GitHub / Self-Hosting Bundle</CardTitle>
              <CardDescription>Give your users their own repository assets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-card space-y-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Github className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-semibold text-sm">Option A: GitHub Repo</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Users can download this bundle, commit to GitHub, and enable GitHub Pages for instant hosting.
                  </p>
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => {
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
                    <Download className="w-3 h-3" />
                    Download Repo Bundle
                  </Button>
                </div>

                <div className="p-4 rounded-xl border bg-card space-y-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-semibold text-sm">Option B: All-in-One Site</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A single HTML file containing both the structure and the interactive widget. Perfect for landing pages.
                  </p>
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => {
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
                    <Download className="w-3 h-3" />
                    Export index.html
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="react" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>React Component</CardTitle>
              <CardDescription>Install via npm</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="p-4 rounded-lg bg-muted text-sm">
                <code>npm install @chatbot-ai/react</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Access</CardTitle>
              <CardDescription>REST API endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border">
                  <div className="text-sm font-medium mb-1">Base Endpoint</div>
                  <code className="text-xs text-muted-foreground">{host}/api</code>
                </div>
                <div className="p-3 rounded-lg border">
                  <div className="text-sm font-medium mb-1">Auth</div>
                  <code className="text-xs text-muted-foreground">None (Public)</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div >
  );
}

// Analytics Page
function AnalyticsPage({ analytics }: { analytics: Analytics | null }) {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5K</div>
            <p className="text-xs text-muted-foreground mt-1">+23% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground mt-1">-15% faster</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground mt-1">+5% improvement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.8K</div>
            <p className="text-xs text-muted-foreground mt-1">+18% growth</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Messages Over Time</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.messagesOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="messages" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Questions</CardTitle>
            <CardDescription>Most asked this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topQuestions?.map((q, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg border">
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-medium">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{q.question}</div>
                    <div className="text-xs text-muted-foreground">{q.count} times</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Billing Page
function BillingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      features: ['1 chatbot', '100 messages/month', 'Basic analytics', 'Community support']
    },
    {
      name: 'Pro',
      price: '$49',
      popular: true,
      features: ['10 chatbots', '10,000 messages/month', 'Advanced analytics', 'Priority support', 'Custom branding']
    },
    {
      name: 'Enterprise',
      price: '$299',
      features: ['Unlimited chatbots', 'Unlimited messages', 'Advanced analytics', 'Dedicated support', 'SSO & SAML']
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
          <CardDescription>Free Plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Messages</span>
              <span className="font-medium">67 / 100</span>
            </div>
            <Progress value={67} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Chatbots</span>
              <span className="font-medium">1 / 1</span>
            </div>
            <Progress value={100} />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.popular ? 'border-primary' : ''}>
            {plan.popular && (
              <div className="px-4 pt-4">
                <Badge>Most Popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                {plan.name === 'Free' ? 'Current Plan' : 'Upgrade'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Settings Page
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
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
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

      <Card>
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

      <Card className="border-destructive">
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

// Training Page
function TrainingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>Add content to improve your chatbot</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-24 flex-col gap-2">
              <Globe className="w-6 h-6" />
              <span>Add Website</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2">
              <Download className="w-6 h-6" />
              <span>Upload Files</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}