import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Building2, Phone, MapPin, FileCheck, ChevronLeft, ChevronRight, Plus, User } from "lucide-react";
import { auditOrgRegistryData, type AuditOrgRegistryItem } from "@/data/audit-org-registry-data";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface AuditOrgRegistryProps {
  embedded?: boolean;
}

const REGIONS = [
  "Все регионы",
  "Астана",
  "Алматы",
  "Шымкент",
  "Акмолинская область",
  "Актюбинская область",
  "Алматинская область",
  "Атырауская область",
  "ВКО",
  "Жамбылская область",
  "ЗКО",
  "Карагандинская область",
  "Костанайская область",
  "Кызылординская область",
  "Мангистауская область",
  "Павлодарская область",
  "СКО",
  "Туркестанская область",
  "Другой",
];

const ITEMS_PER_PAGE = 20;

export default function AuditOrgRegistry({ embedded = false }: AuditOrgRegistryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("Все регионы");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newEntry, setNewEntry] = useState({
    name: "",
    applicationNumber: "",
    certificateInfo: "",
    address: "",
    phone: "",
    directorName: "",
    region: "",
  });

  const { data: dbEntries = [] } = useQuery<AuditOrgRegistryItem[]>({
    queryKey: ["/api/audit-org-registry"],
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof newEntry) => {
      return apiRequest("POST", "/api/audit-org-registry", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audit-org-registry"] });
      setIsAddDialogOpen(false);
      setNewEntry({
        name: "",
        applicationNumber: "",
        certificateInfo: "",
        address: "",
        phone: "",
        directorName: "",
        region: "",
      });
      toast({ title: "Запись добавлена", description: "Новая организация успешно добавлена в реестр" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось добавить запись", variant: "destructive" });
    },
  });

  const allData = useMemo(() => {
    const combined = [...auditOrgRegistryData];
    dbEntries.forEach((entry) => {
      if (!combined.find((e) => e.id === entry.id)) {
        combined.push(entry);
      }
    });
    return combined;
  }, [dbEntries]);

  const filteredData = useMemo(() => {
    return allData.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.directorName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRegion =
        selectedRegion === "Все регионы" || item.region === selectedRegion;

      return matchesSearch && matchesRegion;
    });
  }, [allData, searchQuery, selectedRegion]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = useMemo(() => {
    const byRegion: Record<string, number> = {};
    allData.forEach((item) => {
      byRegion[item.region] = (byRegion[item.region] || 0) + 1;
    });
    const topRegions = Object.entries(byRegion)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    return { total: allData.length, topRegions };
  }, [allData]);

  const currentDate = format(new Date(), "d MMMM yyyy", { locale: ru });

  const handleAddEntry = () => {
    if (!newEntry.name.trim()) {
      toast({ title: "Ошибка", description: "Введите наименование организации", variant: "destructive" });
      return;
    }
    addMutation.mutate(newEntry);
  };

  return (
    <div className={embedded ? "" : "container mx-auto px-4 py-6"}>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Реестр организаций по аудиту
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Экспертные организации аккредитованные на осуществление деятельности по аудиту в области пожарной безопасности. По состоянию на {currentDate}
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-audit-org">
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить организацию
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Добавить организацию в реестр</DialogTitle>
                  <DialogDescription>
                    Заполните информацию об экспертной организации по аудиту
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Наименование организации *</Label>
                    <Input
                      id="name"
                      value={newEntry.name}
                      onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                      placeholder="ТОО «Пример»"
                      data-testid="input-audit-org-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="applicationNumber">Номер заявления</Label>
                      <Input
                        id="applicationNumber"
                        value={newEntry.applicationNumber}
                        onChange={(e) => setNewEntry({ ...newEntry, applicationNumber: e.target.value })}
                        placeholder="KZ01VVB00000001"
                        data-testid="input-audit-org-application"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="certificateInfo">Аттестат</Label>
                      <Input
                        id="certificateInfo"
                        value={newEntry.certificateInfo}
                        onChange={(e) => setNewEntry({ ...newEntry, certificateInfo: e.target.value })}
                        placeholder="№ 001 от 01.01.2025"
                        data-testid="input-audit-org-certificate"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="directorName">ФИО руководителя</Label>
                    <Input
                      id="directorName"
                      value={newEntry.directorName}
                      onChange={(e) => setNewEntry({ ...newEntry, directorName: e.target.value })}
                      placeholder="Иванов И.И."
                      data-testid="input-audit-org-director"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Регион</Label>
                    <Select
                      value={newEntry.region}
                      onValueChange={(value) => setNewEntry({ ...newEntry, region: value })}
                    >
                      <SelectTrigger data-testid="select-audit-org-add-region">
                        <SelectValue placeholder="Выберите регион" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.filter((r) => r !== "Все регионы").map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Адрес</Label>
                    <Input
                      id="address"
                      value={newEntry.address}
                      onChange={(e) => setNewEntry({ ...newEntry, address: e.target.value })}
                      placeholder="г. Астана, ул. Примерная, 1"
                      data-testid="input-audit-org-address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      value={newEntry.phone}
                      onChange={(e) => setNewEntry({ ...newEntry, phone: e.target.value })}
                      placeholder="+7 (777) 123-45-67"
                      data-testid="input-audit-org-phone"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} data-testid="button-cancel-audit-org">
                    Отмена
                  </Button>
                  <Button onClick={handleAddEntry} disabled={addMutation.isPending} data-testid="button-save-audit-org">
                    {addMutation.isPending ? "Сохранение..." : "Сохранить"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-muted/50 p-4 text-center" data-testid="stat-audit-total">
              <div className="text-2xl font-bold" data-testid="text-stat-audit-total-value">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Всего организаций</div>
            </div>
            {stats.topRegions.map(([region, count], idx) => (
              <div key={region} className="rounded-lg border bg-muted/50 p-4 text-center" data-testid={`stat-audit-region-${idx}`}>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground truncate">{region}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Поиск по названию, заявлению, адресу или руководителю..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
                data-testid="input-audit-org-search"
              />
            </div>
            <Select
              value={selectedRegion}
              onValueChange={(value) => {
                setSelectedRegion(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[200px]" data-testid="select-audit-org-region">
                <SelectValue placeholder="Регион" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            Найдено: {filteredData.length} из {allData.length}
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="min-w-[250px]">Наименование</TableHead>
                  <TableHead className="min-w-[180px]">Номер заявления</TableHead>
                  <TableHead className="min-w-[200px]">Адрес</TableHead>
                  <TableHead className="min-w-[130px]">Телефон</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Нет данных для отображения
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => (
                    <TableRow key={item.id} data-testid={`row-audit-org-${item.id}`}>
                      <TableCell className="font-medium">{item.registryNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        {item.directorName && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <User className="w-3 h-3" />
                            {item.directorName}
                          </div>
                        )}
                        {item.region && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {item.region}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileCheck className="w-4 h-4 text-green-600" />
                          <span className="font-mono text-sm">{item.applicationNumber}</span>
                        </div>
                        {item.certificateInfo && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.certificateInfo}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{item.address}</TableCell>
                      <TableCell>
                        {item.phone && item.phone !== '-' && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3" />
                            <span>{item.phone}</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Страница {currentPage} из {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  data-testid="button-audit-org-prev"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Назад
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  data-testid="button-audit-org-next"
                >
                  Далее
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
