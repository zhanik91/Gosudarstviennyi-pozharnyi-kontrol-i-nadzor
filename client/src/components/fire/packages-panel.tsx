import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Eye, Download, Check, X } from "lucide-react";
import { format } from "date-fns";
import { type Package } from "@shared/schema";

export default function PackagesPanel() {
  const [outgoingPeriod, setOutgoingPeriod] = useState("");
  const [incomingPeriod, setIncomingPeriod] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["/api/packages"],
  });

  const submitPackageMutation = useMutation({
    mutationFn: async (packageId: string) => {
      await apiRequest("PUT", `/api/packages/${packageId}/submit`);
    },
    onSuccess: () => {
      toast({
        title: "Успех",
        description: "Пакет отправлен на рассмотрение",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить пакет",
        variant: "destructive",
      });
    },
  });

  const approvePackageMutation = useMutation({
    mutationFn: async (packageId: string) => {
      await apiRequest("PUT", `/api/packages/${packageId}/approve`);
    },
    onSuccess: () => {
      toast({
        title: "Успех",
        description: "Пакет утвержден",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось утвердить пакет",
        variant: "destructive",
      });
    },
  });

  const rejectPackageMutation = useMutation({
    mutationFn: async ({ packageId, reason }: { packageId: string; reason: string }) => {
      await apiRequest("PUT", `/api/packages/${packageId}/reject`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "Успех",
        description: "Пакет возвращен",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось возвратить пакет",
        variant: "destructive",
      });
    },
  });

  const handleSubmitUp = () => {
    if (!outgoingPeriod) {
      toast({
        title: "Ошибка",
        description: "Укажите период",
        variant: "destructive",
      });
      return;
    }
    // In a real app, would create and submit package for the period
    toast({
      title: "Информация",
      description: "Функция в разработке",
    });
  };

  const handleCreateSummary = () => {
    if (!outgoingPeriod) {
      toast({
        title: "Ошибка",
        description: "Укажите период",
        variant: "destructive",
      });
      return;
    }
    // In a real app, would create summary package
    toast({
      title: "Информация",
      description: "Функция в разработке",
    });
  };

  const handleShowIncoming = () => {
    // Refresh packages list with incoming filter
    queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Черновик", className: "bg-gray-500/20 text-gray-400" },
      submitted: { label: "На рассмотрении", className: "bg-yellow-500/20 text-yellow-400" },
      under_review: { label: "Рассматривается", className: "bg-blue-500/20 text-blue-400" },
      approved: { label: "Утверждено", className: "bg-green-500/20 text-green-400" },
      rejected: { label: "Возвращено", className: "bg-red-500/20 text-red-400" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleApprove = (packageId: string) => {
    if (confirm("Утвердить пакет?")) {
      approvePackageMutation.mutate(packageId);
    }
  };

  const handleReject = (packageId: string) => {
    const reason = prompt("Укажите причину возврата:");
    if (reason) {
      rejectPackageMutation.mutate({ packageId, reason });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Package Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Операции с пакетами</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="outgoingPeriod" className="text-sm font-medium text-foreground mb-2">
                  Период (YYYY-MM)
                </Label>
                <Input
                  id="outgoingPeriod"
                  type="text"
                  placeholder="2025-01"
                  value={outgoingPeriod}
                  onChange={(e) => setOutgoingPeriod(e.target.value)}
                  data-testid="input-outgoing-period"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmitUp}
                  data-testid="button-submit-up"
                >
                  Отправить вверх
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleCreateSummary}
                  data-testid="button-create-summary"
                >
                  Сформировать сводный
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Входящие пакеты</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="incomingPeriod" className="text-sm font-medium text-foreground mb-2">
                  Период (YYYY-MM)
                </Label>
                <Input
                  id="incomingPeriod"
                  type="text"
                  placeholder="2025-01"
                  value={incomingPeriod}
                  onChange={(e) => setIncomingPeriod(e.target.value)}
                  data-testid="input-incoming-period"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="secondary"
                  onClick={handleShowIncoming}
                  data-testid="button-show-incoming"
                >
                  Показать входящие
                </Button>
                <Button 
                  variant="secondary"
                  data-testid="button-my-packages"
                >
                  Мои пакеты
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Packages Table */}
      <Card className="bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Список пакетов</h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium text-foreground">Время</th>
                <th className="text-left p-3 font-medium text-foreground">Период</th>
                <th className="text-left p-3 font-medium text-foreground">Статус</th>
                <th className="text-left p-3 font-medium text-foreground">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {packages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    {isLoading ? "Загрузка пакетов..." : "Нет пакетов для отображения"}
                  </td>
                </tr>
              ) : (
                packages.map((pkg: Package) => (
                  <tr key={pkg.id} data-testid={`row-package-${pkg.id}`}>
                    <td className="p-3 text-foreground">
                      {format(new Date(pkg.createdAt), "dd.MM.yyyy HH:mm")}
                    </td>
                    <td className="p-3 text-foreground">
                      {pkg.period}
                    </td>
                    <td className="p-3">
                      {getStatusBadge(pkg.status)}
                    </td>
                    <td className="p-3 space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:text-primary/80"
                        data-testid={`button-view-${pkg.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-accent hover:text-accent/80"
                        data-testid={`button-download-${pkg.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {pkg.status === 'submitted' && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-400 hover:text-green-300"
                            onClick={() => handleApprove(pkg.id)}
                            disabled={approvePackageMutation.isPending}
                            data-testid={`button-approve-${pkg.id}`}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive/80"
                            onClick={() => handleReject(pkg.id)}
                            disabled={rejectPackageMutation.isPending}
                            data-testid={`button-reject-${pkg.id}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
