import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  Download, 
  Edit, 
  CheckSquare, 
  X,
  Archive,
  Mail,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkOperationsToolbarProps {
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: () => void;
  onExport: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onSendEmail?: () => void;
  onGenerateReport?: () => void;
  className?: string;
  totalCount?: number;
}

export default function BulkOperationsToolbar({
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onExport,
  onEdit,
  onArchive,
  onSendEmail,
  onGenerateReport,
  className,
  totalCount = 0
}: BulkOperationsToolbarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg mb-4",
        "animate-in slide-in-from-top-2 duration-200",
        className
      )}
      data-testid="bulk-operations-toolbar"
    >
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="flex items-center gap-1">
          <CheckSquare className="h-3 w-3" />
          {selectedCount} выбрано
        </Badge>
        
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            className="h-auto p-1 text-xs"
            data-testid="button-select-all"
          >
            Выбрать все ({totalCount})
          </Button>
          <span>|</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeselectAll}
            className="h-auto p-1 text-xs"
            data-testid="button-deselect-all"
          >
            Снять выделение
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Primary Actions */}
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="flex items-center gap-1"
          data-testid="button-bulk-export"
        >
          <Download className="h-4 w-4" />
          Экспорт
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="flex items-center gap-1"
          data-testid="button-bulk-edit"
        >
          <Edit className="h-4 w-4" />
          Редактировать
        </Button>

        {/* Optional Actions */}
        {onGenerateReport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateReport}
            className="flex items-center gap-1"
            data-testid="button-bulk-report"
          >
            <FileText className="h-4 w-4" />
            Отчет
          </Button>
        )}

        {onSendEmail && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSendEmail}
            className="flex items-center gap-1"
            data-testid="button-bulk-email"
          >
            <Mail className="h-4 w-4" />
            Отправить
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onArchive}
          className="flex items-center gap-1"
          data-testid="button-bulk-archive"
        >
          <Archive className="h-4 w-4" />
          Архивировать
        </Button>

        {/* Destructive Actions */}
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="flex items-center gap-1"
          data-testid="button-bulk-delete"
        >
          <Trash2 className="h-4 w-4" />
          Удалить
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDeselectAll}
          className="ml-2"
          data-testid="button-close-bulk"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
