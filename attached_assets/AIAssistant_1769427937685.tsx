import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  Upload, 
  FileText, 
  MessageSquare, 
  Trash2, 
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Flame,
  Bot,
  User,
  PlusCircle
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  createdAt: string;
}

interface ChatSession {
  id: string;
  title: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

interface ChatDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  extractedText?: string;
  summary?: string;
  uploadedAt: string;
}

interface FireSafetyAnalysis {
  assessment: string;
  recommendations: string[];
  risks: string[];
  compliance: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

const urgencyColors = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500', 
  high: 'bg-orange-500',
  critical: 'bg-red-500'
};

const urgencyLabels = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий', 
  critical: 'Критический'
};

export default function AIAssistant() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get chat sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<ChatSession[]>({
    queryKey: ['/api/chat/sessions'],
  });

  // Get current session messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/messages', currentSessionId],
    enabled: !!currentSessionId,
  });

  // Get session documents
  const { data: documents = [] } = useQuery<ChatDocument[]>({
    queryKey: ['/api/chat/documents', currentSessionId],
    enabled: !!currentSessionId,
  });

  // Create new chat session
  const createSession = useMutation({
    mutationFn: async (title?: string) => {
      const response = await apiRequest('POST', '/api/chat/sessions', {
        title: title || 'Новый чат'
      });
      return response.json();
    },
    onSuccess: (session: ChatSession) => {
      setCurrentSessionId(session.id);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      toast({
        title: "Чат создан",
        description: "Новая сессия чата готова к работе",
      });
    },
  });

  // Send message
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!currentSessionId) throw new Error('Нет активной сессии');
      
      setIsTyping(true);
      const response = await apiRequest('POST', '/api/chat/messages', {
        sessionId: currentSessionId,
        role: 'user',
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      setInputMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages', currentSessionId] });
      
      // Simulate AI response delay
      setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    },
    onError: () => {
      setIsTyping(false);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
    },
  });

  // Upload document
  const uploadDocument = useMutation({
    mutationFn: async (file: File) => {
      if (!currentSessionId) throw new Error('Нет активной сессии');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', currentSessionId);
      
      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/documents', currentSessionId] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages', currentSessionId] });
      toast({
        title: "Документ загружен",
        description: "Документ успешно загружен и проанализирован",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить документ",
        variant: "destructive",
      });
    },
  });

  // Delete session
  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest('DELETE', `/api/chat/sessions/${sessionId}`);
      return response.json();
    },
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
      toast({
        title: "Чат удален",
        description: "Сессия чата была удалена",
      });
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-create first session
  useEffect(() => {
    if (!sessionsLoading && sessions.length === 0 && !currentSessionId) {
      createSession.mutate();
    } else if (sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessions, sessionsLoading, currentSessionId]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || sendMessage.isPending) return;
    sendMessage.mutate(inputMessage);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Файл слишком большой",
        description: "Максимальный размер файла 10MB",
        variant: "destructive",
      });
      return;
    }

    uploadDocument.mutate(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const isAnalysis = message.metadata?.type === 'analysis';
    
    return (
      <div key={message.id} className={`flex gap-3 p-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
        
        <div className={`max-w-[70%] ${isUser ? 'order-1' : 'order-2'}`}>
          <div className={`p-3 rounded-2xl ${
            isUser 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white ml-auto' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
          }`}>
            {isAnalysis ? (
              <AnalysisCard analysis={JSON.parse(message.content)} />
            ) : (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}
          </div>
          <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(message.createdAt).toLocaleTimeString()}
          </div>
        </div>
        
        {isUser && (
          <div className="flex-shrink-0 order-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>
    );
  };

  const AnalysisCard = ({ analysis }: { analysis: any }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-500" />
        <span className="font-semibold">Анализ пожарной безопасности</span>
        <Badge variant="outline">
          {analysis.urgency || 'Средний'}
        </Badge>
      </div>
      
      <div className="space-y-3">
        <div>
          <h4 className="font-medium mb-1">Оценка:</h4>
          <p className="text-sm">{analysis.assessment || 'Проводится анализ...'}</p>
        </div>
        
        {analysis.recommendations.length > 0 && (
          <div>
            <h4 className="font-medium mb-1 flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Рекомендации:
            </h4>
            <ul className="text-sm space-y-1">
              {analysis.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-green-500 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.risks.length > 0 && (
          <div>
            <h4 className="font-medium mb-1 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Выявленные риски:
            </h4>
            <ul className="text-sm space-y-1">
              {analysis.risks.map((risk: string, idx: number) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-red-500 mt-1">•</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div>
          <h4 className="font-medium mb-1">Соответствие нормам:</h4>
          <p className="text-sm">{analysis.compliance}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <SEOHead 
        title="ИИ-Ассистент по Пожарной Безопасности | NewsFire"
        description="Профессиональный ИИ-ассистент для анализа документов, консультаций и экспертизы по пожарной безопасности в Казахстане. Загрузите документы для анализа соответствия нормам."
      />
      
      <div className="container mx-auto p-4">
        <Breadcrumbs 
          items={[
            { label: 'Главная', href: '/' },
            { label: 'ИИ-Ассистент', href: '/ai-assistant' }
          ]}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          {/* Sidebar - Chat Sessions */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Чаты
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => createSession.mutate()}
                    disabled={createSession.isPending}
                    data-testid="button-create-chat"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  <div className="space-y-2 p-4">
                    {sessions.map((session: ChatSession) => (
                      <div
                        key={session.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                          currentSessionId === session.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent'
                        }`}
                        onClick={() => setCurrentSessionId(session.id)}
                        data-testid={`chat-session-${session.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {session.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(session.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession.mutate(session.id);
                            }}
                            className="p-1 h-auto"
                            data-testid={`button-delete-session-${session.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-8rem)]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-6 h-6 text-blue-500" />
                  ИИ-Ассистент по Пожарной Безопасности
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-full p-0">
                {/* Messages Area */}
                <ScrollArea className="flex-1 px-4">
                  {messagesLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <Bot className="w-16 h-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Добро пожаловать в ИИ-Ассистент!
                      </h3>
                      <p className="text-gray-500 max-w-md">
                        Я помогу вам с вопросами пожарной безопасности, анализом документов и соответствием нормам РК.
                        Загрузите документ или задайте вопрос.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 pb-4">
                      {messages.map(renderMessage)}
                      {isTyping && (
                        <div className="flex gap-3 p-4">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.txt,.json"
                      className="hidden"
                      data-testid="input-file-upload"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadDocument.isPending || !currentSessionId}
                      data-testid="button-upload-document"
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Задайте вопрос по пожарной безопасности..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={sendMessage.isPending || !currentSessionId}
                      data-testid="input-chat-message"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendMessage.isPending || !inputMessage.trim() || !currentSessionId}
                      data-testid="button-send-message"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documents Panel */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Документы
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  <div className="space-y-3 p-4">
                    {documents.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Нет загруженных документов</p>
                      </div>
                    ) : (
                      documents.map((doc: ChatDocument) => (
                        <div key={doc.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium truncate">{doc.fileName}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {(doc.fileSize / 1024).toFixed(1)} KB
                          </div>
                          {doc.summary && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              {doc.summary}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {new Date(doc.uploadedAt).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}