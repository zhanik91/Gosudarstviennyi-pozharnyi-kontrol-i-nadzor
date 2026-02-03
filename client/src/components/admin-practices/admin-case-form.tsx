import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { REGION_NAMES, ADMIN2_BY_REGION } from "@/data/kazakhstan-data";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

const KOAP_ARTICLES = [
  { value: "ст.410", label: "ст.410 - Нарушение требований пожарной безопасности" },
  { value: "ст.410-1", label: "ст.410-1 - Нарушение при аудите пожарной безопасности" },
  { value: "ст.336", label: "ст.336 - Нарушение при складировании/сжигании отходов" },
  { value: "ст.359", label: "ст.359 - Повреждение противопожарных систем водоснабжения" },
  { value: "ст.367", label: "ст.367 - Нарушение пожарной безопасности в лесах" },
  { value: "ст.438", label: "ст.438 - Ложный вызов спецслужб" },
  { value: "ст.589", label: "ст.589 - Нарушение пожарной безопасности на транспорте" },
];

const STATUS_OPTIONS = [
  { value: "opened", label: "Открыто" },
  { value: "in_review", label: "На рассмотрении" },
  { value: "resolved", label: "Рассмотрено" },
  { value: "closed", label: "Закрыто" },
  { value: "canceled", label: "Отменено" },
];

const PAYMENT_TYPE_OPTIONS = [
  { value: "voluntary", label: "Добровольная оплата" },
  { value: "forced", label: "Принудительная оплата" },
];

const OUTCOME_OPTIONS = [
  { value: "warning", label: "Предупреждение" },
  { value: "termination", label: "Прекращение дела" },
  { value: "other", label: "Штраф / Другое" },
];

const PENALTY_TYPE_OPTIONS = [
  { value: "fine", label: "Штраф" },
  { value: "warning", label: "Предупреждение" },
  { value: "suspension", label: "Приостановление деятельности" },
];

const adminCaseFormSchema = z.object({
  number: z.string().min(1, "Номер дела обязателен"),
  caseDate: z.string().min(1, "Дата дела обязательна"),
  region: z.string().min(1, "Регион обязателен"),
  district: z.string().optional(),
  article: z.string().min(1, "Статья КоАП обязательна"),
  status: z.string().default("opened"),
  paymentType: z.string().optional(),
  outcome: z.string().optional(),
  protocolNumber: z.string().optional(),
  protocolDate: z.string().optional(),
  offenderName: z.string().optional(),
  offenderBirthDate: z.string().optional(),
  offenderIin: z.string().optional(),
  orgName: z.string().optional(),
  orgBin: z.string().optional(),
  inspectorName: z.string().optional(),
  penaltyType: z.string().optional(),
  resolutionDate: z.string().optional(),
  fineAmount: z.string().optional(),
  finePaidVoluntary: z.boolean().default(false),
  finePaidReduced: z.boolean().default(false),
  finePaidForced: z.boolean().default(false),
  terminationReason: z.string().optional(),
  terminationDate: z.string().optional(),
  appealResult: z.string().optional(),
  appealDecisionDate: z.string().optional(),
  transferTo: z.string().optional(),
  transferType: z.string().optional(),
  enforcementSent: z.boolean().default(false),
  offenderContact: z.string().optional(),
});

type AdminCaseFormData = z.infer<typeof adminCaseFormSchema>;

interface AdminCaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: any;
}

