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
  // === ЗАКОНЫ РК ===
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
  // === ТЕХНИЧЕСКИЕ РЕГЛАМЕНТЫ ===
  {
    title: "Об утверждении технического регламента «Общие требования к пожарной безопасности»",
    shortTitle: "ТР № 405",
    documentNumber: "№ 405",
    documentDate: "17.08.2021",
    category: "technical_regulations",
    description: "Технический регламент, устанавливающий общие требования к пожарной безопасности",
    externalUrl: "https://adilet.zan.kz/rus/docs/V2100024045",
    sortOrder: 2
  },
  // === ПРАВИЛА ПОЖАРНОЙ БЕЗОПАСНОСТИ ===
  {
    title: "Об утверждении Правил пожарной безопасности",
    shortTitle: "ППБ № 55",
    documentNumber: "№ 55",
    documentDate: "21.02.2022",
    category: "fire_safety_rules",
    description: "Основные правила пожарной безопасности в Республике Казахстан",
    externalUrl: "https://adilet.zan.kz/rus/docs/V2200026867",
    sortOrder: 3
  },
  {
    title: "Об утверждении Правил организации тушения пожаров",
    shortTitle: "№ 446",
    documentNumber: "№ 446",
    documentDate: "26.06.2017",
    category: "fire_safety_rules",
    description: "Правила организации тушения пожаров",
    externalUrl: "https://adilet.zan.kz/rus/docs/V1700015430",
    sortOrder: 4
  },
  {
    title: "Об утверждении Правил тушения степных пожаров, а также пожаров в населенных пунктах, в которых отсутствуют подразделения государственной противопожарной службы",
    shortTitle: "№ 107",
    documentNumber: "№ 107",
    documentDate: "11.02.2015",
    category: "fire_safety_rules",
    description: "Правила тушения степных пожаров и пожаров в населённых пунктах без подразделений ГПС",
    externalUrl: "https://adilet.zan.kz/rus/docs/V15C0010433",
    sortOrder: 5
  },
  {
    title: "Об утверждении Устава службы противопожарной службы",
    shortTitle: "Устав ПС",
    documentNumber: "№ 445",
    documentDate: "26.06.2017",
    category: "fire_safety_rules",
    description: "Устав службы противопожарной службы",
    externalUrl: "https://adilet.zan.kz/rus/docs/V1700015422",
    sortOrder: 6
  },
  // === НГПС (Негосударственная противопожарная служба) ===
  {
    title: "Об утверждении перечня организаций и объектов, на которых в обязательном порядке создается негосударственная противопожарная служба",
    shortTitle: "НГПС № 281",
    documentNumber: "№ 281",
    documentDate: "29.05.2023",
    category: "orders",
    description: "Перечень организаций и объектов для создания НГПС",
    externalUrl: "https://adilet.zan.kz/rus/docs/V2300032631",
    sortOrder: 7
  },
  {
    title: "Об утверждении Правил осуществления деятельности негосударственных противопожарных служб",
    shortTitle: "№ 782",
    documentNumber: "№ 782",
    documentDate: "07.11.2014",
    category: "orders",
    description: "Правила осуществления деятельности НГПС",
    externalUrl: "https://adilet.zan.kz/rus/docs/V14C0009931",
    sortOrder: 8
  },
  {
    title: "Об утверждении разрешительных требований, предъявляемых к негосударственным противопожарным службам",
    shortTitle: "№ 783",
    documentNumber: "№ 783",
    documentDate: "07.11.2014",
    category: "orders",
    description: "Разрешительные требования к НГПС",
    externalUrl: "https://adilet.zan.kz/rus/docs/V14C0009942",
    sortOrder: 9
  },
  {
    title: "Об утверждении Правил аттестации негосударственных противопожарных служб на право проведения работ по предупреждению и тушению пожаров",
    shortTitle: "№ 514",
    documentNumber: "№ 514",
    documentDate: "13.07.2018",
    category: "orders",
    description: "Правила аттестации НГПС",
    externalUrl: "https://adilet.zan.kz/rus/docs/V1800017281",
    sortOrder: 10
  },
  {
    title: "Об утверждении Программы курсов обучения по специальной подготовке специалистов негосударственных противопожарных служб",
    shortTitle: "№ 48",
    documentNumber: "№ 48",
    documentDate: "24.01.2015",
    category: "orders",
    description: "Программа курсов обучения специалистов НГПС",
    externalUrl: "https://adilet.zan.kz/rus/docs/V15C0010382",
    sortOrder: 11
  },
  // === АУДИТ И ЭКСПЕРТНЫЕ ОРГАНИЗАЦИИ ===
  {
    title: "Об утверждении Правил проведения аудита в области пожарной безопасности",
    shortTitle: "Аудит № 240",
    documentNumber: "№ 240",
    documentDate: "03.04.2017",
    category: "orders",
    description: "Правила проведения аудита в области пожарной безопасности",
    externalUrl: "https://adilet.zan.kz/rus/docs/V1700015099",
    sortOrder: 12
  },
  {
    title: "Об утверждении разрешительных требований, предъявляемых к экспертным организациям",
    shortTitle: "№ 110",
    documentNumber: "№ 110",
    documentDate: "13.02.2015",
    category: "orders",
    description: "Разрешительные требования к экспертным организациям",
    externalUrl: "https://adilet.zan.kz/rus/docs/V1500010496",
    sortOrder: 13
  },
  {
    title: "Об утверждении Правил аккредитации экспертных организаций",
    shortTitle: "№ 112",
    documentNumber: "№ 112",
    documentDate: "13.02.2015",
    category: "orders",
    description: "Правила аккредитации экспертных организаций",
    externalUrl: "https://adilet.zan.kz/rus/docs/V1500010488",
    sortOrder: 14
  },
  {
    title: "Об утверждении Правил осуществления деятельности исследовательских испытательных пожарных лабораторий",
    shortTitle: "№ 510",
    documentNumber: "№ 510",
    documentDate: "27.07.2017",
    category: "orders",
    description: "Правила деятельности исследовательских испытательных пожарных лабораторий",
    externalUrl: "https://adilet.zan.kz/rus/docs/V1700015540",
    sortOrder: 15
  },
  // === МОНТАЖ СИСТЕМ ПОЖАРНОЙ АВТОМАТИКИ ===
  {
    title: "Об утверждении Правил выдачи разрешения на осуществление деятельности по монтажу, наладке и техническому обслуживанию систем пожарной автоматики",
    shortTitle: "№ 372",
    documentNumber: "№ 372",
    documentDate: "28.08.2025",
    category: "orders",
    description: "Правила выдачи разрешения на монтаж систем пожарной автоматики",
    externalUrl: "https://adilet.zan.kz/rus/docs/V2500036734",
    sortOrder: 16
  },
  {
    title: "Об утверждении разрешительных требований, предъявляемых к ИП и юридическим лицам на осуществление деятельности по монтажу, наладке и техническому обслуживанию систем пожарной автоматики",
    shortTitle: "№ 322",
    documentNumber: "№ 322",
    documentDate: "14.08.2025",
    category: "orders",
    description: "Разрешительные требования к организациям по монтажу систем пожарной автоматики",
    externalUrl: "https://adilet.zan.kz/rus/docs/V2500036640",
    sortOrder: 17
  },
  // === ЗАКЛЮЧЕНИЯ О СООТВЕТСТВИИ ===
  {
    title: "Об утверждении Правил выдачи заключения о соответствии объекта требованиям пожарной безопасности",
    shortTitle: "№ 359",
    documentNumber: "№ 359",
    documentDate: "26.08.2025",
    category: "orders",
    description: "Правила выдачи заключения о соответствии объекта требованиям ПБ",
    externalUrl: "https://adilet.zan.kz/rus/docs/V2500036695",
    sortOrder: 18
  },
  {
    title: "Об утверждении формы заключения о соответствии объекта требованиям пожарной безопасности перед приемкой его в эксплуатацию",
    shortTitle: "№ 309",
    documentNumber: "№ 309",
    documentDate: "06.08.2025",
    category: "orders",
    description: "Форма заключения о соответствии объекта требованиям ПБ",
    externalUrl: "https://adilet.zan.kz/rus/docs/V2500036593",
    sortOrder: 19
  },
  // === ОБУЧЕНИЕ МЕРАМ ПОЖАРНОЙ БЕЗОПАСНОСТИ ===
  {
    title: "Об утверждении Правил обучения работников организаций и населения мерам пожарной безопасности и требования к содержанию учебных программ",
    shortTitle: "№ 276",
    documentNumber: "№ 276",
    documentDate: "09.06.2014",
    category: "orders",
    description: "Правила обучения работников и населения мерам пожарной безопасности",
    externalUrl: "https://adilet.zan.kz/rus/docs/V1400009510",
    sortOrder: 20
  },
  {
    title: "Об утверждении квалификационных требований к специализированным учебным центрам в области пожарной безопасности",
    shortTitle: "№ 926",
    documentNumber: "№ 926",
    documentDate: "16.11.2015",
    category: "orders",
    description: "Квалификационные требования к учебным центрам по пожарной безопасности",
    externalUrl: "https://adilet.zan.kz/rus/docs/V1500012478",
    sortOrder: 21
  },
  {
    title: "Об утверждении учебной программы первоначальной подготовки добровольных пожарных",
    shortTitle: "№ 888",
    documentNumber: "№ 888",
    documentDate: "07.11.2015",
    category: "orders",
    description: "Учебная программа подготовки добровольных пожарных",
    externalUrl: "https://adilet.zan.kz/rus/docs/V1500012416",
    sortOrder: 22
  },
  // === КОНТРОЛЬ И НАДЗОР ===
  {
    title: "Об утверждении Инструкции использования технических средств при осуществлении государственного контроля и надзора в области пожарной безопасности",
    shortTitle: "№ 236",
    documentNumber: "№ 236",
    documentDate: "20.06.2024",
    category: "orders",
    description: "Инструкция использования технических средств при госконтроле",
    externalUrl: "https://adilet.zan.kz/rus/docs/V2400034540",
    sortOrder: 23
  },
  {
    title: "Об утверждении критериев оценки степени риска и проверочных листов в области пожарной безопасности и гражданской обороны",
    shortTitle: "№ 758/31",
    documentNumber: "№ 758 и № 31",
    documentDate: "30.10.2018",
    category: "orders",
    description: "Критерии оценки степени риска и проверочные листы",
    externalUrl: "https://adilet.zan.kz/rus/docs/V1800017647",
    sortOrder: 24
  },
  {
    title: "Об утверждении формы акта о приостановлении деятельности или отдельных видов деятельности в области пожарной безопасности",
    shortTitle: "№ 249",
    documentNumber: "№ 249",
    documentDate: "27.06.2024",
    category: "orders",
    description: "Форма акта о приостановлении деятельности в области ПБ",
    externalUrl: "https://adilet.zan.kz/rus/docs/V2400034610",
    sortOrder: 25
  },
  // === ПОЖАРНЫЕ ПОСТЫ ===
  {
    title: "Об утверждении Правил создания местными исполнительными органами пожарных постов, их материально-технического оснащения",
    shortTitle: "№ 746",
    documentNumber: "№ 746",
    documentDate: "30.10.2014",
    category: "orders",
    description: "Правила создания пожарных постов местными исполнительными органами",
    externalUrl: "https://adilet.zan.kz/rus/docs/V14C0009928",
    sortOrder: 26
  },
  // === СПЕЦИАЛЬНЫЕ ТЕХНИЧЕСКИЕ УСЛОВИЯ ===
  {
    title: "Об утверждении Правил согласования специальных технических условий, отражающих специфику противопожарной защиты объектов",
    shortTitle: "№ 351",
    documentNumber: "№ 351",
    documentDate: "22.08.2025",
    category: "orders",
    description: "Правила согласования специальных технических условий",
    externalUrl: "https://adilet.zan.kz/rus/docs/V2500036681",
    sortOrder: 27
  },
  // === ФОРМЫ ОТЧЁТНОСТИ ===
  {
    title: "Об утверждении форм, предназначенных для сбора административных данных «Сведения о пожарах»",
    shortTitle: "№ 377",
    documentNumber: "№ 377",
    documentDate: "28.08.2025",
    category: "orders",
    description: "Формы для сбора административных данных о пожарах",
    externalUrl: "https://adilet.zan.kz/rus/docs/G25O0000377",
    sortOrder: 28
  },
  {
    title: "Об утверждении Правил обеспечения питанием сотрудников и военнослужащих органов гражданской защиты при нахождении на казарменном положении",
    shortTitle: "№ 373",
    documentNumber: "№ 373",
    documentDate: "28.08.2025",
    category: "orders",
    description: "Правила обеспечения питанием сотрудников при казарменном положении",
    externalUrl: "https://adilet.zan.kz/rus/docs/V2500036731",
    sortOrder: 29
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
