import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Building2, Phone, MapPin, FileCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { ppsRegistryData, type PpsRegistryItem } from "@/data/pps-registry-data";

interface PpsRegistryProps {
  embedded?: boolean;
}

const SERVICE_TYPE_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  "с выездной техникой": { label: "С выездной техникой", variant: "default" },
  "без выездной техники": { label: "Без выездной техники", variant: "secondary" },
  "с выездной техникой и без выездной техники": { label: "Комбинированная", variant: "outline" },
};

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
];

const ITEMS_PER_PAGE = 20;

export default function PpsRegistry({ embedded = false }: PpsRegistryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("Все регионы");
  const [selectedServiceType, setSelectedServiceType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    return ppsRegistryData.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRegion =
        selectedRegion === "Все регионы" || item.region === selectedRegion;

      const matchesServiceType =
        selectedServiceType === "all" ||
        item.serviceType.toLowerCase().includes(selectedServiceType.toLowerCase());

      return matchesSearch && matchesRegion && matchesServiceType;
    });
  }, [searchQuery, selectedRegion, selectedServiceType]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getServiceTypeBadge = (serviceType: string) => {
    const normalizedType = serviceType.toLowerCase().trim();
    for (const [key, value] of Object.entries(SERVICE_TYPE_BADGES)) {
      if (normalizedType.includes(key)) {
        return <Badge variant={value.variant}>{value.label}</Badge>;
      }
    }
    return <Badge variant="outline">{serviceType}</Badge>;
  };

  const stats = useMemo(() => {
    const withTech = ppsRegistryData.filter(
      (i) => i.serviceType.toLowerCase().includes("с выездной техникой") && !i.serviceType.toLowerCase().includes("без")
    ).length;
    const withoutTech = ppsRegistryData.filter(
      (i) => i.serviceType.toLowerCase().includes("без выездной") && !i.serviceType.toLowerCase().includes("с выездной")
    ).length;
    const combined = ppsRegistryData.length - withTech - withoutTech;
    return { total: ppsRegistryData.length, withTech, withoutTech, combined };
  }, []);

  return (
    <div className={embedded ? "" : "container mx-auto px-4 py-6"}>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Реестр профессиональных противопожарных служб
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Данные реестра НГПС по состоянию на октябрь 2025 года
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-muted/50 p-4 text-center" data-testid="stat-total">
              <div className="text-2xl font-bold" data-testid="text-stat-total-value">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Всего служб</div>
            </div>
            <div className="rounded-lg border bg-muted/50 p-4 text-center" data-testid="stat-with-tech">
              <div className="text-2xl font-bold" data-testid="text-stat-with-tech-value">{stats.withTech}</div>
              <div className="text-sm text-muted-foreground">С техникой</div>
            </div>
            <div className="rounded-lg border bg-muted/50 p-4 text-center" data-testid="stat-without-tech">
              <div className="text-2xl font-bold" data-testid="text-stat-without-tech-value">{stats.withoutTech}</div>
              <div className="text-sm text-muted-foreground">Без техники</div>
            </div>
            <div className="rounded-lg border bg-muted/50 p-4 text-center" data-testid="stat-combined">
              <div className="text-2xl font-bold" data-testid="text-stat-combined-value">{stats.combined}</div>
              <div className="text-sm text-muted-foreground">Комбинированные</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Поиск по названию, аттестату или адресу..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
                data-testid="input-pps-search"
              />
            </div>
            <Select
              value={selectedRegion}
              onValueChange={(value) => {
                setSelectedRegion(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[200px]" data-testid="select-pps-region">
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
            <Select
              value={selectedServiceType}
              onValueChange={(value) => {
                setSelectedServiceType(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[200px]" data-testid="select-pps-service-type">
                <SelectValue placeholder="Тип службы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="с выездной техникой">С выездной техникой</SelectItem>
                <SelectItem value="без выездной">Без выездной техники</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            Найдено: {filteredData.length} из {ppsRegistryData.length}
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="min-w-[250px]">Наименование</TableHead>
                  <TableHead className="min-w-[150px]">Тип службы</TableHead>
                  <TableHead className="min-w-[150px]">Номер аттестата</TableHead>
                  <TableHead className="min-w-[200px]">Адрес</TableHead>
                  <TableHead className="min-w-[130px]">Телефон</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Нет данных для отображения
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => (
                    <TableRow key={item.id} data-testid={`row-pps-${item.id}`}>
                      <TableCell className="font-medium">{item.registryNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        {item.region && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {item.region}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getServiceTypeBadge(item.serviceType)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileCheck className="w-4 h-4 text-green-600" />
                          <span className="font-mono text-sm">{item.certificateNumber}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.certificateValidity}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{item.address}</TableCell>
                      <TableCell>
                        {item.phone && (
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
                  data-testid="button-pps-prev"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Назад
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  data-testid="button-pps-next"
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
