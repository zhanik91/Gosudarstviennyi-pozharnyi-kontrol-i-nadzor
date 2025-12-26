import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { ErrorDisplay } from "@/components/ui/error-boundary";
import { Users, Shield, Edit, Trash2, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function UsersManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  if ((user as any)?.role !== 'admin') {
    return (
      <div className="p-8">
        <ErrorDisplay
          title="Доступ запрещен"
          message="У вас нет прав для просмотра административной панели."
        />
      </div>
    );
  }

  const { data: users = [], isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    retry: 1,
    enabled: false,
  });

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

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingIndicator message="Загрузка списка пользователей..." />
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Управление пользователями</h2>
          <p className="text-muted-foreground">Управление пользователями системы МЧС РК</p>
        </div>
        <Button 
          onClick={() => setShowUserForm(true)}
          className="gap-2"
          data-testid="button-add-user"
        >
          <Plus className="w-4 h-4" />
          Добавить пользователя
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">активных учетных записей</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Администраторы</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u: any) => u.role === 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground">с правами админа</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Регионы</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(users.map((u: any) => u.region)).size}
            </div>
            <p className="text-xs text-muted-foreground">охваченных регионов</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Пользователи системы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">ФИО</th>
                  <th className="text-left p-3 font-medium">Логин</th>
                  <th className="text-left p-3 font-medium">Роль</th>
                  <th className="text-left p-3 font-medium">Регион</th>
                  <th className="text-left p-3 font-medium">Район</th>
                  <th className="text-left p-3 font-medium">Статус</th>
                  <th className="text-left p-3 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">{user.fullName}</td>
                    <td className="p-3 font-mono">{user.username}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'approver' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'reviewer' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? 'Администратор' :
                         user.role === 'approver' ? 'Утверждающий' :
                         user.role === 'reviewer' ? 'Проверяющий' : 'Редактор'}
                      </span>
                    </td>
                    <td className="p-3">{user.region}</td>
                    <td className="p-3">{user.district}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user);
                            setShowUserForm(true);
                          }}
                          data-testid={`button-edit-${user.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deleteUserMutation.isPending}
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
          </div>
        </CardContent>
      </Card>

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
    role: user?.role || "editor",
    region: user?.region || "",
    district: user?.district || "",
    isActive: user?.isActive ?? true,
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
                  <SelectItem value="editor">Редактор</SelectItem>
                  <SelectItem value="reviewer">Проверяющий</SelectItem>
                  <SelectItem value="approver">Утверждающий</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                </SelectContent>
              </Select>
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
