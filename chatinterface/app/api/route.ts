import { NextResponse, NextRequest } from 'next/server';

interface Chatbot {
  id: string;
  name: string;
  website: string;
  status: 'active' | 'training';
  pagesScraped: number;
  lastUpdated: string;
  createdAt: string;
  model: string;
  monthlyMessages: number;
  color: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Stats {
  totalChatbots: number;
  totalPages: number;
  totalMessages: number;
  trainingBots: number;
  activeBots: number;
}

interface AnalyticsData {
  messagesOverTime: Array<{ date: string; messages: number }>;
  topQuestions: Array<{ question: string; count: number }>;
}

const generateId = () => crypto.randomUUID();

// Mock data store
let chatbots = [
  {
    id: '1',
    name: 'Customer Support Bot',
    website: 'https://example.com',
    status: 'active',
    pagesScraped: 45,
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    model: 'GPT-4 Turbo',
    monthlyMessages: 1243,
    color: '#3b82f6'
  },
  {
    id: '2',
    name: 'Product Guide Assistant',
    website: 'https://myproduct.io',
    status: 'training',
    pagesScraped: 23,
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    model: 'GPT-4 Turbo',
    monthlyMessages: 567,
    color: '#8b5cf6'
  },
  {
    id: '3',
    name: 'Sales FAQ Bot',
    website: 'https://sales.company.com',
    status: 'active',
    pagesScraped: 12,
    lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    model: 'GPT-4 Turbo',
    monthlyMessages: 892,
    color: '#10b981'
  }
];

let conversations: Record<string, any[]> = {};

const mockMessages = [
  "I'd be happy to help you with that! Based on your website content, here's what I found...",
  "That's a great question! Let me explain how this works...",
  "I can help you with information about our pricing, features, and getting started.",
  "According to the documentation on your website, the process is quite straightforward...",
  "I've been trained on your website content and can answer questions about your products and services."
];

const getRandomMessage = () => mockMessages[Math.floor(Math.random() * mockMessages.length)];

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  
  // Get all chatbots
  if (pathname === '/api/chatbots') {
    return NextResponse.json({ chatbots });
  }
  
  // Get dashboard stats
  if (pathname === '/api/stats') {
    const totalChatbots = chatbots.length;
    const totalPages = chatbots.reduce((sum, bot) => sum + bot.pagesScraped, 0);
    const totalMessages = chatbots.reduce((sum, bot) => sum + bot.monthlyMessages, 0);
    const trainingBots = chatbots.filter(b => b.status === 'training').length;
    
    return NextResponse.json({
      totalChatbots,
      totalPages,
      totalMessages,
      trainingBots,
      activeBots: totalChatbots - trainingBots
    });
  }
  
  // Get analytics data
  if (pathname === '/api/analytics') {
    const days = 30;
    const messagesOverTime = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      messages: Math.floor(Math.random() * 150) + 50
    }));
    
    const topQuestions = [
      { question: 'How do I get started?', count: 234 },
      { question: 'What is the pricing?', count: 189 },
      { question: 'Can I integrate this with my website?', count: 156 },
      { question: 'What models do you support?', count: 142 },
      { question: 'How does the training work?', count: 128 }
    ];
    
    return NextResponse.json({ messagesOverTime, topQuestions });
  }
  
  // Get chatbot by ID
  const chatbotIdMatch = pathname.match(/\/api\/chatbots\/([^\/]+)$/);
  if (chatbotIdMatch) {
    const chatbot = chatbots.find(b => b.id === chatbotIdMatch[1]);
    if (chatbot) {
      return NextResponse.json({ chatbot });
    }
    return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
  }
  
  // Get conversation
  const conversationMatch = pathname.match(/\/api\/chatbots\/([^\/]+)\/conversation/);
  if (conversationMatch) {
    const chatbotId = conversationMatch[1];
    const sessionId = new URL(request.url).searchParams.get('sessionId') || 'default';
    const key = `${chatbotId}-${sessionId}`;
    
    if (!conversations[key]) {
      conversations[key] = [];
    }
    
    return NextResponse.json({ messages: conversations[key] });
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const body = await request.json();
  
  // Create new chatbot
  if (pathname === '/api/chatbots') {
    const newChatbot = {
      id: generateId(),
      name: body.name || `Chatbot ${chatbots.length + 1}`,
      website: body.website,
      status: 'training',
      pagesScraped: 0,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      model: 'GPT-4 Turbo',
      monthlyMessages: 0,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    };
    
    chatbots.push(newChatbot);
    
    return NextResponse.json({ chatbot: newChatbot });
  }
  
  // Send message to chatbot
  const messageMatch = pathname.match(/\/api\/chatbots\/([^\/]+)\/message/);
  if (messageMatch) {
    const chatbotId = messageMatch[1];
    const sessionId = body.sessionId || 'default';
    const key = `${chatbotId}-${sessionId}`;
    
    if (!conversations[key]) {
      conversations[key] = [];
    }
    
    // Add user message
    const userMessage = {
      id: generateId(),
      role: 'user',
      content: body.message,
      timestamp: new Date().toISOString()
    };
    conversations[key].push(userMessage);
    
    // Simulate AI response
    const aiMessage = {
      id: generateId(),
      role: 'assistant',
      content: getRandomMessage(),
      timestamp: new Date().toISOString()
    };
    conversations[key].push(aiMessage);
    
    return NextResponse.json({ message: aiMessage });
  }
  
  // Update chatbot training status
  const updateMatch = pathname.match(/\/api\/chatbots\/([^\/]+)\/status/);
  if (updateMatch) {
    const chatbot = chatbots.find(b => b.id === updateMatch[1]);
    if (chatbot) {
      chatbot.status = body.status;
      chatbot.pagesScraped = body.pagesScraped || chatbot.pagesScraped;
      chatbot.lastUpdated = new Date().toISOString();
      return NextResponse.json({ chatbot });
    }
    return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(request: NextRequest) {
  const { pathname } = new URL(request.url);
  
  const chatbotIdMatch = pathname.match(/\/api\/chatbots\/([^\/]+)$/);
  if (chatbotIdMatch) {
    const index = chatbots.findIndex(b => b.id === chatbotIdMatch[1]);
    if (index !== -1) {
      chatbots.splice(index, 1);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PUT(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const body = await request.json();
  
  const chatbotIdMatch = pathname.match(/\/api\/chatbots\/([^\/]+)$/);
  if (chatbotIdMatch) {
    const chatbot = chatbots.find(b => b.id === chatbotIdMatch[1]);
    if (chatbot) {
      Object.assign(chatbot, body);
      chatbot.lastUpdated = new Date().toISOString();
      return NextResponse.json({ chatbot });
    }
    return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}