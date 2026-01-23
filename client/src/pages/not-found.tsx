import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import ErrorPage from "@/components/system/error-page";

export default function NotFound() {
  return (
    <ErrorPage
      code={404}
      message="Страница не найдена. Такой страницы не существует или она была перемещена."
      actions={
        <Button asChild>
          <Link href="/">На главную</Link>
        </Button>
      }
    />
  );
}
