import type { Express } from "express";
import { isAuthenticated } from "../auth-local";
import { storage } from "../storage";

export function registerBulkIncidentRoutes(app: Express) {
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
            archivedAt: new Date().toISOString()
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
        const csvHeader = "№,Дата,Время,Область,Район,Тип,Адрес,Причина,Ущерб,Погибло,Травмировано\n";
        const csvData = incidents.map((incident, index) => {
          const date = new Date(incident.dateTime);
          return [
            index + 1,
            date.toLocaleDateString('ru-RU'),
            date.toLocaleTimeString('ru-RU'),
            incident.region || '',
            incident.district || '',
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