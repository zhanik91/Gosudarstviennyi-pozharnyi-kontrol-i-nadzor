import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { i18n } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Change Language">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Сменить язык</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => i18n.changeLanguage("ru")}>
          Русский
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => i18n.changeLanguage("kk")}>
          Қазақша
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
