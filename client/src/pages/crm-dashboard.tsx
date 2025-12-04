import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useToast } from '@/hooks/use-toast';
import {
  Users, Building2, FileText, Bell, Calendar,
  TrendingUp, AlertTriangle, CheckCircle, Clock,
  Search, Filter, Plus, Mail, Phone, MapPin
} from 'lucide-react';
import Footer from '@/components/layout/footer';

export default function CRMDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: crmData, isLoading, error } = useQuery({
    queryKey: ['/api/crm/dashboard'],
    retry: 2
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    retry: 1
  });

  const markNotificationRead = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      if (!response.ok) throw new Error('Ошибка обновления уведомления');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <LoadingIndicator message="Загрузка CRM системы..." />
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ErrorDisplay
            message="Ошибка загрузки CRM"
            onRetry={() => window.location.reload()}
          />
        </div>
        <Footer />
      </div>
    );
  }

  const { 
    organizations = [],
    users = [],
    recentActivities = [],
    stats = {}
  } = crmData || {};

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Заголовок */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              CRM Система МЧС РК
            </h1>
            <p className="text-muted-foreground mt-2">
              Управление организациями, сотрудниками и документооборотом
            </p>
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Добавить
            </Button>
          </div>
        </div>

        {/* Уведомления */}
        {notifications.length > 0 && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5" />
                Активные уведомления ({notifications.filter((n: any) => !n.isRead).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {notifications.slice(0, 3).map((notif: any) => (
                  <div 
                    key={notif.id}
                    className={`flex items-start justify-between p-3 rounded-lg ${
                      notif.isRead ? 'bg-muted/50' : 'bg-blue-50 dark:bg-blue-950'
                    }`}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{notif.title}</h4>
                      <p className="text-sm text-muted-foreground">{notif.message}</p>
                    </div>
                    {!notif.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markNotificationRead.mutate(notif.id)}
                      >
                        Отметить
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Основная статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full mr-4">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Организации</p>
                <p className="text-2xl font-bold">{stats.totalOrganizations || 0}</p>
                <Badge variant="secondary" className="mt-1">
                  Активные: {stats.activeOrganizations || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full mr-4">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Сотрудники</p>
                <p className="text-2xl font-bold">{stats.totalUsers || 0}</p>
                <Badge variant="secondary" className="mt-1">
                  Онлайн: {stats.onlineUsers || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full mr-4">
                <FileText className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Документы</p>
                <p className="text-2xl font-bold">{stats.totalDocuments || 0}</p>
                <Badge variant="secondary" className="mt-1">
                  На согласовании: {stats.pendingDocuments || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full mr-4">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Критические задачи</p>
                <p className="text-2xl font-bold">{stats.criticalTasks || 0}</p>
                <Badge variant="destructive" className="mt-1">
                  Просрочено: {stats.overdueTasks || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Основной контент */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="organizations">Организации</TabsTrigger>
            <TabsTrigger value="users">Сотрудники</TabsTrigger>
            <TabsTrigger value="documents">Документы</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Последние активности */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Последние активности
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.slice(0, 5).map((activity: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {activity.user?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{activity.user}</span>{' '}
                            {activity.action}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.timestamp}
                          </p>
                        </div>
                        <Badge variant={activity.type === 'error' ? 'destructive' : 'secondary'}>
                          {activity.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Статистика задач */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Выполнение задач
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Происшествия</span>
                        <span>85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Отчеты</span>
                        <span>92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Проверки</span>
                        <span>67%</span>
                      </div>
                      <Progress value={67} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="organizations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Организации МЧС РК</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {organizations.map((org: any, index: number) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{org.name}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {org.region}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {org.type}
                              </Badge>
                              <Badge 
                                variant={org.status === 'active' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {org.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                          <span>Сотрудников: {org.employeeCount || 0}</span>
                          <span>Происшествий: {org.incidentCount || 0}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Сотрудники системы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50">
                      <Avatar>
                        <AvatarFallback>
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {user.position} • {user.organization}
                        </p>
                        <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                          {user.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                          )}
                          {user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {user.role}
                        </Badge>
                        <Badge 
                          variant={user.isOnline ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {user.isOnline ? 'Онлайн' : 'Оффлайн'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Документооборот</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-green-200 dark:border-green-800">
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                      <h3 className="font-semibold text-green-600 dark:text-green-400">
                        Утверждено
                      </h3>
                      <p className="text-2xl font-bold mt-1">{stats.approvedDocuments || 0}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-yellow-200 dark:border-yellow-800">
                    <CardContent className="p-4 text-center">
                      <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                      <h3 className="font-semibold text-yellow-600 dark:text-yellow-400">
                        На рассмотрении
                      </h3>
                      <p className="text-2xl font-bold mt-1">{stats.pendingDocuments || 0}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-red-200 dark:border-red-800">
                    <CardContent className="p-4 text-center">
                      <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                      <h3 className="font-semibold text-red-600 dark:text-red-400">
                        Отклонено
                      </h3>
                      <p className="text-2xl font-bold mt-1">{stats.rejectedDocuments || 0}</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}