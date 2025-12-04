import type { Request, Response } from "express";
import { storage } from "../storage";
import { DocumentStorageService, ObjectNotFoundError } from "../objectStorage";

const documentStorageService = new DocumentStorageService();

export class DocumentController {

  // Получить URL для загрузки
  async getUploadUrl(req: Request, res: Response) {
    try {
      const { fileName, documentType } = req.body;
      const uploadURL = await documentStorageService.getDocumentUploadURL(documentType || 'reports');

      res.json({
        uploadURL,
        fileName,
        documentType
      });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  }

  // Создать документ
  async createDocument(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.user?.username;
      const user = await storage.getUser(userId);

      const documentData = {
        ...req.body,
        organizationId: user?.organizationId || 'mcs-rk',
        createdBy: userId,
      };

      const document = await storage.createDocument(documentData);
      res.json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  }

  // Получить документы (фильтрация)
  async getDocuments(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.user?.username;
      const user = await storage.getUser(userId);

      // Merge query params from both route styles
      const filters: any = {
        search: req.query.search as string,
        documentType: req.query.documentType || req.query.type,
        period: req.query.period,
        status: req.query.status
      };

      // Apply organization filtering
      if (user?.role !== 'admin' && user?.organizationId) {
        filters.organizationId = user.organizationId;
      }

      const documents = await storage.getDocuments(filters);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  }

  // Скачать файл документа
  async downloadDocument(req: Request, res: Response) {
    try {
      const documentFile = await documentStorageService.getDocumentFile(req.params.documentPath + (req.params[0] ? req.params[0] : ""));
      await documentStorageService.downloadObject(documentFile, res);
    } catch (error) {
      console.error("Error serving document:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  }

  // Обновить статус
  async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      const document = await storage.updateDocumentStatus(req.params.id, status);
      res.json(document);
    } catch (error) {
      console.error('Error updating document status:', error);
      res.status(500).json({ message: 'Ошибка обновления статуса' });
    }
  }

  // Удалить документ
  async deleteDocument(req: Request, res: Response) {
    try {
      await storage.deleteDocument(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ message: 'Ошибка удаления документа' });
    }
  }

  // Публичные объекты
  async getPublicObject(req: Request, res: Response) {
    const filePath = req.params.filePath;
    try {
      const file = await documentStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      await documentStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export const documentController = new DocumentController();
