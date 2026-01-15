import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Bell,
  Settings,
  Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeadlineInfo {
  formIndex: string;
  formName: string;
  dueDate: Date;
  status: 'completed' | 'draft' | 'overdue' | 'submitted';
  daysLeft: number;
  priority: 'high' | 'medium' | 'low';
}

export default function DeadlineControl() {
  const [deadlines, setDeadlines] = useState<DeadlineInfo[]>([]);
  const [notifications, setNotifications] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // 27 числа текущего месяца - крайний срок подачи
    const dueDate = new Date(currentYear, currentMonth, 27);
    
    // Если 27 число уже прошло, берем следующий месяц
    if (today.getDate() > 27) {
      dueDate.setMonth(currentMonth + 1);
    }

    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const forms: DeadlineInfo[] = [
      {
        formIndex: '1-ОСП',
        formName: 'Общие сведения о пожарах и гибели людей',
        dueDate,
        status: 'completed',
        daysLeft,
        priority: daysLeft <= 3 ? 'high' : daysLeft <= 7 ? 'medium' : 'low'
      },
      {
        formIndex: '2-ССГ',
        formName: 'Сведения о случаях горения, не подлежащие учету как пожары',
        dueDate,
        status: 'draft',
        daysLeft,
        priority: daysLeft <= 3 ? 'high' : daysLeft <= 7 ? 'medium' : 'low'
      },
      {
        formIndex: '3-СПВП',
        formName: 'Сведения о причинах возникновения пожаров',
        dueDate,
        status: 'draft',
        daysLeft,
        priority: daysLeft <= 3 ? 'high' : daysLeft <= 7 ? 'medium' : 'low'
      },
      {
        formIndex: '4-СОВП',
        formName: 'Сведения об объектах возникновения пожаров',
        dueDate,
        status: 'draft',
        daysLeft,
        priority: daysLeft <= 3 ? 'high' : daysLeft <= 7 ? 'medium' : 'low'
      },
      {
        formIndex: '5-СПЖС',
        formName: 'Сведения о пожарах в жилом секторе',
        dueDate,
        status: 'draft',
        daysLeft,
        priority: daysLeft <= 3 ? 'high' : daysLeft <= 7 ? 'medium' : 'low'
      },
      {
        formIndex: '6-ССПЗ',
        formName: 'Сведения о степных пожарах и загораниях',
        dueDate,
        status: 'draft',
        daysLeft,
        priority: daysLeft <= 3 ? 'high' : daysLeft <= 7 ? 'medium' : 'low'
      },
      {
        formIndex: '7-CO',
        formName: 'Сведения о погибших и травмированных от отравления угарным газом',
        dueDate,
        status: 'draft',
        daysLeft,
        priority: daysLeft <= 3 ? 'high' : daysLeft <= 7 ? 'medium' : 'low'
      }
    ];

    setDeadlines(forms);

    // Автоматические уведомления
    if (notifications) {
      const urgentForms = forms.filter(f => f.daysLeft <= 3 && f.status !== 'submitted');
      if (urgentForms.length > 0) {
        toast({
          title: "Внимание! Приближается крайний срок",
          description: `${urgentForms.length} форм должны быть поданы в течение ${daysLeft} дней`,
          variant: "destructive"
        });
      }
    }
  }, [notifications, toast]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'submitted': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Готов к отправке';
      case 'submitted': return 'Отправлен';
      case 'overdue': return 'Просрочен';
      default: return 'Черновик';
    }
  };

  const sendReminder = (formIndex: string) => {
    toast({
      title: "Напоминание отправлено",
      description: `Напоминание о форме ${formIndex} отправлено ответственному лицу`
    });
  };

  const bulkSubmit = () => {
    const readyForms = deadlines.filter(d => d.status === 'completed');
    if (readyForms.length === 0) {
      toast({
        title: "Нет готовых форм",
        description: "Все формы должны быть заполнены и проверены",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Массовая отправка",
      description: `${readyForms.length} форм отправлены в КПС МЧС РК`
    });
  };

  const urgentCount = deadlines.filter(d => d.priority === 'high' && d.status !== 'submitted').length;
  const completedCount = deadlines.filter(d => d.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Контроль сроков подачи отчетов</h2>
          <p className="text-muted-foreground">
            Крайний срок подачи: 27 число каждого месяца
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNotifications(!notifications)}
            className={notifications ? 'bg-blue-50' : ''}
          >
            <Bell className="h-4 w-4 mr-2" />
            {notifications ? 'Уведомления вкл.' : 'Уведомления выкл.'}
          </Button>
          <Button onClick={bulkSubmit} disabled={completedCount === 0}>
            <Send className="h-4 w-4 mr-2" />
            Отправить все готовые ({completedCount})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Дней до крайнего срока</p>
                <p className="text-2xl font-bold">{deadlines[0]?.daysLeft || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Срочные</p>
                <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Готовые</p>
                <p className="text-2xl font-bold text-blue-600">{completedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Отправленные</p>
                <p className="text-2xl font-bold text-green-600">
                  {deadlines.filter(d => d.status === 'submitted').length}
                </p>
              </div>
              <Send className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Сроки подачи форм
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deadlines.map((deadline) => (
              <div
                key={deadline.formIndex}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium">{deadline.formIndex}</div>
                    <div className="text-sm text-muted-foreground max-w-md">
                      {deadline.formName}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge className={getPriorityColor(deadline.priority)}>
                    {deadline.priority === 'high' && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {deadline.priority === 'medium' && <Clock className="h-3 w-3 mr-1" />}
                    {deadline.priority === 'low' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {deadline.daysLeft} дн.
                  </Badge>
                  
                  <Badge className={getStatusColor(deadline.status)}>
                    {getStatusText(deadline.status)}
                  </Badge>

                  {deadline.status === 'draft' && deadline.priority === 'high' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendReminder(deadline.formIndex)}
                    >
                      <Bell className="h-4 w-4 mr-1" />
                      Напомнить
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-amber-50 dark:bg-amber-900/20">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Настройки автоматических напоминаний
          </h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• За 7 дней до крайнего срока - первое напоминание</p>
            <p>• За 3 дня до крайнего срока - критическое напоминание</p>
            <p>• В день крайнего срока - финальное уведомление</p>
            <p>• При просрочке - ежедневные напоминания до подачи</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
