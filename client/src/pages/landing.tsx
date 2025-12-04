import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Building, FileText } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground portal-bg">
      <div className="container mx-auto px-6 py-16">
        <div className="text-center space-y-6 mb-16">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-accent to-amber-500 flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-accent-foreground" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-foreground">
                Информационная система государственного пожарного контроля Комитета
                противопожарной службы МЧС РК
              </h1>
              <p className="text-lg text-muted-foreground">
                Единая цифровая платформа Комитета противопожарной службы МЧС РК
              </p>
            </div>
          </div>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Комплексная система управления пожарной безопасностью с модульной архитектурой 
            для эффективного контроля и отчетности МЧС РК
          </p>
          
          <div className="flex justify-center">
            <Button 
              onClick={() => window.location.href = '/api/login'}
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-lg"
              data-testid="button-login"
            >
              Войти в систему
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-gradient-to-br from-card to-card/80 border border-border hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Государственный учёт пожаров</h3>
              </div>
              <p className="text-muted-foreground">
                Журнал выездов, единое окно ввода, отчёты 1-ОСП, 2-ССГ, 3-СПВП, 4-СОВП, 5-СПЖС, 6-ССПЗ и CO, пакеты и диаграммы
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/80 border border-border hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Building className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Перечень подконтрольных объектов</h3>
              </div>
              <p className="text-muted-foreground">
                Реестр объектов надзора (ОВСР/иные), атрибуты, статусы проверок, привязка к территориям
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/80 border border-border hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Журналы: аудиты, НГПС, АПН</h3>
              </div>
              <p className="text-muted-foreground">
                Учёт проверок НГПС, предписаний, административных правонарушений, протоколов, актов, возвратов
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Комитет противопожарной службы МЧС РК
          </p>
        </div>
      </div>
    </div>
  );
}
