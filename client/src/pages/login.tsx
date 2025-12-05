import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/utils/queryClient";
import { Lock, User, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { MchsEmblem } from "@/components/mchs-emblem";
import { motion } from "framer-motion";

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
    <AuroraBackground>
      <div className="container mx-auto px-6 py-8 relative z-10">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
            {/* Left side - Login Form */}
            <div className="flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.3,
                  duration: 0.8,
                  ease: "easeInOut",
                }}
                className="w-full max-w-md"
              >
                <Card className="w-full backdrop-blur-md bg-white/30 dark:bg-black/30 border border-white/20 dark:border-white/10 shadow-xl">
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-20 h-20 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center shadow-lg overflow-hidden border border-white/40 p-2">
                        <MchsEmblem className="h-full w-full" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">Вход в систему</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-300">
                      Информационная система государственного пожарного контроля и надзора МЧС РК
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
                              <FormLabel className="text-slate-700 dark:text-slate-200">Логин</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 group-hover:text-primary transition-colors" />
                                  <Input
                                    {...field}
                                    placeholder="Введите логин"
                                    className="pl-10 bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 focus:bg-white/70 dark:focus:bg-black/40 transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-500"
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
                              <FormLabel className="text-slate-700 dark:text-slate-200">Пароль</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 group-hover:text-primary transition-colors" />
                                  <Input
                                    {...field}
                                    type="password"
                                    placeholder="Введите пароль"
                                    className="pl-10 bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 focus:bg-white/70 dark:focus:bg-black/40 transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-500"
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
                          className="w-full bg-primary/90 hover:bg-primary shadow-lg hover:shadow-primary/30 transition-all duration-300"
                          disabled={isLoading}
                        >
                          {isLoading ? "Вход..." : "Войти"}
                        </Button>
                      </form>
                    </Form>

                    {/* Тестовые учетные записи */}
                    <div className="mt-6 p-4 bg-white/20 dark:bg-black/20 rounded-lg border border-white/10 backdrop-blur-sm">
                      <h4 className="text-sm font-medium mb-2 text-slate-800 dark:text-slate-200">Тестовые учетные записи:</h4>
                      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        <div><strong>Администратор:</strong> mchs_admin / uQ8i5gAe</div>
                        <div><strong>МЧС РК:</strong> mchs_rk / hj9fWbvu</div>
                        <div><strong>Алматы (город):</strong> almaty_city_mchs / Al2025mcs</div>
                        <div><strong>Нур-Султан:</strong> astana_mchs / As2025mcs</div>
                        <div><strong>Шымкент:</strong> shymkent_mchs / Sh2025mcs</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right side - Info Panel */}
            <div className="flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.5,
                  duration: 0.8,
                  ease: "easeInOut",
                }}
                className="max-w-md space-y-6 text-slate-800 dark:text-slate-100"
              >
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-4 drop-shadow-sm">
                    Информационная система государственного пожарного контроля и надзора КПС МЧС РК
                  </h1>
                  <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 font-light">
                    Единый доступ к модулям, аналитике и отчетности
                  </p>
                </div>

                <div className="grid gap-4">
                  {[
                    {
                      icon: Shield,
                      title: "Государственный учёт пожаров",
                      desc: "Журналы выездов, отчётные формы, диаграммы и аналитика",
                      color: "text-blue-500",
                    },
                    {
                      icon: Lock,
                      title: "Государственный контроль и надзор",
                      desc: "Реестр объектов контроля, учёт проверок, предписаний и сроков их исполнения",
                      color: "text-orange-500",
                    },
                    {
                      icon: User,
                      title: "Перечни, списки, журналы",
                      desc: "аудитов, ППС, СРО",
                      color: "text-green-500",
                    }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="flex items-start gap-3 p-4 bg-white/30 dark:bg-black/20 backdrop-blur-md rounded-xl border border-white/20 shadow-sm transition-all cursor-pointer hover:bg-white/50 dark:hover:bg-black/30 hover:shadow-md hover:border-white/40"
                    >
                      <item.icon className={`h-6 w-6 ${item.color} mt-1`} />
                      <div>
                        <h3 className="font-semibold mb-1 text-slate-800 dark:text-slate-100">{item.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {item.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-8">
                  <p>© 2025 Комитет противопожарной службы МЧС РК</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}
