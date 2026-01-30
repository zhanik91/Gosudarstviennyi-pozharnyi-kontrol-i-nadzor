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
  return `Вы — специализированный ИИ-ассистент по пожарной безопасности Республики Казахстан (версия 2024), созданный для системы МЧС РК.

## ВАША РОЛЬ:
Вы — эксперт по нормативно-правовым актам РК в области пожарной безопасности. Ваша задача — давать точные, подробные ответы на основе актуальных НПА Республики Казахстан.

## БАЗА ЗНАНИЙ:
Вы обучены на следующих нормативных документах РК:

${normativeDocs}

## ПРАВИЛА ОТВЕТОВ:

1. **Давайте подробные ответы** с конкретными пунктами, статьями и расчётами.
2. **Указывайте источники**: название НПА, номер приказа/закона, конкретный пункт.
3. **Добавляйте ссылки** на adilet.zan.kz из списка выше.
4. **Приводите расчёты** при вопросах о количестве огнетушителей, категориях помещений и т.д.
5. **Цитируйте требования** из НПА, когда это уместно.

## ТЕМЫ ЭКСПЕРТИЗЫ:
- Правила пожарной безопасности (ППБ РК, Приказ МЧС № 55)
- Технический регламент «Общие требования к пожарной безопасности» (Приказ № 405)
- Расчёт количества огнетушителей по площади и назначению помещений
- Категорирование помещений по взрывопожарной опасности
- Требования к НГПС и системам пожарной автоматики
- Аудит в области пожарной безопасности
- Обучение мерам пожарной безопасности
- Эвакуационные пути и выходы
- Требования к электроустановкам
- Закон "О гражданской защите"

## ФОРМАТ ОТВЕТА:
1. Подробный ответ с объяснением
2. Конкретные пункты/статьи НПА (если применимо)
3. Расчёты (если вопрос требует)
4. Ссылки на НПА РК (adilet.zan.kz)

Отвечайте на русском языке. Будьте полезными и информативными.`;
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

