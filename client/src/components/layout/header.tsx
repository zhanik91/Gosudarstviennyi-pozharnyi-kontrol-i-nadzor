import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MchsEmblem } from "@/components/mchs-emblem";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import {
  Bell,
  Bot,
  Calculator,
  CircleUser,
  ClipboardList,
  FileText,
  Layers,
  Menu,
  Shield,
  Sparkles,
  Users,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
} from "lucide-react";

type NavItem = {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Модули",
    items: [
      {
        title: "Государственный учёт пожаров",
        description: "Журнал инцидентов, отчётные формы, диаграммы и карты",
        href: "/fire-module",
        icon: Shield,
      },
      {
        title: "Контроль и надзор",
        description: "Реестр подконтрольных объектов и график проверок",
        href: "/controlled-objects",
        icon: Layers,
      },
      {
        title: "Административные практики",
        description: "Журналы, фотопротоколы и контроль исполнения",
        href: "/admin-practices",
        icon: ClipboardList,
      },
      {
        title: "Нормативные документы",
        description: "Законы, техрегламенты, ППБ РК и другие НПА",
        href: "/normative-documents",
        icon: FileText,
      },
    ],
  },
  {
    label: "Журналы",
    items: [
      {
        title: "Модуль журналов",
        description: "Все журналы и перечни в одном интерфейсе",
        href: "/journals-lists",
        icon: ClipboardList,
      },
      {
        title: "Журнал заключений аудитов",
        description: "Учёт аудитов и заключений пожарной безопасности",
        href: "/journals-lists?tab=audits",
        icon: FileText,
      },
      {
        title: "Список профессиональных противопожарных служб",
        description: "Перечень зарегистрированных служб",
        href: "/journals-lists?tab=pps",
        icon: ClipboardList,
      },
    ],
  },
  {
    label: "Администрирование",
    items: [
      {
        title: "Панель администратора",
        description: "Настройки системы, роли и логирование",
        href: "/admin",
        icon: Users,
      },
      {
        title: "Справочники",
        description: "Организации, контакты и справочные данные",
        href: "/crm",
        icon: Sparkles,
      },
    ],
  },
  {
    label: "Инструменты",
    items: [
      {
        title: "Калькуляторы",
        description: "Расчёты огнетушителей, категорий помещений и НГПС/ПСС",
        href: "/calculators",
        icon: Calculator,
      },
      {
        title: "ИИ-Ассистент",
        description: "Консультации по НПА РК и пожарной безопасности",
        href: "/ai-assistant",
        icon: Bot,
      },
    ],
  },
];

