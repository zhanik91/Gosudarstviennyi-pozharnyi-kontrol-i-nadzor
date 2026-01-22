import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border border-border shadow-lg">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">Страница не найдена</h1>
          <p className="text-muted-foreground mb-8">
            Запрашиваемая страница не существует или у вас нет прав для ее просмотра.
          </p>

          <Link href="/">
            <Button className="w-full sm:w-auto gap-2">
              <ArrowLeft className="h-4 w-4" />
              Вернуться на главную
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