export default function AdminCaseForm({ open, onOpenChange, editData }: AdminCaseFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const userRole = (user as any)?.role?.toUpperCase?.() || (user as any)?.role || "";
  const isMchsUser = userRole === "MCHS" || userRole === "ADMIN";
  const isDchsUser = userRole === "DCHS";
  const userRegion = (user as any)?.region || "";
  const userDistrict = (user as any)?.district || "";

  const form = useForm<AdminCaseFormData>({
    resolver: zodResolver(adminCaseFormSchema),
    defaultValues: {
      number: "",
      caseDate: new Date().toISOString().split("T")[0],
      region: isMchsUser ? "" : userRegion,
      district: isDchsUser || !isMchsUser ? userDistrict : "",
      article: "",
      status: "opened",
      paymentType: "",
      outcome: "",
      protocolNumber: "",
      protocolDate: "",
      offenderName: "",
      offenderBirthDate: "",
      offenderIin: "",
      orgName: "",
      orgBin: "",
      inspectorName: "",
      penaltyType: "",
      resolutionDate: "",
      fineAmount: "",
      finePaidVoluntary: false,
      finePaidReduced: false,
      finePaidForced: false,
      terminationReason: "",
      terminationDate: "",
      appealResult: "",
      appealDecisionDate: "",
      transferTo: "",
      transferType: "",
      enforcementSent: false,
      offenderContact: "",
    },
  });

  const watchRegion = form.watch("region");

  const availableDistricts = useMemo(() => {
    if (!watchRegion) return [];
    return ADMIN2_BY_REGION[watchRegion] || [];
  }, [watchRegion]);

  useEffect(() => {
    if (editData) {
      const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "";
        try {
          return new Date(dateStr).toISOString().split("T")[0];
        } catch {
          return "";
        }
      };

      form.reset({
        number: editData.number || "",
        caseDate: formatDate(editData.caseDate),
        region: editData.region || "",
        district: editData.district || "",
        article: editData.article || "",
        status: editData.status || "opened",
        paymentType: editData.paymentType || "",
        outcome: editData.outcome || "",
        protocolNumber: editData.protocolNumber || "",
        protocolDate: formatDate(editData.protocolDate),
        offenderName: editData.offenderName || "",
        offenderBirthDate: formatDate(editData.offenderBirthDate),
        offenderIin: editData.offenderIin || "",
        orgName: editData.orgName || "",
        orgBin: editData.orgBin || "",
        inspectorName: editData.inspectorName || "",
        penaltyType: editData.penaltyType || "",
        resolutionDate: formatDate(editData.resolutionDate),
        fineAmount: editData.fineAmount?.toString() || "",
        finePaidVoluntary: editData.finePaidVoluntary || false,
        finePaidReduced: editData.finePaidReduced || false,
        finePaidForced: editData.finePaidForced || false,
        terminationReason: editData.terminationReason || "",
        terminationDate: formatDate(editData.terminationDate),
        appealResult: editData.appealResult || "",
        appealDecisionDate: formatDate(editData.appealDecisionDate),
        transferTo: editData.transferTo || "",
        transferType: editData.transferType || "",
        enforcementSent: editData.enforcementSent || false,
        offenderContact: editData.offenderContact || "",
      });
    } else {
      form.reset({
        number: "",
        caseDate: new Date().toISOString().split("T")[0],
        region: isMchsUser ? "" : userRegion,
        district: isDchsUser || !isMchsUser ? userDistrict : "",
        article: "",
        status: "opened",
        paymentType: "",
        outcome: "",
        protocolNumber: "",
        protocolDate: "",
        offenderName: "",
        offenderBirthDate: "",
        offenderIin: "",
        orgName: "",
        orgBin: "",
        inspectorName: "",
        penaltyType: "",
        resolutionDate: "",
        fineAmount: "",
        finePaidVoluntary: false,
        finePaidReduced: false,
        finePaidForced: false,
        terminationReason: "",
        terminationDate: "",
        appealResult: "",
        appealDecisionDate: "",
        transferTo: "",
        transferType: "",
        enforcementSent: false,
        offenderContact: "",
      });
    }
  }, [editData, open, form, isMchsUser, isDchsUser, userRegion, userDistrict]);

  const createMutation = useMutation({
    mutationFn: async (data: AdminCaseFormData) => {
      const payload = {
        ...data,
        caseDate: data.caseDate ? new Date(data.caseDate).toISOString() : null,
        protocolDate: data.protocolDate ? new Date(data.protocolDate).toISOString() : null,
        offenderBirthDate: data.offenderBirthDate ? new Date(data.offenderBirthDate).toISOString() : null,
        resolutionDate: data.resolutionDate ? new Date(data.resolutionDate).toISOString() : null,
        terminationDate: data.terminationDate ? new Date(data.terminationDate).toISOString() : null,
        appealDecisionDate: data.appealDecisionDate ? new Date(data.appealDecisionDate).toISOString() : null,
        fineAmount: data.fineAmount ? parseFloat(data.fineAmount) : null,
        paymentType: data.paymentType || null,
        outcome: data.outcome || null,
      };
      return apiRequest("POST", "/api/admin-cases", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin-cases"] });
      toast({ title: "Успешно", description: "Административное дело создано" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать дело",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: AdminCaseFormData) => {
      const payload = {
        ...data,
        caseDate: data.caseDate ? new Date(data.caseDate).toISOString() : null,
        protocolDate: data.protocolDate ? new Date(data.protocolDate).toISOString() : null,
        offenderBirthDate: data.offenderBirthDate ? new Date(data.offenderBirthDate).toISOString() : null,
        resolutionDate: data.resolutionDate ? new Date(data.resolutionDate).toISOString() : null,
        terminationDate: data.terminationDate ? new Date(data.terminationDate).toISOString() : null,
        appealDecisionDate: data.appealDecisionDate ? new Date(data.appealDecisionDate).toISOString() : null,
        fineAmount: data.fineAmount ? parseFloat(data.fineAmount) : null,
        paymentType: data.paymentType || null,
        outcome: data.outcome || null,
      };
      return apiRequest("PUT", `/api/admin-cases/${editData.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin-cases"] });
      toast({ title: "Успешно", description: "Административное дело обновлено" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить дело",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AdminCaseFormData) => {
    if (editData) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-form-title">
            {editData ? "Редактирование административного дела" : "Добавление административного дела"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number">Номер дела *</Label>
              <Input
                id="number"
                {...form.register("number")}
                placeholder="АД-2026/001"
                data-testid="input-case-number"
              />
              {form.formState.errors.number && (
                <p className="text-sm text-destructive">{form.formState.errors.number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseDate">Дата дела *</Label>
              <Input
                id="caseDate"
                type="date"
                {...form.register("caseDate")}
                data-testid="input-case-date"
              />
              {form.formState.errors.caseDate && (
                <p className="text-sm text-destructive">{form.formState.errors.caseDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="article">Статья КоАП *</Label>
              <Select
                value={form.watch("article")}
                onValueChange={(value) => form.setValue("article", value)}
              >
                <SelectTrigger data-testid="select-article">
                  <SelectValue placeholder="Выберите статью" />
                </SelectTrigger>
                <SelectContent>
                  {KOAP_ARTICLES.map((article) => (
                    <SelectItem key={article.value} value={article.value}>
                      {article.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.article && (
                <p className="text-sm text-destructive">{form.formState.errors.article.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Регион *</Label>
              <Select
                value={form.watch("region")}
                onValueChange={(value) => {
                  form.setValue("region", value);
                  form.setValue("district", "");
                }}
                disabled={!isMchsUser}
              >
                <SelectTrigger data-testid="select-region">
                  <SelectValue placeholder="Выберите регион" />
                </SelectTrigger>
                <SelectContent>
                  {REGION_NAMES.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.region && (
                <p className="text-sm text-destructive">{form.formState.errors.region.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">Район</Label>
              <Select
                value={form.watch("district") || ""}
                onValueChange={(value) => form.setValue("district", value)}
                disabled={!isMchsUser && !isDchsUser}
              >
                <SelectTrigger data-testid="select-district">
                  <SelectValue placeholder="Выберите район" />
                </SelectTrigger>
                <SelectContent>
                  {availableDistricts.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value)}
              >
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Протокол</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="protocolNumber">Номер протокола</Label>
                <Input
                  id="protocolNumber"
                  {...form.register("protocolNumber")}
                  placeholder="ПР-2026/001"
                  data-testid="input-protocol-number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protocolDate">Дата протокола</Label>
                <Input
                  id="protocolDate"
                  type="date"
                  {...form.register("protocolDate")}
                  data-testid="input-protocol-date"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Нарушитель (физическое лицо)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offenderName">ФИО нарушителя</Label>
                <Input
                  id="offenderName"
                  {...form.register("offenderName")}
                  placeholder="Иванов Иван Иванович"
                  data-testid="input-offender-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offenderIin">ИИН нарушителя</Label>
                <Input
                  id="offenderIin"
                  {...form.register("offenderIin")}
                  placeholder="123456789012"
                  maxLength={12}
                  data-testid="input-offender-iin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offenderBirthDate">Дата рождения</Label>
                <Input
                  id="offenderBirthDate"
                  type="date"
                  {...form.register("offenderBirthDate")}
                  data-testid="input-offender-birthdate"
                />
              </div>
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label htmlFor="offenderContact">Контактные данные</Label>
                <Textarea
                  id="offenderContact"
                  {...form.register("offenderContact")}
                  placeholder="Телефон, адрес..."
                  rows={2}
                  data-testid="input-offender-contact"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Организация (юридическое лицо)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Наименование организации</Label>
                <Input
                  id="orgName"
                  {...form.register("orgName")}
                  placeholder='ТОО "Компания"'
                  data-testid="input-org-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgBin">БИН организации</Label>
                <Input
                  id="orgBin"
                  {...form.register("orgBin")}
                  placeholder="123456789012"
                  maxLength={12}
                  data-testid="input-org-bin"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Решение и взыскание</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inspectorName">Инспектор</Label>
                <Input
                  id="inspectorName"
                  {...form.register("inspectorName")}
                  placeholder="Петров П.П."
                  data-testid="input-inspector-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="penaltyType">Вид взыскания</Label>
                <Select
                  value={form.watch("penaltyType") || ""}
                  onValueChange={(value) => form.setValue("penaltyType", value)}
                >
                  <SelectTrigger data-testid="select-penalty-type">
                    <SelectValue placeholder="Выберите вид" />
                  </SelectTrigger>
                  <SelectContent>
                    {PENALTY_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="outcome">Исход дела</Label>
                <Select
                  value={form.watch("outcome") || ""}
                  onValueChange={(value) => form.setValue("outcome", value)}
                >
                  <SelectTrigger data-testid="select-outcome">
                    <SelectValue placeholder="Выберите исход" />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTCOME_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resolutionDate">Дата постановления</Label>
                <Input
                  id="resolutionDate"
                  type="date"
                  {...form.register("resolutionDate")}
                  data-testid="input-resolution-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fineAmount">Сумма штрафа (тг)</Label>
                <Input
                  id="fineAmount"
                  type="number"
                  {...form.register("fineAmount")}
                  placeholder="100000"
                  data-testid="input-fine-amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentType">Тип оплаты</Label>
                <Select
                  value={form.watch("paymentType") || ""}
                  onValueChange={(value) => form.setValue("paymentType", value)}
                >
                  <SelectTrigger data-testid="select-payment-type">
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="finePaidVoluntary"
                  checked={form.watch("finePaidVoluntary")}
                  onCheckedChange={(checked) => form.setValue("finePaidVoluntary", !!checked)}
                  data-testid="checkbox-paid-voluntary"
                />
                <Label htmlFor="finePaidVoluntary" className="text-sm">Оплачено добровольно</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="finePaidReduced"
                  checked={form.watch("finePaidReduced")}
                  onCheckedChange={(checked) => form.setValue("finePaidReduced", !!checked)}
                  data-testid="checkbox-paid-reduced"
                />
                <Label htmlFor="finePaidReduced" className="text-sm">Оплачено сокращённо</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="finePaidForced"
                  checked={form.watch("finePaidForced")}
                  onCheckedChange={(checked) => form.setValue("finePaidForced", !!checked)}
                  data-testid="checkbox-paid-forced"
                />
                <Label htmlFor="finePaidForced" className="text-sm">Оплачено принудительно</Label>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Прекращение дела</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="terminationReason">Причина прекращения</Label>
                <Textarea
                  id="terminationReason"
                  {...form.register("terminationReason")}
                  placeholder="Основание для прекращения..."
                  rows={2}
                  data-testid="input-termination-reason"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terminationDate">Дата прекращения</Label>
                <Input
                  id="terminationDate"
                  type="date"
                  {...form.register("terminationDate")}
                  data-testid="input-termination-date"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Обжалование</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appealResult">Результат обжалования</Label>
                <Input
                  id="appealResult"
                  {...form.register("appealResult")}
                  placeholder="Результат..."
                  data-testid="input-appeal-result"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appealDecisionDate">Дата решения по жалобе</Label>
                <Input
                  id="appealDecisionDate"
                  type="date"
                  {...form.register("appealDecisionDate")}
                  data-testid="input-appeal-date"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Передача дела</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transferTo">Передано в</Label>
                <Input
                  id="transferTo"
                  {...form.register("transferTo")}
                  placeholder="Орган / суд"
                  data-testid="input-transfer-to"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transferType">Тип передачи</Label>
                <Input
                  id="transferType"
                  {...form.register("transferType")}
                  placeholder="По подведомственности"
                  data-testid="input-transfer-type"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="enforcementSent"
                  checked={form.watch("enforcementSent")}
                  onCheckedChange={(checked) => form.setValue("enforcementSent", !!checked)}
                  data-testid="checkbox-enforcement-sent"
                />
                <Label htmlFor="enforcementSent" className="text-sm">Направлено на исполнение</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              data-testid="button-cancel"
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-submit">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editData ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