function getInitials(name?: string) {
  if (!name) return "МЧ";
  const parts = name.split(" ").filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default function Header() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Получение уведомлений
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!user) return null;

  const isAdmin = (user as any)?.role === "MCHS" || (user as any)?.role === "admin";
  const navGroupsForUser = navGroups.filter(
    (group) => group.label !== "Администрирование" || isAdmin
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background text-foreground shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          <Link href="/" className="flex flex-none items-center gap-3 rounded-md px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            <MchsEmblem className="h-10 w-10 rounded-md shadow-sm" />
            <div className="leading-tight">
              <p className="text-xs uppercase tracking-[0.08em] text-primary">
                ҚР ТЖМ ӨҚҚК
              </p>
              <p className="text-sm font-semibold text-foreground">
                КПС МЧС РК
              </p>
            </div>
          </Link>

          <NavigationMenu className="hidden flex-1 lg:flex">
            <NavigationMenuList className="ml-4 gap-1">
              {navGroupsForUser.map((group) => (
                <NavigationMenuItem key={group.label}>
                  <NavigationMenuTrigger className="bg-transparent text-sm font-medium text-foreground transition-colors duration-200 hover:bg-primary/10 focus:bg-primary/15">
                    {group.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="rounded-xl border border-border bg-popover text-popover-foreground shadow-xl transition-[opacity,transform] duration-200">
                    <div className="grid gap-3 p-4 md:w-[600px] lg:w-[720px] md:grid-cols-2">
                      {group.items.map((item) => (
                        <NavigationMenuLink key={item.title} asChild>
                          <Link href={item.href} className="flex h-full gap-3 rounded-lg border border-transparent bg-secondary/80 px-3 py-3 text-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                              <item.icon className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold leading-tight text-foreground">{item.title}</p>
                              <p className="text-xs text-muted-foreground leading-snug">
                                {item.description}
                              </p>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex lg:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:bg-primary/10"
                  aria-label="Открыть меню"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px] bg-background border-border overflow-y-auto">
                <SheetHeader className="pb-4 border-b border-border">
                  <SheetTitle className="flex items-center gap-3 text-foreground">
                    <MchsEmblem className="h-8 w-8" />
                    <span>Меню</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-6">
                  {navGroupsForUser.map((group) => (
                    <div key={group.label} className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
                        {group.label}
                      </h3>
                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <Link
                            key={item.title}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition hover:bg-primary/10"
                          >
                            <item.icon className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{item.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-border">
                    <Link
                      href="/api/logout"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive transition hover:bg-destructive/10"
                    >
                      <Shield className="h-5 w-5" />
                      <span className="font-medium">Выйти из системы</span>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex flex-none items-center gap-2">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Уведомления"
                  className="relative text-foreground transition duration-200 hover:bg-primary/10"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-xl p-0 overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold">Уведомления</h3>
                  {unreadCount > 0 && <Badge variant="secondary">{unreadCount} новых</Badge>}
                </div>
                <ScrollArea className="h-[350px]">
                  {notifications.length > 0 ? (
                    <div className="grid">
                      {notifications.map((notif) => (
                        <DropdownMenuItem
                          key={notif.id}
                          className={`flex items-start gap-3 p-4 cursor-pointer focus:bg-primary/5 border-b last:border-0 ${!notif.isRead ? 'bg-primary/5' : ''}`}
                          onClick={() => setLocation(`/notifications?id=${notif.id}`)}
                        >
                          <div className="mt-0.5">
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="space-y-1 overflow-hidden">
                            <p className="text-sm font-medium leading-none truncate">{notif.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(notif.createdAt).toLocaleString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <Bell className="h-10 w-10 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">У вас пока нет уведомлений</p>
                    </div>
                  )}
                </ScrollArea>
                <div className="p-2 bg-muted/30 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setLocation("/notifications")}
                  >
                    Показать все уведомления
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="group flex items-center gap-2 rounded-full px-2 pr-3 text-foreground transition duration-200 hover:bg-primary/10"
                  aria-label="Меню профиля"
                >
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage
                      src={(user as any)?.avatarUrl || ""}
                      alt={(user as any)?.fullName || "Пользователь"}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials((user as any)?.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left md:block">
                    <p className="text-sm font-medium leading-tight text-foreground">
                      {(user as any)?.fullName || "Пользователь"}
                    </p>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {(user as any)?.region || ""}
                      {(user as any)?.district ? ` / ${(user as any)?.district}` : ""}
                    </p>
                  </div>
                  <CircleUser className="hidden h-4 w-4 text-muted-foreground transition duration-200 group-hover:text-foreground md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl">
                <DropdownMenuLabel className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{(user as any)?.fullName || "Профиль"}</p>
                  <p className="text-xs text-muted-foreground leading-snug">
                    {(user as any)?.region || ""}
                    {(user as any)?.district ? ` / ${(user as any)?.district}` : ""}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/documents">
                    <div className="flex items-center gap-2 cursor-pointer w-full">
                      <FileText className="h-4 w-4" />
                      Документация
                    </div>
                  </Link>
                </DropdownMenuItem>
                {(isAdmin) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <div className="flex items-center gap-2 cursor-pointer w-full">
                          <Users className="h-4 w-4" />
                          Администрирование
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={() => (window.location.href = "/api/logout")}
                >
                  <span className="flex items-center gap-2 text-red-600">
                    <Shield className="h-4 w-4" />
                    Выйти из системы
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
