import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertIncidentSchema, insertIncidentVictimSchema, type Incident } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { REGION_NAMES, getCitiesByRegion, getDistrictsByRegion, FIRE_CAUSES, OBJECT_TYPES as KZ_OBJECT_TYPES } from "@/data/kazakhstan-data";
import { Plus, Trash2 } from "lucide-react";

// Updated schema to include victims array
const ospIncidentSchema = insertIncidentSchema
  .omit({
    orgUnitId: true,
    createdBy: true,
    packageId: true,
  })
  .extend({
    dateTime: z.string().min(1, "Дата и время обязательны"),
    locality: z.string().min(1, "Местность обязательна"),
    incidentType: z.string().min(1, "Тип события обязателен"),
    address: z.string().min(1, "Адрес обязателен"),
    region: z.string().optional(),
    city: z.string().optional(),
    damage: z.union([z.number(), z.string()]).optional(),
    savedProperty: z.union([z.number(), z.string()]).optional(),
    steppeArea: z.union([z.number(), z.string()]).optional(),
    steppeDamage: z.union([z.number(), z.string()]).optional(),
    steppeExtinguishedArea: z.union([z.number(), z.string()]).optional(),
    steppeExtinguishedDamage: z.union([z.number(), z.string()]).optional(),
    steppePeopleTotal: z.union([z.number(), z.string()]).optional(),
    steppePeopleDead: z.union([z.number(), z.string()]).optional(),
    steppePeopleInjured: z.union([z.number(), z.string()]).optional(),
    steppeAnimalsTotal: z.union([z.number(), z.string()]).optional(),
    steppeAnimalsDead: z.union([z.number(), z.string()]).optional(),
    steppeAnimalsInjured: z.union([z.number(), z.string()]).optional(),
    steppeExtinguishedTotal: z.union([z.number(), z.string()]).optional(),
    steppeGarrisonPeople: z.union([z.number(), z.string()]).optional(),
    steppeGarrisonUnits: z.union([z.number(), z.string()]).optional(),
    steppeMchsPeople: z.union([z.number(), z.string()]).optional(),
    steppeMchsUnits: z.union([z.number(), z.string()]).optional(),
    // New fields
    victims: z.array(insertIncidentVictimSchema.omit({ id: true, incidentId: true, createdAt: true })).optional(),
    buildingDetails: z.record(z.any()).optional(),
    livestockLost: z.record(z.any()).optional(),
    destroyedItems: z.record(z.any()).optional(),
  });

type OSPIncidentFormData = z.infer<typeof ospIncidentSchema>;

const LOCALITIES = [
  { value: "cities", label: "Города" },
  { value: "rural", label: "Сельская местность" },
];

const INCIDENT_TYPES = [
  { value: "fire", label: "Пожар" },
  { value: "nonfire", label: "Случай горения (не пожар)" },
  { value: "steppe_fire", label: "Степной пожар" },
  { value: "steppe_smolder", label: "Степное загорание" },
  { value: "co_nofire", label: "Отравление угарным газом без пожара" },
];

const CAUSES = FIRE_CAUSES.map(cause => ({
  code: cause.code,
  label: cause.name
}));

const OBJECT_TYPES = KZ_OBJECT_TYPES.map(type => ({
  code: type.code,
  label: type.name
}));

// Victim Enums
const GENDERS = [
  { value: "male", label: "Мужской" },
  { value: "female", label: "Женский" },
];

const AGE_GROUPS = [
  { value: "child", label: "Ребенок (до 18)" },
  { value: "adult", label: "Взрослый (18-60)" },
  { value: "pensioner", label: "Пенсионер (>60)" },
];

const SOCIAL_STATUSES = [
  { value: "worker", label: "Рабочий" },
  { value: "employee", label: "Служащий" },
  { value: "entrepreneur", label: "Предприниматель" },
  { value: "unemployed", label: "Временно неработающий" },
  { value: "pensioner", label: "Пенсионер" },
  { value: "child_preschool", label: "Ребенок (дошкольник)" },
  { value: "student_school", label: "Учащийся (школа)" },
  { value: "student_uni", label: "Студент" },
  { value: "homeless", label: "БОМЖ" },
  { value: "disabled", label: "Лицо с инвалидностью" },
];

const VICTIM_STATUSES = [
  { value: "dead", label: "Погиб" },
  { value: "injured", label: "Травмирован" },
  { value: "saved", label: "Спасен" },
];

const CONDITIONS = [
  { value: "alcohol", label: "Алкогольное опьянение" },
  { value: "sleep", label: "Состояние сна" },
  { value: "disability", label: "Инвалидность" },
  { value: "unsupervised_child", label: "Оставленные без присмотра дети" },
  { value: "panic", label: "Паника" },
  { value: "other", label: "Другое" },
];

