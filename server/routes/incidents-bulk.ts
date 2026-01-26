import type { Express } from "express";
import { isAuthenticated } from "../auth-local";
import { storage } from "../storage";
import { insertIncidentSchema } from "@shared/schema";

const parseNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/\s/g, "").replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const parseDateInput = (value: unknown) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const direct = new Date(trimmed);
    if (!Number.isNaN(direct.getTime())) return direct;
    const match = trimmed.match(
      /(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/
    );
    if (match) {
      const [, day, month, year, hours = "0", minutes = "0"] = match;
      const parsed = new Date(
        Number(year.length === 2 ? `20${year}` : year),
        Number(month) - 1,
        Number(day),
        Number(hours),
        Number(minutes)
      );
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }
  return null;
};

const normalizeIncidentType = (value: string) => {
  const normalized = value.trim().toLowerCase();
  const map: Record<string, string> = {
    пожар: "fire",
    "случай горения": "nonfire",
    "степной пожар": "steppe_fire",
    "степное загорание": "steppe_smolder",
    "отравление co": "co_nofire",
    "отравление со": "co_nofire",
    "co": "co_nofire",
  };
  return map[normalized] || normalized;
};

const normalizeLocality = (value?: string | null) => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("город")) return "cities";
  if (normalized.includes("сель")) return "rural";
  return value.trim();
};

const parseCodeLabel = (value?: string | null) => {
  if (!value) return { code: undefined, label: undefined };
  const [code, ...rest] = value.split("-");
  if (rest.length === 0) {
    return { code: value.trim(), label: value.trim() };
  }
  return {
    code: code.trim(),
    label: rest.join("-").trim(),
  };
};

