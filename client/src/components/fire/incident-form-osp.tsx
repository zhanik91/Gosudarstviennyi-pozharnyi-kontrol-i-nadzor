import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertIncidentSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { REGION_NAMES, getCitiesByRegion, getDistrictsByRegion, FIRE_CAUSES, OBJECT_TYPES as KZ_OBJECT_TYPES } from "@/data/kazakhstan-data";

// Схема формы согласно 1-ОСП МЧС РК (Приказ № 928 от 16.11.2015)
const ospIncidentSchema = insertIncidentSchema.extend({
  dateTime: z.string().min(1, "Дата и время обязательны"),
  locality: z.string().min(1, "Местность обязательна"),
  incidentType: z.string().min(1, "Тип события обязателен"),
  address: z.string().min(1, "Адрес обязателен"),
  region: z.string().optional(),
  city: z.string().optional(),
});

type OSPIncidentFormData = z.infer<typeof ospIncidentSchema>;



// Классификаторы согласно официальному документу МЧС РК
const LOCALITIES = [
  { value: "cities", label: "Города" },
  { value: "rural", label: "Сельская местность" },
];

const INCIDENT_TYPES = [
  { value: "fire", label: "Пожар" },
  { value: "nonfire", label: "Случай горения (не пожар)" },
  { value: "steppe_fire", label: "Степной пожар" },
  { value: "co_nofire", label: "Отравление угарным газом без пожара" },
];

// Используем данные из Kazakhstan data согласно приказу МЧС РК
const CAUSES = FIRE_CAUSES.map(cause => ({
  code: cause.code,
  label: cause.name
}));

const OBJECT_TYPES = KZ_OBJECT_TYPES.map(type => ({
  code: type.code,
  label: type.name
}));

interface IncidentFormOSPProps {
  onSuccess?: () => void;
}