const DEATH_CAUSES = [
  { value: "high_temp", label: "Высокая температура" },
  { value: "combustion_products", label: "Продукты горения" },
  { value: "collapse", label: "Обрушение" },
  { value: "psych", label: "Психологические факторы" },
  { value: "gas_explosion", label: "Взрыв газа" },
  { value: "other", label: "Другое" },
];

interface IncidentFormOSPProps {
  onSuccess?: () => void;
  incidentId?: string; // If provided, mode is "edit"
}

export default function IncidentFormOSP({ onSuccess, incidentId }: IncidentFormOSPProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  
  const [selectedIncidentType, setSelectedIncidentType] = useState("fire");
  const [selectedRegion, setSelectedRegion] = useState((user as any)?.region || "");
  const isSteppeIncident = ["steppe_fire", "steppe_smolder"].includes(selectedIncidentType);
  const userRegion = (user as any)?.region || "";
  const userDistrict = (user as any)?.district || "";
  const isDistrictUser = (user as any)?.role === "DISTRICT";
  const isMchsUser = (user as any)?.role === "MCHS";

  const isEditMode = !!incidentId;

  // Fetch incident data if editing
  const { data: initialData, isLoading: isLoadingData } = useQuery<Incident & { victims?: any[] }>({
    queryKey: [`/api/incidents/${incidentId}`],
    enabled: isEditMode,
  });

  const form = useForm<OSPIncidentFormData>({
    resolver: zodResolver(ospIncidentSchema),
    mode: "onChange",
    defaultValues: {
      dateTime: new Date().toISOString().slice(0, 16),
      locality: "cities",
      incidentType: "fire",
      address: "",
      region: (user as any)?.region || "",
      city: (user as any)?.district || "",
      description: "",
      victims: [],
      deathsTotal: 0,
      injuredTotal: 0,
      cause: "",
      causeCode: "",
      objectType: "",
      objectCode: "",
      steppeArea: 0,
      steppeDamage: 0,
      steppePeopleTotal: 0,
      steppePeopleDead: 0,
      steppePeopleInjured: 0,
      steppeAnimalsTotal: 0,
      steppeAnimalsDead: 0,
      steppeAnimalsInjured: 0,
      steppeExtinguishedTotal: 0,
      steppeExtinguishedArea: 0,
      steppeExtinguishedDamage: 0,
      steppeGarrisonPeople: 0,
      steppeGarrisonUnits: 0,
      steppeMchsPeople: 0,
      steppeMchsUnits: 0,
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (initialData) {
      // Format date for datetime-local
      const dateVal = initialData.dateTime ? new Date(initialData.dateTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16);

      const formData = {
        ...initialData,
        dateTime: dateVal,
        damage: initialData.damage ? Number(initialData.damage) : 0,
        savedProperty: initialData.savedProperty ? Number(initialData.savedProperty) : 0,
        // Steppe fields
        steppeArea: initialData.steppeArea ? Number(initialData.steppeArea) : 0,
        steppeDamage: initialData.steppeDamage ? Number(initialData.steppeDamage) : 0,
        steppeExtinguishedArea: initialData.steppeExtinguishedArea ? Number(initialData.steppeExtinguishedArea) : 0,
        steppeExtinguishedDamage: initialData.steppeExtinguishedDamage ? Number(initialData.steppeExtinguishedDamage) : 0,
        // ... map other numeric fields if needed, or rely on form default handling of strings/numbers if compatible
        victims: initialData.victims || [],
      };

      form.reset(formData as any); // Cast to any because Zod type might strict check vs API response
      setSelectedIncidentType(initialData.incidentType || "fire");
      if (initialData.region) setSelectedRegion(initialData.region);
    }
  }, [initialData, form]);


  const { fields: victimFields, append: appendVictim, remove: removeVictim } = useFieldArray({
    control: form.control,
    name: "victims",
  });

  // Calculate totals automatically when victims change
  useEffect(() => {
    const victims = form.getValues("victims") || [];
    const deaths = victims.filter(v => v.status === "dead").length;
    const injured = victims.filter(v => v.status === "injured").length;
    const saved = victims.filter(v => v.status === "saved").length;

    // Also count children
    const deathsChildren = victims.filter(v => v.status === "dead" && (v.ageGroup === "child" || (v.age && v.age < 18))).length;
    const injuredChildren = victims.filter(v => v.status === "injured" && (v.ageGroup === "child" || (v.age && v.age < 18))).length;

    form.setValue("deathsTotal", deaths);
    form.setValue("injuredTotal", injured);
    form.setValue("savedPeopleTotal", saved);
    form.setValue("deathsChildren", deathsChildren);
    form.setValue("injuredChildren", injuredChildren);

  }, [form.watch("victims")]);


  useEffect(() => {
    // Only set default region for new records
    if (!isEditMode && user && (user as any).region) {
      setSelectedRegion((user as any).region);
      form.setValue("region", (user as any).region);
      if ((user as any).district) {
        form.setValue("city", (user as any).district);
      }
    }
    if (!isEditMode && user && (user as any).role === "DISTRICT" && (user as any).district) {
      form.setValue("city", (user as any).district);
    }
  }, [user, form, isEditMode]);

  useEffect(() => {
    if (!isSteppeIncident && activeTab === "steppe") {
      setActiveTab("general");
    }
  }, [activeTab, isSteppeIncident]);

  const normalizeCurrency = (value?: string | number) => {
    if (value === undefined || value === null || value === "") return "0";
    const numericValue = typeof value === "number" ? value : parseFloat(value.toString().replace(",", "."));
    return Number.isNaN(numericValue) ? "0" : numericValue.toString();
  };

  const mutation = useMutation({
    mutationFn: async (data: OSPIncidentFormData) => {
      const formattedData = {
        ...data,
        dateTime: new Date(data.dateTime).toISOString(),
        damage: normalizeCurrency(data.damage),
        savedProperty: normalizeCurrency(data.savedProperty),
        steppeArea: normalizeCurrency(data.steppeArea),
        steppeDamage: normalizeCurrency(data.steppeDamage),
        steppeExtinguishedArea: normalizeCurrency(data.steppeExtinguishedArea),
        steppeExtinguishedDamage: normalizeCurrency(data.steppeExtinguishedDamage),
      };
      
      console.log("🔄 Отправляем данные на сервер:", formattedData);
      
      if (isEditMode && incidentId) {
        const response = await apiRequest("PUT", `/api/incidents/${incidentId}`, formattedData);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/incidents", formattedData);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: isEditMode ? "✅ Происшествие обновлено" : "✅ Происшествие добавлено",
        description: "Данные успешно сохранены в журнал МЧС",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/incidents/search"] });
      if (isEditMode) {
         queryClient.invalidateQueries({ queryKey: [`/api/incidents/${incidentId}`] });
      } else {
         form.reset(); // Only reset on create
         setSelectedIncidentType("fire");
      }

      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось сохранить инцидент",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OSPIncidentFormData) => {
    if (!data.city && selectedRegion && (user as any)?.district) {
      data.city = (user as any).district;
    }
    mutation.mutate(data);
  };

  const addVictim = () => {
    appendVictim({
      gender: "male",
      ageGroup: "adult",
      status: "injured",
      victimType: selectedIncidentType === "co_nofire" ? "co_poisoning" : "fire",
      fullName: "",
      age: 0,
      socialStatus: "worker",
      deathCause: "high_temp",
      deathPlace: "on_site",
      condition: "other",
    });
  };

  if (isEditMode && isLoadingData) {
    return <div className="p-8 text-center">Загрузка данных...</div>;
  }

  return (
    <Card className="bg-card border border-border">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4">
          {isEditMode ? "Редактирование происшествия" : "Форма 1-ОСП (Расширенная)"}
        </h3>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={`grid w-full ${isSteppeIncident ? "grid-cols-4" : "grid-cols-3"}`}>
                <TabsTrigger value="general">Общие сведения</TabsTrigger>
                <TabsTrigger value="victims">Пострадавшие ({victimFields.length})</TabsTrigger>
                <TabsTrigger value="details">Детали объекта</TabsTrigger>
                {isSteppeIncident && <TabsTrigger value="steppe">Степной пожар</TabsTrigger>}
              </TabsList>

              <TabsContent value="general" className="space-y-4 pt-4">
                {/* Basic Info Fields (Same as before) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="dateTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Дата и время *</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="locality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Местность *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {LOCALITIES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="incidentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Тип события *</FormLabel>
                          <Select onValueChange={(val) => {
                              field.onChange(val);
                              setSelectedIncidentType(val);
                          }} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {INCIDENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Область</FormLabel>
                          <Select
                            disabled={!isMchsUser}
                            onValueChange={(val) => {
                                field.onChange(val);
                                setSelectedRegion(val);
                                if (isDistrictUser && userDistrict) {
                                  form.setValue("city", userDistrict);
                                }
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Область" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                               {(isMchsUser ? REGION_NAMES : userRegion ? [userRegion] : REGION_NAMES).map((r) => (
                                 <SelectItem key={r} value={r}>{r}</SelectItem>
                               ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Город/Район</FormLabel>
                          <Select
                             disabled={!selectedRegion || isDistrictUser}
                             onValueChange={field.onChange}
                             value={field.value}
                          >
                            <FormControl>
                               <SelectTrigger><SelectValue placeholder="Город/Район" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                               {selectedRegion &&
                                 (isDistrictUser && userDistrict
                                   ? [userDistrict]
                                   : Array.from(
                                       new Set([
                                         ...getCitiesByRegion(selectedRegion).map((c) => c.name),
                                         ...getDistrictsByRegion(selectedRegion),
                                       ])
                                     )
                                 ).map((place) => (
                                   <SelectItem key={place} value={place}>
                                     {place}
                                   </SelectItem>
                                 ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Адрес *</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 {selectedIncidentType === "fire" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="causeCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Причина</FormLabel>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    const selected = CAUSES.find((cause) => cause.code === value);
                                    form.setValue("cause", selected?.label || "");
                                  }}
                                  value={field.value ?? ""}
                                >
                                    <FormControl><SelectTrigger><SelectValue placeholder="Причина" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {CAUSES.map(c => <SelectItem key={c.code} value={c.code}>{c.code} - {c.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="objectCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Объект</FormLabel>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    const selected = OBJECT_TYPES.find((type) => type.code === value);
                                    form.setValue("objectType", selected?.label || "");
                                  }}
                                  value={field.value ?? ""}
                                >
                                    <FormControl><SelectTrigger><SelectValue placeholder="Объект" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {OBJECT_TYPES.map(o => <SelectItem key={o.code} value={o.code}>{o.code} - {o.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                      />
                  </div>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="damage"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ущерб (тыс. тг)</FormLabel>
                                <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="savedProperty"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Спасено (тыс. тг)</FormLabel>
                                <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                            </FormItem>
                        )}
                    />
                 </div>
              </TabsContent>

              <TabsContent value="victims" className="space-y-4 pt-4">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Список пострадавших (Формы 5 и 7)</h4>
                    <Button type="button" onClick={addVictim} variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" /> Добавить человека
                    </Button>
                </div>

                {victimFields.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
                        Нет добавленных пострадавших. Нажмите "Добавить человека", если есть погибшие, травмированные или спасенные.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {victimFields.map((field, index) => (
                            <Card key={field.id} className="relative">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-2 top-2 text-destructive hover:bg-destructive/10"
                                    onClick={() => removeVictim(index)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name={`victims.${index}.status`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Статус</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {VICTIM_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`victims.${index}.ageGroup`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Возрастная группа</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {AGE_GROUPS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name={`victims.${index}.gender`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Пол</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {GENDERS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`victims.${index}.socialStatus`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Соц. положение</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {SOCIAL_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`victims.${index}.condition`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Состояние/Условие</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                     {form.watch(`victims.${index}.status`) === 'dead' && (
                                         <FormField
                                            control={form.control}
                                            name={`victims.${index}.deathCause`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Причина смерти</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            {DEATH_CAUSES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                     )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
              </TabsContent>

              <TabsContent value="details" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="floor"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Этаж пожара</FormLabel>
                                <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="totalFloors"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Этажность здания</FormLabel>
                                <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                            </FormItem>
                        )}
                    />
                  </div>
                  {/* Future: Add Livestock and Destroyed Items UI here */}
                  <div className="text-sm text-muted-foreground mt-4">
                    * Дополнительные поля для скота и строений будут добавлены в следующем обновлении.
                  </div>
              </TabsContent>

              {isSteppeIncident && (
                <TabsContent value="steppe" className="space-y-6 pt-4">
                  <div>
                    <h4 className="text-base font-semibold text-foreground mb-2">Основные показатели</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="steppeArea"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Площадь, пройденная огнем (га)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="steppeDamage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ущерб (тыс. тг)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-semibold text-foreground mb-2">Пострадавшие люди</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="steppePeopleTotal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Всего</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="steppePeopleDead"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Погибло</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="steppePeopleInjured"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Травмировано</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-semibold text-foreground mb-2">Пострадавшие животные (голов)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="steppeAnimalsTotal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Всего</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="steppeAnimalsDead"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Погибло</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="steppeAnimalsInjured"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Травмировано</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-semibold text-foreground mb-2">Ликвидация</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="steppeExtinguishedTotal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ликвидировано (кол-во)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="steppeExtinguishedArea"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ликвидировано (площадь, га)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="steppeExtinguishedDamage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ликвидировано (ущерб, тыс. тг)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-semibold text-foreground mb-2">Силы и средства</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="steppeGarrisonPeople"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Гарнизон (людей)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="steppeGarrisonUnits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Гарнизон (техника)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="steppeMchsPeople"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>МЧС РК (людей)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="steppeMchsUnits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>МЧС РК (техника)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>

            <div className="flex gap-3 pt-4 border-t border-border mt-6">
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {mutation.isPending ? "Сохранение..." : "Сохранить в журнал"}
              </Button>
              <Button type="button" variant="outline" onClick={() => onSuccess?.()}>
                Отмена
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
