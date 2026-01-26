import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  ExternalLink, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  BookOpen,
  Scale,
  Shield,
  Building,
  Flame,
  AlertTriangle
} from "lucide-react";
import type { NormativeDocument } from "@shared/schema";

const DOCUMENT_CATEGORIES = [
  { value: "laws", label: "Законы РК", icon: Scale },
  { value: "technical_regulations", label: "Технические регламенты", icon: Shield },
  { value: "fire_safety_rules", label: "Правила пожарной безопасности", icon: Flame },
  { value: "building_codes", label: "Строительные нормы", icon: Building },
  { value: "standards", label: "Стандарты (СТ РК, ГОСТ)", icon: BookOpen },
  { value: "orders", label: "Приказы МЧС", icon: FileText },
  { value: "methodical", label: "Методические документы", icon: AlertTriangle },
  { value: "other", label: "Прочие документы", icon: FileText },
];

const CATEGORY_COLORS: Record<string, string> = {
  laws: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  technical_regulations: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  fire_safety_rules: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  building_codes: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  standards: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  orders: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  methodical: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const DEFAULT_DOCUMENTS = [
  {
    title: "Закон Республики Казахстан «О гражданской защите»",
    shortTitle: "О гражданской защите",
    documentNumber: "№ 188-V",
    documentDate: "11.04.2014",
    category: "laws",
    description: "Основной закон, регулирующий вопросы гражданской защиты, включая пожарную безопасность",
    externalUrl: "https://adilet.zan.kz/rus/docs/Z1400000188",
    sortOrder: 1
  },
  {
    title: "Технический регламент «Общие требования к пожарной безопасности»",
    shortTitle: "ТР 405",
    documentNumber: "№ 405",
    documentDate: "16.01.2012",
    category: "technical_regulations",
    description: "Технический регламент, устанавливающий общие требования к пожарной безопасности",
    externalUrl: "https://adilet.zan.kz/rus/docs/P1200000405",
    sortOrder: 2
  },
  {
    title: "Правила пожарной безопасности в Республике Казахстан (ППБ РК)",
    shortTitle: "ППБ РК",
    documentNumber: "Приказ МЧС РК № 36",
    documentDate: "09.01.2023",
    category: "fire_safety_rules",
    description: "Правила пожарной безопасности, обязательные для исполнения на территории РК",
    externalUrl: "https://adilet.zan.kz/rus/docs/V2300031791",
    sortOrder: 3
  },
  {
    title: "Правила организации деятельности противопожарной службы",
    shortTitle: "Правила ППС",
    documentNumber: "Приказ МЧС РК № 256",
    documentDate: "22.06.2022",
    category: "fire_safety_rules",
    description: "Правила организации деятельности противопожарной службы МЧС РК",
    externalUrl: "https://adilet.zan.kz/rus/docs/V2200028532",
    sortOrder: 4
  },
  {
    title: "Правила ведения государственного учета пожаров и их последствий",
    shortTitle: "Учёт пожаров",
    documentNumber: "Приказ МЧС РК",
    documentDate: "22.06.2022",
    category: "orders",
    description: "Порядок ведения государственного учета пожаров и их последствий",
    externalUrl: "https://adilet.zan.kz/rus/docs/V2200028529",
    sortOrder: 5
  },
  {
    title: "Правила пожарной безопасности для энергетических предприятий",
    shortTitle: "ППБ Энергетика",
    documentNumber: "",
    documentDate: "",
    category: "fire_safety_rules",
    description: "Специальные требования пожарной безопасности для энергетических предприятий",
    externalUrl: "https://adilet.zan.kz/rus/docs/V1100007364",
    sortOrder: 6
  },
  {
    title: "СН РК 2.02-01-2019 Противопожарная защита. Общие требования",
    shortTitle: "СН РК 2.02-01-2019",
    documentNumber: "СН РК 2.02-01-2019",
    documentDate: "2019",
    category: "building_codes",
    description: "Строительные нормы по противопожарной защите зданий и сооружений",
    externalUrl: "https://adilet.zan.kz/rus/docs/P1900000780",
    sortOrder: 7
  },
  {
    title: "СН РК 2.02-11-2017 Нормы пожарной безопасности",
    shortTitle: "СН РК 2.02-11-2017",
    documentNumber: "СН РК 2.02-11-2017",
    documentDate: "2017",
    category: "building_codes",
    description: "Нормы проектирования противопожарной защиты",
    externalUrl: "https://adilet.zan.kz/rus/docs/P1700000339",
    sortOrder: 8
  },
];

interface DocumentFormData {
  title: string;
  shortTitle: string;
  documentNumber: string;
  documentDate: string;
  category: string;
  description: string;
  externalUrl: string;
  sortOrder: number;
}

const emptyForm: DocumentFormData = {
  title: "",
  shortTitle: "",
  documentNumber: "",
  documentDate: "",
  category: "fire_safety_rules",
  description: "",
  externalUrl: "",
  sortOrder: 0
};

export default function NormativeDocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isAdmin = (user as any)?.role === "admin" || (user as any)?.role === "MCHS";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<NormativeDocument | null>(null);
  const [formData, setFormData] = useState<DocumentFormData>(emptyForm);

  const { data: documents = [], isLoading } = useQuery<NormativeDocument[]>({
    queryKey: ['/api/normative-documents'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: DocumentFormData) => {
      const res = await apiRequest('POST', '/api/normative-documents', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/normative-documents'] });
      setIsDialogOpen(false);
      setFormData(emptyForm);
      toast({ title: "Документ добавлен" });
    },
    onError: () => {
      toast({ title: "Ошибка добавления", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DocumentFormData }) => {
      const res = await apiRequest('PUT', `/api/normative-documents/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/normative-documents'] });
      setIsDialogOpen(false);
      setEditingDoc(null);
      setFormData(emptyForm);
      toast({ title: "Документ обновлен" });
    },
    onError: () => {
      toast({ title: "Ошибка обновления", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/normative-documents/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/normative-documents'] });
      toast({ title: "Документ удален" });
    },
    onError: () => {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    }
  });

  const seedDefaultsMutation = useMutation({
    mutationFn: async () => {
      for (const doc of DEFAULT_DOCUMENTS) {
        await apiRequest('POST', '/api/normative-documents', doc);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/normative-documents'] });
      toast({ title: "Документы добавлены", description: "Базовые нормативные документы загружены" });
    },
    onError: () => {
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    }
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.externalUrl || !formData.category) {
      toast({ title: "Заполните обязательные поля", variant: "destructive" });
      return;
    }
    if (editingDoc) {
      updateMutation.mutate({ id: editingDoc.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (doc: NormativeDocument) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title,
      shortTitle: doc.shortTitle || "",
      documentNumber: doc.documentNumber || "",
      documentDate: doc.documentDate || "",
      category: doc.category,
      description: doc.description || "",
      externalUrl: doc.externalUrl,
      sortOrder: doc.sortOrder || 0
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Удалить документ?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.shortTitle && doc.shortTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.documentNumber && doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedDocs = DOCUMENT_CATEGORIES.map(cat => ({
    ...cat,
    docs: filteredDocs.filter(d => d.category === cat.value)
  })).filter(g => g.docs.length > 0);

  if (isLoading) return <LoadingIndicator />;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-7 h-7" />
            Нормативные документы
          </h1>
          <p className="text-muted-foreground">
            Законодательство и нормативные акты в области пожарной безопасности
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {documents.length === 0 && (
              <Button 
                variant="outline" 
                onClick={() => seedDefaultsMutation.mutate()}
                disabled={seedDefaultsMutation.isPending}
              >
                Загрузить базовые документы
              </Button>
            )}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingDoc(null);
                setFormData(emptyForm);
              }
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Добавить документ
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingDoc ? "Редактировать документ" : "Добавить нормативный документ"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Полное название *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Полное название документа"
                      />
                    </div>
                    <div>
                      <Label>Краткое название</Label>
                      <Input
                        value={formData.shortTitle}
                        onChange={(e) => setFormData({ ...formData, shortTitle: e.target.value })}
                        placeholder="Например: ППБ РК"
                      />
                    </div>
                    <div>
                      <Label>Категория *</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(v) => setFormData({ ...formData, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Номер документа</Label>
                      <Input
                        value={formData.documentNumber}
                        onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                        placeholder="№ 405"
                      />
                    </div>
                    <div>
                      <Label>Дата документа</Label>
                      <Input
                        value={formData.documentDate}
                        onChange={(e) => setFormData({ ...formData, documentDate: e.target.value })}
                        placeholder="01.01.2024"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Ссылка (Adilet, ИПС и др.) *</Label>
                      <Input
                        value={formData.externalUrl}
                        onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                        placeholder="https://adilet.zan.kz/rus/docs/..."
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Описание</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Краткое описание документа"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Порядок сортировки</Label>
                      <Input
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingDoc ? "Сохранить" : "Добавить"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск документов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {DOCUMENT_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Нормативные документы не найдены</h3>
            <p className="text-muted-foreground mb-4">
              {isAdmin 
                ? "Нажмите кнопку ниже для загрузки базовых документов или добавьте документы вручную"
                : "Документы пока не добавлены"
              }
            </p>
            {isAdmin && (
              <Button onClick={() => seedDefaultsMutation.mutate()} disabled={seedDefaultsMutation.isPending}>
                Загрузить базовые документы
              </Button>
            )}
          </CardContent>
        </Card>
      ) : filteredDocs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Документы не найдены</h3>
            <p className="text-muted-foreground">Попробуйте изменить параметры поиска</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedDocs.map(group => {
            const Icon = group.icon;
            return (
              <Card key={group.value}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    {group.label}
                    <Badge variant="secondary" className="ml-2">{group.docs.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.docs.map(doc => (
                      <div 
                        key={doc.id}
                        className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 mt-1 text-muted-foreground flex-shrink-0" />
                            <div>
                              <a 
                                href={doc.externalUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="font-medium hover:text-primary hover:underline flex items-center gap-2"
                              >
                                {doc.shortTitle && (
                                  <Badge className={CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.other}>
                                    {doc.shortTitle}
                                  </Badge>
                                )}
                                {doc.title}
                                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                              </a>
                              {(doc.documentNumber || doc.documentDate) && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {doc.documentNumber}{doc.documentNumber && doc.documentDate && " от "}{doc.documentDate}
                                </p>
                              )}
                              {doc.description && (
                                <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1 ml-4">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEdit(doc)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDelete(doc.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
