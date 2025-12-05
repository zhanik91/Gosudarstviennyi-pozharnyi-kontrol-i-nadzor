import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { type Incident } from "@shared/schema";

export default function IncidentsTable() {
  const [period, setPeriod] = useState("");
  const [includeSubOrgs, setIncludeSubOrgs] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: incidents = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/incidents", { period, includeSubOrgs }],
    enabled: false, // Only fetch when user clicks "Загрузить"
  });

  const deleteIncidentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/incidents/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Успех",
        description: "Инцидент удален",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить инцидент",
        variant: "destructive",
      });
    },
  });

  const handleLoad = () => {
    refetch();
  };

  const handleDelete = (id: string) => {
    if (confirm("Вы уверены, что хотите удалить этот инцидент?")) {
      deleteIncidentMutation.mutate(id);
    }
  };

  const getStatusBadge = (incident: Incident) => {
    // This is simplified - in a real app, status would come from the package relationship
    const statuses = ['Утверждено', 'На рассмотрении', 'Возвращено'];
    const colors = ['bg-green-500/20 text-green-400', 'bg-yellow-500/20 text-yellow-400', 'bg-red-500/20 text-red-400'];
    const randomIndex = Math.floor(Math.random() * statuses.length);
    
    return (
      <Badge variant="secondary" className={colors[randomIndex]}>
        {statuses[randomIndex]}
      </Badge>
    );
  };

  const formatIncidentType = (type: string) => {
    const types: Record<string, string> = {
      fire: "Пожар",
      nonfire: "Случай горения",
      steppe_fire: "Степной пожар",
      steppe_smolder: "Степное загорание",
      co_nofire: "Отравление CO без пожара",
    };
    return types[type] || type;
  };

  const formatLocality = (locality: string) => {
    const localities: Record<string, string> = {
      city_pgt: "Города/ПГТ",
      rural: "Сельская местность",
    };
    return localities[locality] || locality;
  };

  return (
    <Card className="bg-card border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-foreground">Список инцидентов</h3>
          <div className="flex items-center gap-3">
            <Input
              type="text"
              placeholder="Период (YYYY-MM)"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-40"
              data-testid="input-period"
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="includeSubOrgs"
                checked={includeSubOrgs}
                onCheckedChange={(checked) => setIncludeSubOrgs(checked as boolean)}
                data-testid="checkbox-include-sub-orgs"
              />
              <Label htmlFor="includeSubOrgs" className="text-sm text-foreground">
                включая подведомственные
              </Label>
            </div>
            <Button 
              onClick={handleLoad} 
              disabled={isLoading}
              data-testid="button-load-incidents"
            >
              {isLoading ? "Загрузка..." : "Загрузить"}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium text-foreground">Дата</th>
              <th className="text-left p-3 font-medium text-foreground">Тип</th>
              <th className="text-left p-3 font-medium text-foreground">Местность</th>
              <th className="text-left p-3 font-medium text-foreground">Ущерб</th>
              <th className="text-left p-3 font-medium text-foreground">Статус</th>
              <th className="text-left p-3 font-medium text-foreground">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(incidents as any)?.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  {isLoading ? "Загрузка данных..." : "Нет данных для отображения. Нажмите 'Загрузить' для получения данных."}
                </td>
              </tr>
            ) : (
              (incidents as any)?.map((incident: any) => (
                <tr key={incident.id} data-testid={`row-incident-${incident.id}`}>
                  <td className="p-3 text-foreground">
                    {format(new Date(incident.dateTime), "dd.MM.yyyy HH:mm")}
                  </td>
                  <td className="p-3 text-foreground">
                    {formatIncidentType(incident.incidentType)}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {formatLocality(incident.locality)}
                  </td>
                  <td className="p-3 text-foreground">
                    {incident.damage ? `${parseFloat(incident.damage).toFixed(1)} тыс. тг` : "—"}
                  </td>
                  <td className="p-3">
                    {getStatusBadge(incident)}
                  </td>
                  <td className="p-3 space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:text-primary/80"
                      data-testid={`button-edit-${incident.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive/80"
                      onClick={() => handleDelete(incident.id)}
                      disabled={deleteIncidentMutation.isPending}
                      data-testid={`button-delete-${incident.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