export default function IncidentFormOSP({ onSuccess }: IncidentFormOSPProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Состояния для условного отображения полей
  const [selectedIncidentType, setSelectedIncidentType] = useState("fire");
  const [selectedRegion, setSelectedRegion] = useState((user as any)?.region || "");
  const [showDeathDetails, setShowDeathDetails] = useState(false);
  const [showInjuryDetails, setShowInjuryDetails] = useState(false);
  const [showCOFields, setShowCOFields] = useState(false);
  const [showDamageFields, setShowDamageFields] = useState(false);

  const form = useForm<OSPIncidentFormData>({
    resolver: zodResolver(ospIncidentSchema),
    mode: "onChange", // Валидация в реальном времени
    defaultValues: {
      dateTime: new Date().toISOString().slice(0, 16),
      locality: "cities",
      incidentType: "fire",
      address: "",
      region: (user as any)?.region || "",
      city: (user as any)?.district || "",
      description: "",
    },
  });

  // Обновляем selectedRegion и поля формы когда загружается пользователь
  useEffect(() => {
    if (user && (user as any).region) {
      setSelectedRegion((user as any).region);
      form.setValue("region", (user as any).region);
      if ((user as any).district) {
        form.setValue("city", (user as any).district);
      }
    }
  }, [user, form]);

  const createIncidentMutation = useMutation({
    mutationFn: async (data: OSPIncidentFormData) => {
      const formattedData = {
        ...data,
        dateTime: new Date(data.dateTime).toISOString(),
        damage: data.damage ? parseFloat(data.damage) : 0,
        savedProperty: data.savedProperty ? parseFloat(data.savedProperty) : 0,
      };
      
      console.log("🔄 Отправляем данные на сервер:", formattedData);
      
      try {
        const response = await apiRequest("POST", "/api/incidents", formattedData);
        console.log("✅ Ответ сервера получен:", response.status);
        return response.json();
      } catch (error) {
        console.error("❌ Ошибка при отправке:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "✅ Происшествие добавлено",
        description: "Данные успешно сохранены в журнал МЧС",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      
      // Сброс формы с сохранением региональных данных
      form.reset({
        dateTime: new Date().toISOString().slice(0, 16),
        locality: "cities",
        incidentType: "fire",
        address: "",
        region: (user as any)?.region || "",
        city: (user as any)?.district || "",
        description: "",
      });
      
      // Сброс состояний
      setSelectedIncidentType("fire");
      setSelectedRegion((user as any)?.region || "");
      setShowDeathDetails(false);
      setShowInjuryDetails(false);
      setShowCOFields(false);
      setShowDamageFields(false);
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить инцидент",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OSPIncidentFormData) => {
    console.log("📝 Отправка формы:", data);
    createIncidentMutation.mutate(data);
  };

  const onClear = () => {
    form.reset();
    setSelectedIncidentType("fire");
    setSelectedRegion("");
    setShowDeathDetails(false);
    setShowInjuryDetails(false);
    setShowCOFields(false);
    setShowDamageFields(false);
  };

  // Функции для обработки изменений полей
  const handleIncidentTypeChange = (value: string) => {
    setSelectedIncidentType(value);
    setShowCOFields(value === "co_nofire");
    form.setValue("incidentType", value);
  };

  const handleDeathsChange = (value: number) => {
    setShowDeathDetails(value > 0);
    form.setValue("deathsTotal", value);
  };

  const handleInjuriesChange = (value: number) => {
    setShowInjuryDetails(value > 0);
    form.setValue("injuredTotal", value);
  };

  const handleDamageChange = (value: string) => {
    const damageAmount = parseFloat(value) || 0;
    setShowDamageFields(damageAmount > 0);
    form.setValue("damage", value);
  };

  return (
    <Card className="bg-card border border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              Форма 1-ОСП: Общие сведения о пожарах и гибели людей
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Согласно приказу МЧС РК от 16.11.2015 № 928
            </p>
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Основная информация */}
            <div className="bg-secondary/50 rounded-lg p-4 border border-border">
              <h4 className="text-lg font-medium text-foreground mb-4 flex items-center">
                📋 Основные сведения
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="dateTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дата и время происшествия *</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field}
                          data-testid="input-datetime"
                        />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-locality">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LOCALITIES.map((locality) => (
                            <SelectItem key={locality.value} value={locality.value}>
                              {locality.label}
                            </SelectItem>
                          ))}
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
                      <Select onValueChange={handleIncidentTypeChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-incident-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INCIDENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Географическое расположение */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Область / Регион</FormLabel>
                      <Select 
                        disabled={(user as any)?.role !== 'admin'}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedRegion(value);
                          form.setValue("city", "");
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-region">
                            <SelectValue placeholder="Выберите область" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {REGION_NAMES.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(user as any)?.role !== 'admin' && (
                        <p className="text-xs text-muted-foreground">
                          Область автоматически определена по вашей учетной записи
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Город / Район</FormLabel>
                      <Select 
                        disabled={(user as any)?.role !== 'admin' || !selectedRegion}
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-city">
                            <SelectValue placeholder={selectedRegion ? "Выберите город/район" : "Сначала выберите область"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedRegion && getCitiesByRegion(selectedRegion).map((city) => (
                            <SelectItem key={city.name} value={city.name}>
                              {city.name}
                            </SelectItem>
                          ))}
                          {selectedRegion && getDistrictsByRegion(selectedRegion).map((district: string) => (
                            <SelectItem key={district} value={district}>
                              {district} район
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Адрес места происшествия *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="Укажите полный адрес с указанием населенного пункта"
                          data-testid="input-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Краткое описание происшествия</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          value={field.value || ""}
                          placeholder="Опишите обстоятельства происшествия"
                          rows={3}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Классификация - только для пожаров */}
            {selectedIncidentType === "fire" && (
              <div className="bg-card dark:bg-card rounded-lg p-4 border border-border">
                <h4 className="text-lg font-medium text-foreground mb-4 flex items-center">
                  🔥 Классификация пожара
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="causeCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Причина пожара</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          const cause = CAUSES.find(c => c.code === value);
                          form.setValue("cause", cause?.label || "");
                        }}>
                          <FormControl>
                            <SelectTrigger data-testid="select-cause">
                              <SelectValue placeholder="Выберите причину" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CAUSES.map((cause) => (
                              <SelectItem key={cause.code} value={cause.code}>
                                {cause.code} - {cause.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="objectCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Объект пожара</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          const obj = OBJECT_TYPES.find(o => o.code === value);
                          form.setValue("objectType", obj?.label || "");
                        }}>
                          <FormControl>
                            <SelectTrigger data-testid="select-object">
                              <SelectValue placeholder="Выберите объект" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {OBJECT_TYPES.map((obj) => (
                              <SelectItem key={obj.code} value={obj.code}>
                                {obj.code} - {obj.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Пострадавшие люди */}
            <div className="bg-card dark:bg-card rounded-lg p-4 border border-border">
              <h4 className="text-lg font-medium text-foreground mb-4 flex items-center">
                👥 Сведения о пострадавших людях
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="deathsTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Погибло людей (всего)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          value={field.value || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            field.onChange(val);
                            handleDeathsChange(val);
                          }}
                          data-testid="input-deaths-total"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="injuredTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Травмировано людей (всего)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          value={field.value || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            field.onChange(val);
                            handleInjuriesChange(val);
                          }}
                          data-testid="input-injured-total"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="savedPeopleTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Спасено людей (всего)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          value={field.value || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            field.onChange(val);
                          }}
                          data-testid="input-saved-total"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Детализация по погибшим - показывается только при наличии погибших */}
              {showDeathDetails && (
                <div className="mt-4 p-3 border border-border rounded bg-card dark:bg-card">
                  <h5 className="font-medium text-foreground mb-3">
                    ⚠️ Детализация по погибшим
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="deathsChildren"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>из них детей</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              value={field.value || 0}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-deaths-children"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deathsDrunk"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>из них в нетрезвом состоянии</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              value={field.value || 0}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-deaths-drunk"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Детализация по травмированным - показывается только при наличии травмированных */}
              {showInjuryDetails && (
                <div className="mt-4 p-3 border border-border rounded bg-card dark:bg-card">
                  <h5 className="font-medium text-foreground mb-3">
                    🏥 Детализация по травмированным
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="injuredChildren"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>из них детей</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              value={field.value || 0}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-injured-children"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="savedPeopleChildren"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>из спасенных детей</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              value={field.value || 0}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-saved-children"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Поля для отравления угарным газом - показываются только для типа "co_nofire" */}
            {showCOFields && (
              <div className="bg-card dark:bg-card rounded-lg p-4 border border-border">
                <h4 className="text-lg font-medium text-foreground mb-4 flex items-center">
                  ☠️ Отравление угарным газом (без пожара)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deathsCOTotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Погибло от угарного газа</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-deaths-co"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deathsCOChildren"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>из них детей</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-deaths-co-children"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="injuredCOTotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Травмировано от угарного газа</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-injured-co"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="injuredCOChildren"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>из них детей</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-injured-co-children"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Материальный ущерб - показывается только для пожаров */}
            {selectedIncidentType === "fire" && (
              <div className="bg-card dark:bg-card rounded-lg p-4 border border-border">
                <h4 className="text-lg font-medium text-foreground mb-4 flex items-center">
                  💰 Материальный ущерб и спасенные ценности
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="damage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Сумма ущерба (тыс. тенге)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.1"
                            min="0"
                            value={field.value || ""}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              handleDamageChange(e.target.value);
                            }}
                            data-testid="input-damage"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="savedProperty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Спасено материальных ценностей (тыс. тенге)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.1"
                            min="0"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            data-testid="input-saved-property"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Кнопки действий */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button 
                type="submit" 
                disabled={createIncidentMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                data-testid="button-submit"
                onClick={(e) => {
                  console.log("🔘 Кнопка отправки нажата");
                }}
              >
                {createIncidentMutation.isPending ? "Добавление..." : "🔥 Добавить в журнал"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClear}
                className="px-6"
                data-testid="button-clear"
              >
                🗑️ Очистить
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}