import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, FileText, Building, FileCheck } from "lucide-react";
import { Link } from "wouter";

export function SimpleActions() {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-2">
        <Link href="/controlled-objects">
            <Button variant="outline" className="w-full justify-start">
              <Building className="mr-2 h-4 w-4" />
              Перечень подконтрольных объектов
            </Button>
          </Link>
        </div>
    </Card>
  );
}