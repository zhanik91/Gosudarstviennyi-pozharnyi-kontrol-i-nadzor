import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorDisplayProps {
  message?: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
}

export function ErrorDisplay({ 
  message = "Произошла ошибка", 
  onRetry, 
  showRetryButton = true 
}: ErrorDisplayProps) {
  return (
    <Card className="border-red-200 dark:border-red-800">
      <CardContent className="flex flex-col items-center justify-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
          {message}
        </p>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Попробуйте обновить страницу или повторите попытку
        </p>
        {showRetryButton && onRetry && (
          <Button 
            variant="outline" 
            onClick={onRetry}
            className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
            data-testid="button-retry"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Повторить попытку
          </Button>
        )}
      </CardContent>
    </Card>
  );
}