export function registerBulkIncidentRoutes(app: Express) {
  app.post("/api/incidents/bulk", isAuthenticated, async (req, res) => {
    try {
      const { incidents } = req.body;
      if (!incidents || !Array.isArray(incidents) || incidents.length === 0) {
        return res.status(400).json({
          message: "Необходимо передать массив происшествий",
        });
      }

      const userId = req.user?.id || req.user?.username;
      let user = await storage.getUser(userId);
      if (!user && req.user?.username) {
        user = await storage.getUserByUsername(req.user.username);
      }

      const createdBy = user?.id || userId;
      if (!createdBy) {
        return res.status(401).json({ message: "Пользователь не найден" });
      }

      const results = [];
      const errors: { rowNumber: number; error: string }[] = [];

      for (let index = 0; index < incidents.length; index += 1) {
        const row = incidents[index];
        if (!row || typeof row !== "object") {
          errors.push({ rowNumber: index + 1, error: "Некорректная структура строки" });
          continue;
        }
        const { rowNumber: sourceRowNumber, ...rowData } = row as Record<string, any>;
        const rowNumber = Number(sourceRowNumber) || index + 1;
        const incidentTypeRaw = rowData?.incidentType ? String(rowData.incidentType) : "";
        const incidentType = incidentTypeRaw ? normalizeIncidentType(incidentTypeRaw) : "";
        const address = rowData?.address ? String(rowData.address).trim() : "";
        const dateTime = parseDateInput(rowData?.dateTime);

        if (!incidentType) {
          errors.push({ rowNumber, error: "Не указан тип происшествия" });
          continue;
        }
        if (!address) {
          errors.push({ rowNumber, error: "Не указан адрес" });
          continue;
        }
        if (!dateTime) {
          errors.push({ rowNumber, error: "Не указана дата/время" });
          continue;
        }

        const orgUnitId =
          user?.role === "MCHS" && rowData?.orgUnitId ? rowData.orgUnitId : user?.orgUnitId;
        if (!orgUnitId) {
          errors.push({ rowNumber, error: "Не определена организация" });
          continue;
        }

        const cause = parseCodeLabel(rowData?.cause ? String(rowData.cause) : undefined);
        const object = parseCodeLabel(rowData?.objectType ? String(rowData.objectType) : undefined);
        const normalizedData = {
          ...rowData,
          orgUnitId,
          createdBy,
          incidentType,
          address,
          dateTime,
          damage: String(parseNumber(rowData?.damage)),
          savedProperty:
            rowData?.savedProperty !== undefined ? String(rowData.savedProperty) : "0",
          deathsTotal: Number.parseInt(String(rowData?.deathsTotal ?? 0), 10) || 0,
          injuredTotal: Number.parseInt(String(rowData?.injuredTotal ?? 0), 10) || 0,
          savedPeopleTotal: Number.parseInt(String(rowData?.savedPeopleTotal ?? 0), 10) || 0,
          region: rowData?.region || user?.region || "Шымкент",
          city: rowData?.city || user?.district || "",
          causeCode: rowData?.causeCode || cause.code || rowData?.cause || "01",
          cause: rowData?.cause || cause.label || rowData?.causeCode || "01",
          objectCode: rowData?.objectCode || object.code || rowData?.objectType || "01",
          objectType: rowData?.objectType || object.label || rowData?.objectCode || "01",
          locality: normalizeLocality(rowData?.locality) || "cities",
        };

        const parsed = insertIncidentSchema.safeParse(normalizedData);
        if (!parsed.success) {
          const message = parsed.error.issues.map((issue) => issue.message).join("; ");
          errors.push({ rowNumber, error: `Ошибка валидации: ${message}` });
          continue;
        }

        const incident = await storage.createIncident(parsed.data);
        results.push(incident);
      }

      res.json({
        message: `Импортировано ${results.length} из ${incidents.length} записей`,
        created: results.length,
        total: incidents.length,
        errors,
      });
    } catch (error) {
      console.error("Ошибка массового импорта происшествий:", error);
      res.status(500).json({
        message: "Ошибка массового импорта происшествий",
      });
    }
  });

  // Массовое обновление происшествий
  app.patch("/api/incidents/bulk-update", isAuthenticated, async (req, res) => {
    try {
      const { ids, updates } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ 
          message: "Необходимо указать массив ID для обновления" 
        });
      }

      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ 
          message: "Необходимо указать данные для обновления" 
        });
      }

      // Обновляем каждое происшествие
      const results = [];
      for (const id of ids) {
        try {
          const updated = await storage.updateIncident(id, updates);
          if (updated) {
            results.push(updated);
          }
        } catch (error) {
          console.error(`Ошибка обновления происшествия ${id}:`, error);
        }
      }

      res.json({
        message: `Обновлено ${results.length} из ${ids.length} записей`,
        updated: results.length,
        total: ids.length
      });

    } catch (error) {
      console.error("Ошибка массового обновления происшествий:", error);
      res.status(500).json({ 
        message: "Ошибка массового обновления происшествий" 
      });
    }
  });

  // Отправка email уведомлений
  app.post("/api/incidents/send-email", isAuthenticated, async (req, res) => {
    try {
      const { incidentIds, to, subject, message, includeAttachment, urgent } = req.body;
      
      if (!incidentIds || !Array.isArray(incidentIds) || incidentIds.length === 0) {
        return res.status(400).json({ 
          message: "Необходимо указать происшествия для отправки" 
        });
      }

      if (!to || !Array.isArray(to) || to.length === 0) {
        return res.status(400).json({ 
          message: "Необходимо указать получателей" 
        });
      }

      // Получаем данные происшествий
      const incidents = [];
      for (const id of incidentIds) {
        const incident = await storage.getIncident(id);
        if (incident) {
          incidents.push(incident);
        }
      }

      // В production версии здесь будет интеграция с почтовым сервисом
      console.log("Email отправка:", {
        to,
        subject,
        message,
        incidents: incidents.length,
        includeAttachment,
        urgent
      });

      // Логируем отправку
      console.log(`[EMAIL] Отправлено уведомление о ${incidents.length} происшествиях:`);
      console.log(`[EMAIL] Получатели: ${to.join(", ")}`);
      console.log(`[EMAIL] Тема: ${subject}`);
      console.log(`[EMAIL] Срочность: ${urgent ? "Высокая" : "Обычная"}`);
      console.log(`[EMAIL] Приложение: ${includeAttachment ? "Да" : "Нет"}`);

      res.json({
        message: `Email отправлен ${to.length} получателям`,
        recipients: to.length,
        incidents: incidents.length,
        sent: true
      });

    } catch (error) {
      console.error("Ошибка отправки email:", error);
      res.status(500).json({ 
        message: "Ошибка отправки email уведомлений" 
      });
    }
  });

  // Массовое архивирование
  app.patch("/api/incidents/bulk-archive", isAuthenticated, async (req, res) => {
    try {
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ 
          message: "Необходимо указать массив ID для архивирования" 
        });
      }

      // Архивируем происшествия (обновляем статус)
      const results = [];
      for (const id of ids) {
        try {
          const updated = await storage.updateIncident(id, { 
            status: 'archived',
            archivedAt: new Date()
          });
          if (updated) {
            results.push(updated);
          }
        } catch (error) {
          console.error(`Ошибка архивирования происшествия ${id}:`, error);
        }
      }

      res.json({
        message: `Архивировано ${results.length} из ${ids.length} записей`,
        archived: results.length,
        total: ids.length
      });

    } catch (error) {
      console.error("Ошибка массового архивирования:", error);
      res.status(500).json({ 
        message: "Ошибка массового архивирования происшествий" 
      });
    }
  });

  // Генерация отчета
  app.post("/api/incidents/generate-report", isAuthenticated, async (req, res) => {
    try {
      const { incidentIds, format = 'csv' } = req.body;
      
      if (!incidentIds || !Array.isArray(incidentIds) || incidentIds.length === 0) {
        return res.status(400).json({ 
          message: "Необходимо указать происшествия для отчета" 
        });
      }

      // Получаем данные происшествий
      const incidents = [];
      for (const id of incidentIds) {
        const incident = await storage.getIncident(id);
        if (incident) {
          incidents.push(incident);
        }
      }

      if (format === 'csv') {
        const csvHeader = "№,Дата,Время,Область,Город-район,Тип,Адрес,Причина,Ущерб,Погибло,Травмировано\n";
        const csvData = incidents.map((incident, index) => {
          const date = new Date(incident.dateTime);
          return [
            index + 1,
            date.toLocaleDateString('ru-RU'),
            date.toLocaleTimeString('ru-RU'),
            incident.region || '',
            incident.city || '',
            incident.incidentType || '',
            incident.address || '',
            incident.cause || '',
            incident.damage || 0,
            incident.deathsTotal || 0,
            incident.injuredTotal || 0
          ].join(',');
        }).join('\n');

        const csvContent = csvHeader + csvData;
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="incident_report_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send('\ufeff' + csvContent); // BOM для корректного отображения UTF-8 в Excel
      } else {
        res.json({
          incidents,
          total: incidents.length,
          generated: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error("Ошибка генерации отчета:", error);
      res.status(500).json({ 
        message: "Ошибка генерации отчета" 
      });
    }
  });
}
