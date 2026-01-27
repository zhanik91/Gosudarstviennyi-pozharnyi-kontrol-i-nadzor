import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
}

const FIRE_SAFETY_SYSTEM_PROMPT = `Вы - ИИ-ассистент по пожарной безопасности Республики Казахстан для системы МЧС РК.

ВАЖНЫЕ ОГРАНИЧЕНИЯ:
- У вас НЕТ доступа к интернету. Вы не можете искать актуальную информацию.
- НИКОГДА не выдумывайте адреса, телефоны, ссылки или контактные данные. Если не знаете точно — честно скажите: "У меня нет актуальной информации по этому вопросу. Рекомендую обратиться на официальный сайт МЧС РК или позвонить на горячую линию."
- НЕ давайте ссылки на сайты — они могут быть неверными.
- Если вопрос выходит за рамки ваших знаний — признайте это честно.

ВЫ МОЖЕТЕ помогать с:
- Объяснением требований ППБ РК, СТ РК 1487-2006, СП РК 2.02-101-2022
- Расчётами первичных средств пожаротушения (формулы и методика)
- Определением категорий помещений А, Б, В1-В4, Г, Д
- Общими консультациями по Закону "О гражданской защите"
- Требованиями Приказа МЧС №281 (НГПС/ПСС)
- Формулами и методиками расчётов

Отвечайте на русском языке. Будьте честны о своих ограничениях.`;

export function registerChatRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content);

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream response - GPT-4o-mini (дешёвая и быстрая модель)
      const openai = getOpenAIClient();
      if (!openai) {
        res.write(`data: ${JSON.stringify({ error: "OpenAI API key not configured. Please set OPENAI_API_KEY in your environment." })}\n\n`);
        res.end();
        return;
      }
      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Экономичная модель, ~20x дешевле GPT-4
        messages: [
          { role: "system", content: FIRE_SAFETY_SYSTEM_PROMPT },
          ...chatMessages,
        ],
        stream: true,
        max_completion_tokens: 2048,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}

