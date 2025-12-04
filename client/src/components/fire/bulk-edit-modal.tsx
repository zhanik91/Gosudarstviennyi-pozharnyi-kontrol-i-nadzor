import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/queryClient";
import { Edit, Save, X } from "lucide-react";

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  selectedCount: number;
}

interface BulkEditData {
  status?: string;
  priority?: string;
  assignedTo?: string;
  notes?: string;
  category?: string;
}

export default function BulkEditModal({ isOpen, onClose, selectedIds, selectedCount }: BulkEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<BulkEditData>({});
  const [fieldsToUpdate, setFieldsToUpdate] = useState<Set<string>>(new Set());

  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: BulkEditData) => {
      const updateData = Object.fromEntries(
        Object.entries(data).filter(([key]) => fieldsToUpdate.has(key))
      );
      
      await apiRequest("PATCH", "/api/incidents/bulk-update", {
        ids: selectedIds,
        updates: updateData
      });
    },
    onSuccess: () => {
      toast({
        title: "Успех",
        description: `Обновлено ${selectedCount} записей`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить записи",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({});
    setFieldsToUpdate(new Set());
  };

  const toggleField = (field: string) => {
    const newFields = new Set(fieldsToUpdate);
    if (newFields.has(field)) {
      newFields.delete(field);
    } else {
      newFields.add(field);
    }
    setFieldsToUpdate(newFields);
  };

  const handleSubmit = () => {
    if (fieldsToUpdate.size === 0) {
      toast({
        title: "Предупреждение",
        description: "Выберите поля для обновления",
        variant: "destructive",
      });
      return;
    }
    
    bulkUpdateMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="bulk-edit-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Массовое редактирование
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            <Badge variant="secondary">{selectedCount} записей выбрано</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="status-field"
                checked={fieldsToUpdate.has('status')}
                onChange={() => toggleField('status')}
                className="rounded"
              />
              <Label htmlFor="status-field">Статус</Label>
            </div>
            <Select
              value={formData.status || ""}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
              disabled={!fieldsToUpdate.has('status')}
            >
              <SelectTrigger data-testid="select-status">
                <SelectValue placeholder="Выберите статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">В обработке</SelectItem>
                <SelectItem value="investigating">Расследование</SelectItem>
                <SelectItem value="resolved">Завершено</SelectItem>
                <SelectItem value="archived">Архив</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="priority-field"
                checked={fieldsToUpdate.has('priority')}
                onChange={() => toggleField('priority')}
                className="rounded"
              />
              <Label htmlFor="priority-field">Приоритет</Label>
            </div>
            <Select
              value={formData.priority || ""}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
              disabled={!fieldsToUpdate.has('priority')}
            >
              <SelectTrigger data-testid="select-priority">
                <SelectValue placeholder="Выберите приоритет" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Низкий</SelectItem>
                <SelectItem value="medium">Средний</SelectItem>
                <SelectItem value="high">Высокий</SelectItem>
                <SelectItem value="critical">Критический</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="category-field"
                checked={fieldsToUpdate.has('category')}
                onChange={() => toggleField('category')}
                className="rounded"
              />
              <Label htmlFor="category-field">Категория</Label>
            </div>
            <Select
              value={formData.category || ""}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              disabled={!fieldsToUpdate.has('category')}
            >
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">Жилой сектор</SelectItem>
                <SelectItem value="commercial">Коммерческий</SelectItem>
                <SelectItem value="industrial">Промышленный</SelectItem>
                <SelectItem value="transport">Транспорт</SelectItem>
                <SelectItem value="forest">Лесной</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="assignedTo-field"
                checked={fieldsToUpdate.has('assignedTo')}
                onChange={() => toggleField('assignedTo')}
                className="rounded"
              />
              <Label htmlFor="assignedTo-field">Ответственный</Label>
            </div>
            <Input
              value={formData.assignedTo || ""}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              placeholder="Введите имя ответственного"
              disabled={!fieldsToUpdate.has('assignedTo')}
              data-testid="input-assigned-to"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="notes-field"
                checked={fieldsToUpdate.has('notes')}
                onChange={() => toggleField('notes')}
                className="rounded"
              />
              <Label htmlFor="notes-field">Примечания</Label>
            </div>
            <Textarea
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Добавить примечания..."
              disabled={!fieldsToUpdate.has('notes')}
              data-testid="textarea-notes"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel"
          >
            <X className="h-4 w-4 mr-2" />
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={bulkUpdateMutation.isPending || fieldsToUpdate.size === 0}
            data-testid="button-save-bulk"
          >
            <Save className="h-4 w-4 mr-2" />
            {bulkUpdateMutation.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}