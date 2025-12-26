import React from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbNavigationProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Маппинг путей к заголовкам
const pathToTitle: Record<string, string> = {
  "/": "Главная",
  "/fire-module": "Государственный учет пожаров",
  "/control-supervision": "Государственный контроль и надзор",
  "/login": "Вход в систему",
};

const pathToIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  "/": Home,
};

export default function BreadcrumbNavigation({ items, className }: BreadcrumbNavigationProps) {
  const [location] = useLocation();
  
  // Автоматическое определение breadcrumb на основе URL
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items;
    
    const pathSegments = location.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Всегда добавляем главную
    breadcrumbs.push({
      label: "Главная",
      href: "/",
      icon: Home,
    });
    
    // Добавляем сегменты пути
    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const title = pathToTitle[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
      const icon = pathToIcon[currentPath];
      
      breadcrumbs.push({
        label: title,
        href: index === pathSegments.length - 1 ? undefined : currentPath, // Последний элемент без ссылки
        icon,
      });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null; // Не показывать breadcrumb на главной странице
  }

  return (
    <nav
      className={cn(
        "flex items-center space-x-1 text-sm text-muted-foreground mb-4",
        className
      )}
      aria-label="Breadcrumb"
      data-testid="breadcrumb-navigation"
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const Icon = item.icon;
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/60" />
              )}
              
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  data-testid={`breadcrumb-link-${index}`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    "flex items-center gap-1",
                    isLast ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                  data-testid={`breadcrumb-current-${index}`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
