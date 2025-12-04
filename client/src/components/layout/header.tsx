 codex/expand-header-component-and-update-layout-bdgn3s
import React from "react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
 main
import { Link } from "wouter";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MchsEmblem } from "@/components/mchs-emblem";
import { useAuth } from "@/hooks/useAuth";
import {
  Activity,
  Bell,
  BookOpen,
  ChartBarBig,
  CircleUser,
  FileText,
  Headset,
  Layers,
  MapPin,
  Shield,
  Sparkles,
  Users,
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
        description: "Журнал инцидентов, отчётные формы и пакеты данных",
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
        title: "CRM и документооборот",
        description: "Хранилище документов, согласования и шаблоны",
        href: "/document-management",
        icon: FileText,
      },
      {
        title: "Интерактивные карты",
        description: "Геоданные, риски и маршруты реагирования",
        href: "/maps",
        icon: MapPin,
      },
    ],
  },
  {
    label: "Отчёты",
    items: [
      {
        title: "Расширенная аналитика",
        description: "Дашборды, сравнения регионов и тренды",
        href: "/analytics",
        icon: ChartBarBig,
      },
      {
        title: "Журнал заключений",
        description: "Аудиты, контроль выполнения и акты",
        href: "/audit-conclusions",
        icon: Activity,
      },
      {
        title: "Уведомления и Workflow",
        description: "Согласования, напоминания и SLA",
        href: "/notifications",
        icon: Bell,
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
        title: "CRM данные",
        description: "Организации, контакты и интеграции",
        href: "/crm",
        icon: Sparkles,
      },
    ],
  },
  {
    label: "Помощь",
    items: [
      {
        title: "Документация",
        description: "Руководства пользователя и шаблоны",
        href: "/documents",
        icon: BookOpen,
      },
      {
        title: "Поддержка",
        description: "Чат с оператором и база знаний",
        href: "/notifications?tab=support",
        icon: Headset,
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

  if (!user) return null;

  return (
 codex/expand-header-component-and-update-layout-bdgn3s
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-gradient-to-r from-slate-950/90 via-slate-900/85 to-sky-950/80 text-slate-100 backdrop-blur supports-[backdrop-filter]:bg-slate-950/75 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          <Link href="/">
            <a className="flex flex-none items-center gap-3 rounded-md px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <MchsEmblem className="h-10 w-10 rounded-md shadow-sm" />
              <div className="leading-tight">
                <p className="text-xs uppercase tracking-[0.08em] text-primary">
                  МЧС Республики Казахстан
                </p>
                <p className="text-sm font-semibold text-white">
                  Гос. пожарный контроль и надзор
                </p>

    <header className="gov-header" data-testid="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div>
              <Link href="/">
                <h1 className="gov-title cursor-pointer hover:opacity-90" data-testid="header-title">
                  Информационная система государственного пожарного контроля Комитета
                  противопожарной службы МЧС РК
                </h1>
              </Link>
              <p className="gov-subtitle">Комитет противопожарной службы МЧС РК</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/audit-conclusions">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-white hover:bg-white/10 font-medium"
                data-testid="link-audit-conclusions"
              >
                Журнал заключений аудитов
              </Button>
            </Link>

            <div className="text-right text-sm border-l border-white/20 pl-6">
              <div className="text-white font-medium" data-testid="user-fullname">
                {(user as any)?.fullName || "Пользователь"}
              </div>
              <div className="text-white/70 text-xs" data-testid="user-region">
                {(user as any)?.region}
                {(user as any)?.district && ` / ${(user as any)?.district}`}
 main
              </div>
            </a>
          </Link>

          <NavigationMenu className="hidden flex-1 lg:flex">
            <NavigationMenuList className="ml-4 gap-1">
              {navGroups.map((group) => (
                <NavigationMenuItem key={group.label}>
                  <NavigationMenuTrigger className="bg-transparent text-sm font-medium text-slate-100 transition-colors duration-200 hover:bg-primary/20 focus:bg-primary/25">
                    {group.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="rounded-xl border bg-white/95 shadow-xl transition-[opacity,transform] duration-200">
                    <div className="grid gap-3 p-4 md:w-[600px] lg:w-[720px] md:grid-cols-2">
                      {group.items.map((item) => (
                        <Link key={item.title} href={item.href}>
                          <NavigationMenuLink asChild>
                            <a className="flex h-full gap-3 rounded-lg border border-transparent bg-muted/60 px-3 py-3 text-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                                <item.icon className="h-5 w-5" />
                              </div>
                              <div className="space-y-1">
                                <p className="font-semibold leading-tight text-foreground">{item.title}</p>
                                <p className="text-xs text-muted-foreground leading-snug">
                                  {item.description}
                                </p>
                              </div>
                            </a>
                          </NavigationMenuLink>
                        </Link>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex flex-1 justify-center lg:hidden">
            <div className="flex w-full items-center gap-2 overflow-x-auto rounded-lg border border-slate-700/60 bg-slate-800/70 px-2 py-1 text-sm text-slate-100 shadow-sm">
              {navGroups
                .flatMap((group) => group.items)
                .slice(0, 4)
                .map((item) => (
                  <Link key={item.title} href={item.href}>
                    <a className="flex min-w-fit items-center gap-1 rounded-md px-3 py-1.5 font-medium transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <item.icon className="h-4 w-4" />
                      <span className="whitespace-nowrap">{item.title}</span>
                    </a>
                  </Link>
                ))}
            </div>
          </div>

          <div className="flex flex-none items-center gap-2">
            <Button
              variant="ghost"
 codex/expand-header-component-and-update-layout-bdgn3s
              size="icon"
              aria-label="Уведомления"
              className="relative hidden sm:inline-flex text-slate-100 transition duration-200 hover:bg-primary/20 hover:text-white"

              size="sm"
              onClick={() => (window.location.href = "/api/logout")}
              className="text-white hover:text-white hover:bg-white/10 font-medium"
              data-testid="button-logout"
 main
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                3
              </span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="group flex items-center gap-2 rounded-full px-2 pr-3 text-slate-100 transition duration-200 hover:bg-primary/20 hover:text-white"
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
                    <a className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Документация
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/notifications">
                    <a className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Уведомления
                    </a>
                  </Link>
                </DropdownMenuItem>
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
