import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import ErrorPage from "@/components/system/error-page";

export default function NotFound() {
  return (
    <ErrorPage
      code={404}
      message="Запрашиваемая страница не найдена. Возможно, она была удалена или перемещена."
      actions={
        <Button asChild>
          <Link href="/">На главную</Link>
        </Button>
      }
    />
  );
}
