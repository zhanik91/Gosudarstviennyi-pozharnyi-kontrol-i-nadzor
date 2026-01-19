import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { ErrorDisplay } from "@/components/ui/error-boundary";
import { Users, Shield, Edit, Trash2, Plus, RefreshCw, AlertTriangle, Download, Key } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type RoleOption = "ALL" | "MCHS" | "DCHS" | "DISTRICT";
type StatusOption = "ALL" | "ACTIVE" | "BLOCKED";

const roleLabels: Record<RoleOption, string> = {
  ALL: "Все роли",
  MCHS: "МЧС",
  DCHS: "ДЧС",
  DISTRICT: "Район",
};

const statusLabels: Record<StatusOption, string> = {
  ALL: "Все статусы",
  ACTIVE: "Активен",
  BLOCKED: "Заблокирован",
};

const formatDate = (value?: string | Date | null) => {
  if (!value) {
    return "—";
  }
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function AdminPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleOption>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusOption>("ALL");
  const [regionFilter, setRegionFilter] = useState("ALL");

  // Проверка прав администратора
  const userRole = (user as any)?.role;
  const isAdmin = userRole === 'MCHS' || userRole === 'admin';
  if (!isAdmin) {
    return (
      <div className="p-8">
        <ErrorDisplay
          title="Доступ запрещен"
          message="У вас нет прав для просмотра административной панели."
        />
      </div>
    );
  }

  const { data: users = [], isLoading, error, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    retry: 1,
    enabled: true,
  });

  const regions = useMemo(() => {
    const unique = Array.from(new Set(users.map((item: any) => item.region).filter(Boolean)));
    return unique.sort((a, b) => a.localeCompare(b, "ru"));
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((item: any) => {
      const matchesSearch = [item.fullName, item.username, item.email, item.region, item.district]
        .filter(Boolean)
        .some((value: string) => value.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRole = roleFilter === "ALL" || item.role === roleFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" ? item.isActive : !item.isActive);
      const matchesRegion = regionFilter === "ALL" || item.region === regionFilter;
      return matchesSearch && matchesRole && matchesStatus && matchesRegion;
    });
  }, [users, searchTerm, roleFilter, statusFilter, regionFilter]);

  const stats = useMemo(() => {
    const active = users.filter((item: any) => item.isActive).length;
    const admins = users.filter((item: any) => item.role === "MCHS").length;
    const mustChange = users.filter((item: any) => item.mustChangeOnFirstLogin).length;
    const blocked = users.filter((item: any) => !item.isActive).length;
    return { active, admins, mustChange, blocked };
  }, [users]);

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Пользователь удален",
        description: "Пользователь успешно удален из системы",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить пользователя",
        variant: "destructive",
      });
    },
  });

  const handleDeleteUser = (userId: string) => {
    if (confirm("Вы уверены, что хотите удалить этого пользователя?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/reset-password`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Пароль сброшен",
        description: `Новый временный пароль: ${data.temporaryPassword}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось сбросить пароль",
        variant: "destructive",
      });
    },
  });

  const handleResetPassword = (userId: string, username: string) => {
    if (confirm(`Сбросить пароль для пользователя ${username}?`)) {
      resetPasswordMutation.mutate(userId);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Логин", "ФИО", "Email", "Роль", "Регион", "Район", "Статус", "Последний вход", "Дата создания"];
    const rows = filteredUsers.map((u: any) => [
      u.username || "",
      u.fullName || "",
      u.email || "",
      roleLabels[u.role as RoleOption] || u.role,
      u.region || "",
      u.district || "",
      u.isActive ? "Активен" : "Заблокирован",
      formatDate(u.lastLoginAt),
      formatDate(u.createdAt),
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    
    toast({
      title: "Экспорт выполнен",
      description: `Экспортировано ${filteredUsers.length} пользователей`,
    });
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingIndicator text="Загрузка списка пользователей..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <ErrorDisplay
          title="Ошибка загрузки"
          message="Не удалось загрузить список пользователей"
          error={error as Error}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Административная панель</h2>
          <p className="text-muted-foreground">Управление пользователями системы МЧС РК</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={handleExportCSV}
            className="gap-2"
            data-testid="button-export-csv"
          >
            <Download className="w-4 h-4" />
            Экспорт CSV
          </Button>
          <Button 
            onClick={() => setShowUserForm(true)}
            className="gap-2"
            data-testid="button-add-user"
          >
            <Plus className="w-4 h-4" />
            Добавить пользователя
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">учетных записей в системе</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Администраторы</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
            <p className="text-xs text-muted-foreground">с правами управления</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Требуют смены пароля</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mustChange}</div>
            <p className="text-xs text-muted-foreground">пользователей с флагом</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">{stats.blocked} заблокировано</p>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Каталог пользователей</CardTitle>
            <p className="text-sm text-muted-foreground">
              Поиск по ФИО, логину, email, региону и району.
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            Обновить данные
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              placeholder="Поиск по пользователям"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleOption)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusOption)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Все регионы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Все регионы</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-base">Пользователи ({filteredUsers.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left">
                        <th className="p-3 font-medium">Пользователь</th>
                        <th className="p-3 font-medium">Роль</th>
                        <th className="p-3 font-medium">Регион</th>
                        <th className="p-3 font-medium">Последний вход</th>
                        <th className="p-3 font-medium">Статус</th>
                        <th className="p-3 font-medium">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user: any) => (
                        <tr
                          key={user.id}
                          className={`border-b transition hover:bg-muted/50 ${
                            selectedUser?.id === user.id ? "bg-muted/40" : ""
                          }`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="font-medium">{user.fullName || "Без имени"}</span>
                              <span className="text-xs text-muted-foreground font-mono">{user.username}</span>
                              {user.email && (
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">{roleLabels[user.role as RoleOption] ?? "Неизвестно"}</Badge>
                              {user.mustChangeOnFirstLogin && (
                                <Badge variant="outline">Смена пароля</Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col text-xs text-muted-foreground">
                              <span>{user.region || "—"}</span>
                              <span>{user.district || "—"}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(user.lastLoginAt)}
                            </span>
                          </td>
                          <td className="p-3">
                            <Badge
                              className={user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}
                            >
                              {user.isActive ? "Активен" : "Заблокирован"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setEditingUser(user);
                                  setShowUserForm(true);
                                }}
                                title="Редактировать"
                                data-testid={`button-edit-${user.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleResetPassword(user.id, user.username);
                                }}
                                disabled={resetPasswordMutation.isPending}
                                title="Сбросить пароль"
                                data-testid={`button-reset-password-${user.id}`}
                              >
                                <Key className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDeleteUser(user.id);
                                }}
                                disabled={deleteUserMutation.isPending}
                                title="Удалить"
                                data-testid={`button-delete-${user.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      Пользователи по заданным фильтрам не найдены.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Карточка пользователя</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {selectedUser ? (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">ФИО</p>
                      <p className="font-medium">{selectedUser.fullName || "Без имени"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Логин</p>
                      <p className="font-mono">{selectedUser.username}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p>{selectedUser.email || "—"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Роль</p>
                        <Badge variant="secondary">
                          {roleLabels[selectedUser.role as RoleOption] ?? "Неизвестно"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Статус</p>
                        <Badge
                          className={
                            selectedUser.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          }
                        >
                          {selectedUser.isActive ? "Активен" : "Заблокирован"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Орг. единица</p>
                      <p>{selectedUser.orgUnitId || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Регион / Район</p>
                      <p>{selectedUser.region || "—"} / {selectedUser.district || "—"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Дата создания</p>
                        <p>{formatDate(selectedUser.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Последний вход</p>
                        <p>{formatDate(selectedUser.lastLoginAt)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.mustChangeOnFirstLogin && <Badge variant="outline">Смена пароля</Badge>}
                      {selectedUser.isActive ? null : <Badge variant="outline">Требует разблокировки</Badge>}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Выберите пользователя в списке, чтобы увидеть детали и ключевые параметры учетной записи.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Форма пользователя (модальное окно) */}
      {showUserForm && (
        <UserFormModal
          user={editingUser}
          onClose={() => {
            setShowUserForm(false);
            setEditingUser(null);
          }}
          onSuccess={() => {
            setShowUserForm(false);
            setEditingUser(null);
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
          }}
        />
      )}
    </div>
  );
}

interface UserFormModalProps {
  user?: any;
  onClose: () => void;
  onSuccess: () => void;
}

function UserFormModal({ user, onClose, onSuccess }: UserFormModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: user?.username || "",
    fullName: user?.fullName || "",
    password: "",
    email: user?.email || "",
    role: user?.role || "DISTRICT",
    region: user?.region || "",
    district: user?.district || "",
    orgUnitId: user?.orgUnitId || "",
    isActive: user?.isActive ?? true,
    mustChangeOnFirstLogin: user?.mustChangeOnFirstLogin ?? true,
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = user ? `/api/admin/users/${user.id}` : '/api/admin/users';
      const method = user ? 'PUT' : 'POST';
      await apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      toast({
        title: user ? "Пользователь обновлен" : "Пользователь создан",
        description: "Изменения успешно сохранены",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось сохранить пользователя",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {user ? 'Редактировать пользователя' : 'Добавить пользователя'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Логин</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="fullName">ФИО</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            
            {!user && (
              <div>
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="role">Роль</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISTRICT">Район</SelectItem>
                  <SelectItem value="DCHS">ДЧС</SelectItem>
                  <SelectItem value="MCHS">МЧС</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="region">Регион</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="district">Район</Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="orgUnitId">Орг. единица (ID)</Label>
              <Input
                id="orgUnitId"
                value={formData.orgUnitId}
                onChange={(e) => setFormData({ ...formData, orgUnitId: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label htmlFor="mustChangeOnFirstLogin">Смена пароля при первом входе</Label>
                <p className="text-xs text-muted-foreground">Рекомендуется для новых учетных записей.</p>
              </div>
              <Switch
                id="mustChangeOnFirstLogin"
                checked={formData.mustChangeOnFirstLogin}
                onCheckedChange={(checked) => setFormData({ ...formData, mustChangeOnFirstLogin: checked })}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label htmlFor="isActive">Активная учетная запись</Label>
                <p className="text-xs text-muted-foreground">Выключите, чтобы заблокировать доступ.</p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
            
            <div className="flex items-center gap-4 pt-4">
              <Button 
                type="submit"
                disabled={createUserMutation.isPending}
                className="flex-1"
              >
                {createUserMutation.isPending ? (
                  <LoadingIndicator size="sm" />
                ) : (
                  user ? 'Обновить' : 'Создать'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Отмена
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
