import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import { db } from "../../db";
import { normativeDocuments } from "@shared/schema";
import { eq, asc } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function getNormativeDocumentsList(): Promise<string> {
  try {
    const docs = await db
      .select({
        title: normativeDocuments.title,
        shortTitle: normativeDocuments.shortTitle,
        documentNumber: normativeDocuments.documentNumber,
        documentDate: normativeDocuments.documentDate,
        category: normativeDocuments.category,
        description: normativeDocuments.description,
        externalUrl: normativeDocuments.externalUrl,
      })
      .from(normativeDocuments)
      .where(eq(normativeDocuments.isActive, true))
      .orderBy(asc(normativeDocuments.sortOrder));

    if (docs.length === 0) {
      return "Нормативные документы не загружены в систему.";
    }

    let docList = "АКТУАЛЬНЫЕ НОРМАТИВНЫЕ ДОКУМЕНТЫ РК (загружены в систему):\n\n";
    
    const categories: Record<string, typeof docs> = {};
    for (const doc of docs) {
      if (!categories[doc.category]) {
        categories[doc.category] = [];
      }
      categories[doc.category].push(doc);
    }

    const categoryNames: Record<string, string> = {
      laws: "ЗАКОНЫ РК",
      technical_regulations: "ТЕХНИЧЕСКИЕ РЕГЛАМЕНТЫ",
      fire_safety_rules: "ПРАВИЛА ПОЖАРНОЙ БЕЗОПАСНОСТИ",
      orders: "ПРИКАЗЫ МЧС",
      building_codes: "СТРОИТЕЛЬНЫЕ НОРМЫ",
      standards: "СТАНДАРТЫ",
      methodical: "МЕТОДИЧЕСКИЕ ДОКУМЕНТЫ",
      other: "ПРОЧИЕ ДОКУМЕНТЫ",
    };

    for (const [category, catDocs] of Object.entries(categories)) {
      docList += `### ${categoryNames[category] || category.toUpperCase()}\n`;
      for (const doc of catDocs) {
        docList += `- ${doc.shortTitle || doc.documentNumber || ""}: ${doc.title}\n`;
        docList += `  Дата: ${doc.documentDate || "не указана"}\n`;
        docList += `  Ссылка: ${doc.externalUrl}\n`;
        if (doc.description) {
          docList += `  Описание: ${doc.description}\n`;
        }
        docList += "\n";
      }
    }

    return docList;
  } catch (error) {
    console.error("Error fetching normative documents:", error);
    return "Ошибка загрузки нормативных документов.";
  }
}

function buildSystemPrompt(normativeDocs: string): string {
  return `Вы - ИИ-ассистент по пожарной безопасности Республики Казахстан для системы МЧС РК.

## СТРОГИЕ ПРАВИЛА (ОБЯЗАТЕЛЬНЫ К ВЫПОЛНЕНИЮ):

1. ОТВЕЧАЙТЕ ТОЛЬКО на основе нормативных документов из списка ниже.
2. ВСЕГДА указывайте источник: название НПА, номер и ссылку на adilet.zan.kz.
3. НИКОГДА не выдумывайте номера пунктов, статей или требования.
4. Если вопрос НЕ относится к загруженным НПА — честно скажите: "Данный вопрос не регулируется загруженными в систему НПА. Рекомендую обратиться на официальный сайт МЧС РК."
5. Для точной и актуальной информации ВСЕГДА рекомендуйте пользователю перейти по ссылке на adilet.zan.kz.

${normativeDocs}

## ВЫ МОЖЕТЕ ПОМОГАТЬ С:
- Правилами пожарной безопасности (Приказ № 55)
- Техническим регламентом «Общие требования к пожарной безопасности» (Приказ № 405)
- Требованиями к НГПС (Приказ № 281, № 782, № 783, № 514)
- Аудитом в области пожарной безопасности (Приказ № 240)
- Обучением мерам пожарной безопасности (Приказ № 276)
- Монтажом систем пожарной автоматики (Приказы № 372, № 322)
- Заключениями о соответствии (Приказы № 359, № 309)
- Расчётами первичных средств пожаротушения
- Определением категорий помещений
- Законом "О гражданской защите"

## ФОРМАТ ОТВЕТА:
1. Краткий ответ на вопрос
2. Ссылка на конкретный НПА из списка выше с URL
3. Рекомендация перейти по ссылке для полной информации

Отвечайте на русском языке. Будьте краткими и точными.`;
}

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

      // Get normative documents from database for context
      const normativeDocs = await getNormativeDocumentsList();
      const systemPrompt = buildSystemPrompt(normativeDocs);

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullResponse = "";
      
      // Use Chat Completions API with streaming
      // НПА из БД включены в системный промпт — ассистент отвечает только по ним
      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...chatMessages,
        ],
        stream: true,
        max_completion_tokens: 4096,
        temperature: 0.3, // Низкая температура для более точных ответов по НПА
      });

      for await (const chunk of stream) {
        const chunkContent = chunk.choices[0]?.delta?.content || "";
        if (chunkContent) {
          fullResponse += chunkContent;
          res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);
        }
      }

      // Save assistant message
      if (fullResponse) {
        await chatStorage.createMessage(conversationId, "assistant", fullResponse);
      }

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

