import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Send, X, Users } from "lucide-react";

interface EmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  selectedCount: number;
}

interface EmailData {
  to: string[];
  subject: string;
  message: string;
  includeAttachment: boolean;
  urgent: boolean;
}

export default function EmailNotificationModal({ 
  isOpen, 
  onClose, 
  selectedIds, 
  selectedCount 
}: EmailNotificationModalProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<EmailData>({
    to: [],
    subject: `Отчет по происшествиям - ${new Date().toLocaleDateString('ru-RU')}`,
    message: `Направляем отчет по ${selectedCount} происшествиям для рассмотрения.\n\nПодготовлено: ${new Date().toLocaleString('ru-RU')}`,
    includeAttachment: true,
    urgent: false
  });
  
  const [emailInput, setEmailInput] = useState("");

  const sendEmailMutation = useMutation({
    mutationFn: async (data: EmailData) => {
      await apiRequest("POST", "/api/incidents/send-email", {
        incidentIds: selectedIds,
        ...data
      });
    },
    onSuccess: () => {
      toast({
        title: "Успех",
        description: `Email отправлен ${formData.to.length} получателям`,
      });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить email",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      to: [],
      subject: `Отчет по происшествиям - ${new Date().toLocaleDateString('ru-RU')}`,
      message: `Направляем отчет по ${selectedCount} происшествиям для рассмотрения.\n\nПодготовлено: ${new Date().toLocaleString('ru-RU')}`,
      includeAttachment: true,
      urgent: false
    });
    setEmailInput("");
  };

  const addEmail = () => {
    const email = emailInput.trim();
    if (email && isValidEmail(email) && !formData.to.includes(email)) {
      setFormData({ ...formData, to: [...formData.to, email] });
      setEmailInput("");
    }
  };

  const removeEmail = (email: string) => {
    setFormData({ ...formData, to: formData.to.filter(e => e !== email) });
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = () => {
    if (formData.to.length === 0) {
      toast({
        title: "Предупреждение",
        description: "Добавьте получателей",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.subject.trim()) {
      toast({
        title: "Предупреждение", 
        description: "Введите тему письма",
        variant: "destructive",
      });
      return;
    }
    
    sendEmailMutation.mutate(formData);
  };

  const addPredefinedEmails = () => {
    const predefined = [
      "chief@mchs.kz",
      "deputy@mchs.kz", 
      "operations@mchs.kz"
    ];
    
    const newEmails = predefined.filter(email => !formData.to.includes(email));
    setFormData({ ...formData, to: [...formData.to, ...newEmails] });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" data-testid="email-notification-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Отправка уведомлений
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            <Badge variant="secondary">{selectedCount} происшествий</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Получатели</Label>
            <div className="flex gap-2">
              <Input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="email@example.com"
                onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                data-testid="input-email"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addEmail}
                disabled={!emailInput.trim() || !isValidEmail(emailInput.trim())}
                data-testid="button-add-email"
              >
                Добавить
              </Button>
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPredefinedEmails}
              className="flex items-center gap-1"
              data-testid="button-add-predefined"
            >
              <Users className="h-4 w-4" />
              Добавить руководство
            </Button>

            {formData.to.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.to.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {email}
                    <button
                      onClick={() => removeEmail(email)}
                      className="ml-1 hover:text-destructive"
                      data-testid={`remove-email-${email}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Тема</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Введите тему письма"
              data-testid="input-subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Сообщение</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Введите текст сообщения"
              rows={4}
              data-testid="textarea-message"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeAttachment"
                checked={formData.includeAttachment}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, includeAttachment: !!checked })
                }
                data-testid="checkbox-attachment"
              />
              <Label htmlFor="includeAttachment">
                Приложить отчет (Excel файл)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="urgent"
                checked={formData.urgent}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, urgent: !!checked })
                }
                data-testid="checkbox-urgent"
              />
              <Label htmlFor="urgent">
                Срочное (высокий приоритет)
              </Label>
            </div>
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
            disabled={sendEmailMutation.isPending || formData.to.length === 0}
            data-testid="button-send-email"
          >
            <Send className="h-4 w-4 mr-2" />
            {sendEmailMutation.isPending ? "Отправка..." : "Отправить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}