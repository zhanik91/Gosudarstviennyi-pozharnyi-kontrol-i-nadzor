import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Bell, Send, User, Calendar, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useAuth } from '@/hooks/useAuth';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'critical';
  recipients: string[];
  channels: ('email' | 'sms' | 'push')[];
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  scheduledAt?: Date;
  sentAt?: Date;
  createdBy: string;
  createdAt: Date;
  readBy: string[];
}

interface ApprovalWorkflow {
  id: string;
  title: string;
  documentId: string;
  documentType: string;
  currentLevel: number;
  maxLevel: number;
  status: 'pending' | 'approved' | 'rejected';
  approvers: {
    level: number;
    userId: string;
    userName: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedAt?: Date;
    comment?: string;
  }[];
  createdBy: string;
  createdAt: Date;
}

const NOTIFICATION_TYPES = {
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
  warning: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' }
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

export default function NotificationsSystem() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'notifications' | 'workflows'>('notifications');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    priority: 'medium' as const,
    recipients: [] as string[],
    channels: ['email'] as ('email' | 'sms' | 'push')[],
    scheduledAt: ''
  });

  // Получение уведомлений
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Ошибка загрузки уведомлений');
      return response.json();
    }
  });

  // Получение workflow утверждений
  const { data: workflows = [], isLoading: workflowsLoading } = useQuery<ApprovalWorkflow[]>({
    queryKey: ['/api/workflows'],
    queryFn: async () => {
      const response = await fetch('/api/workflows');
      if (!response.ok) throw new Error('Ошибка загрузки процессов утверждения');
      return response.json();
    }
  });

  // Создание уведомления
  const createNotificationMutation = useMutation({
    mutationFn: async (data: typeof newNotification) => {
      const response = await apiRequest('POST', '/api/notifications', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      setShowCreateDialog(false);
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        priority: 'medium',
        recipients: [],
        channels: ['email'],
        scheduledAt: ''
      });
    }
  });

  // Утверждение в workflow
  const approveMutation = useMutation({
    mutationFn: async ({ workflowId, comment }: { workflowId: string; comment?: string }) => {
      const response = await apiRequest('POST', `/api/workflows/${workflowId}/approve`, { comment });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
    }
  });

  // Отклонение в workflow
  const rejectMutation = useMutation({
    mutationFn: async ({ workflowId, comment }: { workflowId: string; comment: string }) => {
      const response = await apiRequest('POST', `/api/workflows/${workflowId}/reject`, { comment });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
    }
  });

  const handleCreateNotification = () => {
    if (!newNotification.title || !newNotification.message) {
      alert('Заполните все обязательные поля');
      return;
    }
    createNotificationMutation.mutate(newNotification);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('ru-RU');
  };

  if (notificationsLoading || workflowsLoading) return <LoadingIndicator />;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Уведомления и согласования</h1>
          <p className="text-gray-600 dark:text-gray-400">Система автоматических уведомлений и многоуровневых согласований</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-notification" className="bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4 mr-2" />
              Создать уведомление
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Новое уведомление</DialogTitle>
              <DialogDescription>
                Заполните форму для создания нового уведомления
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Заголовок *</Label>
                <Input
                  id="title"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Заголовок уведомления"
                  data-testid="input-notification-title"
                />
              </div>
              
              <div>
                <Label htmlFor="message">Сообщение *</Label>
                <Textarea
                  id="message"
                  value={newNotification.message}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Текст уведомления"
                  rows={4}
                  data-testid="textarea-notification-message"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Тип уведомления</Label>
                  <Select value={newNotification.type} onValueChange={(value: any) => setNewNotification(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger data-testid="select-notification-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Информация</SelectItem>
                      <SelectItem value="warning">Предупреждение</SelectItem>
                      <SelectItem value="error">Ошибка</SelectItem>
                      <SelectItem value="success">Успех</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="priority">Приоритет</Label>
                  <Select value={newNotification.priority} onValueChange={(value: any) => setNewNotification(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger data-testid="select-notification-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Низкий</SelectItem>
                      <SelectItem value="medium">Средний</SelectItem>
                      <SelectItem value="high">Высокий</SelectItem>
                      <SelectItem value="critical">Критический</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="recipients">Получатели (email через запятую)</Label>
                <Input
                  id="recipients"
                  value={newNotification.recipients.join(', ')}
                  onChange={(e) => setNewNotification(prev => ({ 
                    ...prev, 
                    recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                  }))}
                  placeholder="email1@mchs.kz, email2@mchs.kz"
                  data-testid="input-notification-recipients"
                />
              </div>
              
              <div>
                <Label>Каналы уведомления</Label>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="email-channel"
                      checked={newNotification.channels.includes('email')}
                      onCheckedChange={(checked) => {
                        setNewNotification(prev => ({
                          ...prev,
                          channels: checked 
                            ? [...prev.channels, 'email']
                            : prev.channels.filter(c => c !== 'email')
                        }));
                      }}
                      data-testid="switch-email-channel"
                    />
                    <Label htmlFor="email-channel">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sms-channel"
                      checked={newNotification.channels.includes('sms')}
                      onCheckedChange={(checked) => {
                        setNewNotification(prev => ({
                          ...prev,
                          channels: checked 
                            ? [...prev.channels, 'sms']
                            : prev.channels.filter(c => c !== 'sms')
                        }));
                      }}
                      data-testid="switch-sms-channel"
                    />
                    <Label htmlFor="sms-channel">SMS</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="push-channel"
                      checked={newNotification.channels.includes('push')}
                      onCheckedChange={(checked) => {
                        setNewNotification(prev => ({
                          ...prev,
                          channels: checked 
                            ? [...prev.channels, 'push']
                            : prev.channels.filter(c => c !== 'push')
                        }));
                      }}
                      data-testid="switch-push-channel"
                    />
                    <Label htmlFor="push-channel">Push</Label>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="scheduledAt">Запланировать отправку (необязательно)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={newNotification.scheduledAt}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  data-testid="input-notification-schedule"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateNotification} 
                  disabled={createNotificationMutation.isPending}
                  className="flex-1"
                  data-testid="button-send-notification"
                >
                  {createNotificationMutation.isPending ? 'Отправка...' : 'Отправить'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  data-testid="button-cancel-notification"
                >
                  Отмена
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Вкладки */}
      <div className="flex border-b">
        <Button
          variant={activeTab === 'notifications' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('notifications')}
          data-testid="tab-notifications"
        >
          <Bell className="w-4 h-4 mr-2" />
          Уведомления ({notifications.length})
        </Button>
        <Button
          variant={activeTab === 'workflows' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('workflows')}
          data-testid="tab-workflows"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Согласования ({workflows.length})
        </Button>
      </div>

      {/* Содержимое вкладок */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Уведомления отсутствуют</p>
                <p className="text-sm">Создайте первое уведомление для отправки</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => {
              const typeConfig = NOTIFICATION_TYPES[notification.type];
              const IconComponent = typeConfig.icon;
              
              return (
                <Card key={notification.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${typeConfig.bg}`}>
                        <IconComponent className={`w-5 h-5 ${typeConfig.color}`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white" data-testid={`text-notification-title-${notification.id}`}>
                            {notification.title}
                          </h3>
                          <Badge className={PRIORITY_COLORS[notification.priority]} data-testid={`badge-priority-${notification.id}`}>
                            {notification.priority}
                          </Badge>
                          <Badge variant={notification.status === 'sent' ? 'default' : 'secondary'} data-testid={`badge-status-${notification.id}`}>
                            {notification.status}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 mb-3" data-testid={`text-notification-message-${notification.id}`}>
                          {notification.message}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <span className="font-medium">Получатели:</span> {notification.recipients.length}
                          </div>
                          <div>
                            <span className="font-medium">Каналы:</span> {notification.channels.join(', ')}
                          </div>
                          <div>
                            <span className="font-medium">Создано:</span> {formatDate(notification.createdAt)}
                          </div>
                          <div>
                            <span className="font-medium">Отправлено:</span> {notification.sentAt ? formatDate(notification.sentAt) : 'Не отправлено'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'workflows' && (
        <div className="space-y-4">
          {workflows.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Процессы согласования отсутствуют</p>
                <p className="text-sm">Документы на согласовании будут отображаться здесь</p>
              </CardContent>
            </Card>
          ) : (
            workflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white" data-testid={`text-workflow-title-${workflow.id}`}>
                          {workflow.title}
                        </h3>
                        <Badge variant={workflow.status === 'approved' ? 'default' : 'secondary'} data-testid={`badge-workflow-status-${workflow.id}`}>
                          {workflow.status}
                        </Badge>
                        <Badge variant="outline" data-testid={`badge-workflow-level-${workflow.id}`}>
                          Уровень {workflow.currentLevel} из {workflow.maxLevel}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <div>
                          <span className="font-medium">Тип документа:</span> {workflow.documentType}
                        </div>
                        <div>
                          <span className="font-medium">Создано:</span> {formatDate(workflow.createdAt)}
                        </div>
                      </div>
                      
                      {/* Список утверждающих */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">Процесс утверждения:</h4>
                        {workflow.approvers.map((approver) => (
                          <div key={`${approver.level}-${approver.userId}`} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">
                                Уровень {approver.level}: {approver.userName}
                              </div>
                              {approver.comment && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">{approver.comment}</p>
                              )}
                            </div>
                            <Badge variant={approver.status === 'approved' ? 'default' : 'secondary'}>
                              {approver.status}
                            </Badge>
                            {approver.approvedAt && (
                              <span className="text-sm text-gray-500">
                                {formatDate(approver.approvedAt)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Кнопки действий */}
                    {workflow.status === 'pending' && user && (user as any).id &&
                     workflow.approvers.some(a => a.userId === String((user as any).id) && a.level === workflow.currentLevel && a.status === 'pending') && (
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => approveMutation.mutate({ workflowId: workflow.id })}
                          disabled={approveMutation.isPending}
                          data-testid={`button-approve-workflow-${workflow.id}`}
                        >
                          Утвердить
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            const comment = prompt('Причина отклонения:');
                            if (comment) {
                              rejectMutation.mutate({ workflowId: workflow.id, comment });
                            }
                          }}
                          disabled={rejectMutation.isPending}
                          data-testid={`button-reject-workflow-${workflow.id}`}
                        >
                          Отклонить
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}