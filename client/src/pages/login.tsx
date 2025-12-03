import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Lock, User } from "lucide-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

const loginSchema = z.object({
  username: z.string().min(1, "Логин обязателен"),
  password: z.string().min(1, "Пароль обязателен")
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/login", data);
      const user = await response.json();

      queryClient.setQueryData(["/api/user"], user);

      toast({
        title: "Успешная авторизация",
        description: `Добро пожаловать, ${user.fullName}!`
      });

      navigate("/", { replace: true });
    } catch (error: any) {
      toast({
        title: "Ошибка авторизации",
        description: error.message || "Неверный логин или пароль",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground portal-bg">
      <div className="container mx-auto px-6 py-8">
        <div className="flex min-h-screen items-center justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
            {/* Left side - Login Form */}
            <div className="flex items-center justify-center">
              <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/20 rounded-full">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">Вход в систему</CardTitle>
                  <CardDescription>
                    Авторизация в портале МЧС РК
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Логин</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  {...field} 
                                  placeholder="Введите логин"
                                  className="pl-10"
                                  disabled={isLoading}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Пароль</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  {...field} 
                                  type="password"
                                  placeholder="Введите пароль"
                                  className="pl-10"
                                  disabled={isLoading}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoading}
                      >
                        {isLoading ? "Вход..." : "Войти"}
                      </Button>
                    </form>
                  </Form>
                  
                  {/* Тестовые учетные записи */}
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Тестовые учетные записи:</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div><strong>Администратор:</strong> mchs_admin / uQ8i5gAe</div>
                      <div><strong>МЧС РК:</strong> mchs_rk / hj9fWbvu</div>
                      <div><strong>Алматы (город):</strong> almaty_city_mchs / Al2025mcs</div>
                      <div><strong>Нур-Султан:</strong> astana_mchs / As2025mcs</div>
                      <div><strong>Шымкент:</strong> shymkent_mchs / Sh2025mcs</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right side - Info Panel */}
            <div className="flex items-center justify-center">
              <div className="max-w-md space-y-6">
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-4">
                    Государственный пожарный контроль
                  </h1>
                  <p className="text-xl text-muted-foreground mb-8">
                    Информационная система МЧС Республики Казахстан
                  </p>
                </div>

                <div className="grid gap-4">
                  <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                    <Shield className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Государственный учёт пожаров</h3>
                      <p className="text-sm text-muted-foreground">
                        Журналы выездов, отчетные формы 1-ОСП, 2-ССГ, 3-СПВП, 4-СОВП, 5-СПЖС, 6-ССПЗ
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                    <Lock className="h-6 w-6 text-accent mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Контроль и надзор</h3>
                      <p className="text-sm text-muted-foreground">
                        Реестр подконтрольных объектов, проверки, нарушения, предписания
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                    <User className="h-6 w-6 text-green-400 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Аудит и журналы</h3>
                      <p className="text-sm text-muted-foreground">
                        Учёт проверок, протоколы, административные правонарушения
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  <p>Министерство по чрезвычайным ситуациям</p>
                  <p>Республики Казахстан</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}