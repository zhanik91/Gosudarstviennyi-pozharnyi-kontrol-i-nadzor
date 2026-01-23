import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorPageProps {
  code: number | string;
  message: string;
  actions?: ReactNode;
}

export default function ErrorPage({ code, message, actions }: ErrorPageProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="space-y-2">
            <div className="text-5xl font-bold">{code}</div>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          {actions ? <div className="pt-2">{actions}</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
