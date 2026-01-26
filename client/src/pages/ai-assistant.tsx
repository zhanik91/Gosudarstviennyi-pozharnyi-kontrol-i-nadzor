import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  Bot,
  User,
  PlusCircle,
  Trash2,
  MessageSquare,
  Flame,
  Loader2,
} from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  messages?: Message[];
}

const FIRE_SAFETY_SYSTEM_PROMPT = `Вы - ИИ-ассистент по пожарной безопасности Республики Казахстан. 
Вы специализируетесь на:
- Правилах пожарной безопасности РК (ППБ РК, Приказ МЧС №55)
- СТ РК 1487-2006 (требования к огнетушителям)
- СП РК 2.02-101-2022 (категории взрывопожароопасности)
- Законе РК "О гражданской защите"
- Приказе МЧС №281 (перечень объектов с обязательной НГПС)
- Расчетах первичных средств пожаротушения
- Определении категорий помещений

Отвечайте на русском языке, давайте точные ссылки на НПА РК.`;

export default function AIAssistantPage() {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: currentConversation, isLoading: messagesLoading } = useQuery<Conversation>({
    queryKey: ["/api/conversations", currentConversationId],
    enabled: !!currentConversationId,
  });

  const createConversation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/conversations", {
        title: "Новый чат",
      });
      return res.json();
    },
    onSuccess: (conversation: Conversation) => {
      setCurrentConversationId(conversation.id);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const deleteConversation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (currentConversationId === id) {
        setCurrentConversationId(null);
      }
    },
  });

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentConversationId || isStreaming) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const response = await fetch(`/api/conversations/${currentConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: userMessage }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              fullContent += data.content;
              setStreamingContent(fullContent);
            }
            if (data.done) {
              queryClient.invalidateQueries({ queryKey: ["/api/conversations", currentConversationId] });
            }
          } catch {}
        }
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation?.messages, streamingContent]);

  useEffect(() => {
    if (!conversationsLoading && conversations.length === 0 && !currentConversationId) {
      createConversation.mutate();
    } else if (conversations.length > 0 && !currentConversationId) {
      setCurrentConversationId(conversations[0].id);
    }
  }, [conversations, conversationsLoading, currentConversationId]);

  const messages = currentConversation?.messages || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4 flex items-center justify-center">
          <Bot className="mr-3 w-8 h-8 text-primary" />
          ИИ-Ассистент по пожарной безопасности
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Консультации по НПА РК, расчётам и требованиям пожарной безопасности
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Чаты
              </CardTitle>
              <Button
                size="sm"
                onClick={() => createConversation.mutate()}
                disabled={createConversation.isPending}
              >
                <PlusCircle className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {conversationsLoading ? (
                <div className="p-4 text-center text-muted-foreground">Загрузка...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">Нет чатов</div>
              ) : (
                <div className="space-y-1 p-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        currentConversationId === conv.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setCurrentConversationId(conv.id)}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Flame className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm truncate">{conv.title}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation.mutate(conv.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 flex flex-col h-[600px]">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              <CardTitle>
                {currentConversation?.title || "Выберите или создайте чат"}
              </CardTitle>
              <Badge variant="outline" className="ml-auto">
                GPT-4o-mini
              </Badge>
            </div>
          </CardHeader>

          <ScrollArea className="flex-1 p-4">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 && !streamingContent ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Bot className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Начните диалог</p>
                <p className="text-sm max-w-md">
                  Задайте вопрос по пожарной безопасности, расчётам огнетушителей,
                  категориям помещений или НПА Республики Казахстан
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] p-3 rounded-2xl ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    </div>
                    {message.role === "user" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {streamingContent && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="max-w-[70%] p-3 rounded-2xl bg-muted">
                      <div className="whitespace-pre-wrap text-sm">{streamingContent}</div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Введите ваш вопрос..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={!currentConversationId || isStreaming}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || !currentConversationId || isStreaming}
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
