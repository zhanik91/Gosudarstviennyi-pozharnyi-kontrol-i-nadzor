import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showDetails?: boolean;
  error?: Error;
}

export function ErrorDisplay({ 
  title = "Произошла ошибка", 
  message = "Не удалось загрузить данные. Попробуйте еще раз.",
  onRetry,
  showDetails = false,
  error
}: ErrorDisplayProps) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6 text-destructive" />
        </div>
        <CardTitle className="text-destructive">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">{message}</p>
        
        {showDetails && error && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Показать подробности
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
        
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Попробовать снова
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface NetworkErrorProps {
  onRetry?: () => void;
}

export function NetworkError({ onRetry }: NetworkErrorProps) {
  return (
    <ErrorDisplay
      title="Проблемы с подключением"
      message="Проверьте интернет-соединение и попробуйте еще раз."
      onRetry={onRetry}
    />
  );
}

interface NotFoundErrorProps {
  resource?: string;
  onGoBack?: () => void;
}

export function NotFoundError({ resource = "страница", onGoBack }: NotFoundErrorProps) {
  return (
    <ErrorDisplay
      title={`${resource.charAt(0).toUpperCase()}${resource.slice(1)} не найдена`}
      message="Запрашиваемый ресурс не существует или был удален."
      onRetry={onGoBack}
    />
  );
}