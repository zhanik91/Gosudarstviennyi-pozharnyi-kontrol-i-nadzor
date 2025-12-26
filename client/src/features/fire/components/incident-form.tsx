import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertIncidentSchema } from "@shared/schema";
import { z } from "zod";

const incidentFormSchema = insertIncidentSchema.extend({
  dateTime: z.string().min(1, "Дата и время обязательны"),
  locality: z.string().min(1, "Местность обязательна"),
  incidentType: z.string().min(1, "Тип события обязателен"),
});

type IncidentFormData = z.infer<typeof incidentFormSchema>;

export default function IncidentForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<IncidentFormData>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
      dateTime: new Date().toISOString().slice(0, 16),
      locality: "city_pgt",
      incidentType: "fire",
      damage: "0",
      deathsTotal: 0,
      deathsChildren: 0,
      injuredTotal: 0,
      injuredChildren: 0,
      savedPeople: 0,
      savedProperty: "0",
    },
  });

  const createIncidentMutation = useMutation({
    mutationFn: async (data: IncidentFormData) => {
      const formattedData = {
        ...data,
        dateTime: new Date(data.dateTime).toISOString(),
        damage: data.damage ? parseFloat(data.damage) : null,
        savedProperty: data.savedProperty ? parseFloat(data.savedProperty) : null,
      };
      
      await apiRequest("POST", "/api/incidents", formattedData);
    },
    onSuccess: () => {
      toast({
        title: "Успех",
        description: "Инцидент успешно создан",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать инцидент",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: IncidentFormData) => {
    createIncidentMutation.mutate(data);
  };

  const onClear = () => {
    form.reset();
  };

  return (
    <Card className="bg-card border border-border">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Добавить инцидент</h3>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="dateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата/время</FormLabel>
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
                    <FormLabel>Местность</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-locality">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="city_pgt">Города/ПГТ</SelectItem>
                        <SelectItem value="rural">Сельская местность</SelectItem>
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
                    <FormLabel>Тип события</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-incident-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fire">Пожар</SelectItem>
                        <SelectItem value="nonfire">Случай горения (не пожар)</SelectItem>
                        <SelectItem value="steppe_fire">Степной пожар</SelectItem>
                        <SelectItem value="steppe_smolder">Степное загорание</SelectItem>
                        <SelectItem value="co_nofire">Отравление CO без пожара (ЖС)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isOVSR"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ОВСР</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "true" ? true : value === "false" ? false : undefined)}>
                      <FormControl>
                        <SelectTrigger data-testid="select-ovsr">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="undefined">—</SelectItem>
                        <SelectItem value="true">Да</SelectItem>
                        <SelectItem value="false">Нет</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fire Details Section */}
            <div className="bg-secondary rounded-lg p-4">
              <h4 className="text-lg font-medium text-foreground mb-4">Данные о пожаре</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="damage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ущерб, тыс. тг</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          {...field}
                          value={field.value || ""}
                          data-testid="input-damage"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deathsTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Погибло всего</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-deaths-total"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deathsChildren"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дети</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value || ""}
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
                  name="savedPeople"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Спасено людей</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-saved-people"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={createIncidentMutation.isPending}
                data-testid="button-save-incident"
              >
                {createIncidentMutation.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={onClear}
                data-testid="button-clear-form"
              >
                Очистить форму
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
