import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, 
  Download, 
  Languages, 
  FileText, 
  CheckCircle 
} from "lucide-react";

interface LanguageData {
  code: string;
  name: string;
  nativeName: string;
  isOfficial: boolean;
  coverage: number; // процент переведенного контента
}

interface TranslationStatus {
  formIndex: string;
  formName: string;
  kazakh: number;
  russian: number;
  lastUpdated: string;
}

export default function LanguageSupport() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ru');

  const languages: LanguageData[] = [
    {
      code: 'kk',
      name: 'Казахский',
      nativeName: 'Қазақша',
      isOfficial: true,
      coverage: 100
    },
    {
      code: 'ru',
      name: 'Русский',
      nativeName: 'Русский',
      isOfficial: true,
      coverage: 100
    }
  ];

  const translationStatus: TranslationStatus[] = [
    {
      formIndex: '1-ОСП',
      formName: 'Общие сведения о пожарах и гибели людей',
      kazakh: 100,
      russian: 100,
      lastUpdated: '2025-01-26'
    },
    {
      formIndex: '2-ССГ',
      formName: 'Сведения о случаях горения, не подлежащие учету как пожары',
      kazakh: 100,
      russian: 100,
      lastUpdated: '2025-01-26'
    },
    {
      formIndex: '3-СПВП',
      formName: 'Сведения о причинах возникновения пожаров',
      kazakh: 100,
      russian: 100,
      lastUpdated: '2025-01-26'
    },
    {
      formIndex: '4-СОВП',
      formName: 'Сведения об объектах возникновения пожаров',
      kazakh: 100,
      russian: 100,
      lastUpdated: '2025-01-26'
    },
    {
      formIndex: '5-СПЖС',
      formName: 'Сведения о пожарах в жилом секторе',
      kazakh: 100,
      russian: 100,
      lastUpdated: '2025-01-26'
    },
    {
      formIndex: '6-ССПЗ',
      formName: 'Сведения о степных пожарах и загораниях',
      kazakh: 100,
      russian: 100,
      lastUpdated: '2025-01-26'
    },
    {
      formIndex: 'CO',
      formName: 'Сведения о погибших от отравления угарным газом',
      kazakh: 100,
      russian: 100,
      lastUpdated: '2025-01-26'
    }
  ];

  // Примеры переводов ключевых терминов
  const terminology = {
    'ru': {
      'fire': 'Пожар',
      'incident': 'Происшествие',
      'damage': 'Ущерб',
      'casualties': 'Пострадавшие',
      'cause': 'Причина',
      'location': 'Место происшествия',
      'report': 'Отчет',
      'deadline': 'Крайний срок',
      'submit': 'Подать',
      'draft': 'Черновик',
      'completed': 'Завершен',
      'overdue': 'Просрочен'
    },
    'kk': {
      'fire': 'Өрт',
      'incident': 'Жағдай',
      'damage': 'Зиян',
      'casualties': 'Зардап шеккендер',
      'cause': 'Себеп',
      'location': 'Жағдай орны',
      'report': 'Есеп',
      'deadline': 'Соңғы мерзім',
      'submit': 'Тапсыру',
      'draft': 'Жоба',
      'completed': 'Аяқталды',
      'overdue': 'Мерзімі өткен'
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const downloadLanguagePack = (langCode: string) => {
    const translations = terminology[langCode as keyof typeof terminology];
    const jsonContent = JSON.stringify(translations, null, 2);
    
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `translations_${langCode}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Языковая поддержка
          </h2>
          <p className="text-muted-foreground">
            Система поддерживает государственный и русский языки согласно требованиям МЧС РК
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => downloadLanguagePack('ru')}
          >
            <Download className="h-4 w-4 mr-2" />
            Скачать RU
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadLanguagePack('kk')}
          >
            <Download className="h-4 w-4 mr-2" />
            Скачать KK
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Официальные языки
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {languages.map((lang) => (
              <div key={lang.code} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-6 bg-gradient-to-r from-blue-500 to-yellow-500 rounded"></div>
                  <div>
                    <div className="font-medium">{lang.name}</div>
                    <div className="text-sm text-muted-foreground">{lang.nativeName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {lang.isOfficial && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                      Официальный
                    </Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <div className="text-sm font-medium">{lang.coverage}%</div>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Статус переводов форм</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {translationStatus.map((status) => (
                <div key={status.formIndex} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{status.formIndex}</span>
                    <span className="text-xs text-muted-foreground">
                      Обновлено: {new Date(status.lastUpdated).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Қазақша</span>
                        <span>{status.kazakh}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(status.kazakh)}`}
                          style={{ width: `${status.kazakh}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Русский</span>
                        <span>{status.russian}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(status.russian)}`}
                          style={{ width: `${status.russian}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Терминологический словарь</CardTitle>
          <p className="text-sm text-muted-foreground">
            Унифицированные переводы терминов МЧС РК
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <TabsList>
              <TabsTrigger value="ru">Русский</TabsTrigger>
              <TabsTrigger value="kk">Қазақша</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ru" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(terminology.ru).map(([key, value]) => (
                  <div key={key} className="p-3 bg-secondary/50 rounded border">
                    <div className="text-sm font-medium">{value}</div>
                    <div className="text-xs text-muted-foreground">{key}</div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="kk" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(terminology.kk).map(([key, value]) => (
                  <div key={key} className="p-3 bg-secondary/50 rounded border">
                    <div className="text-sm font-medium">{value}</div>
                    <div className="text-xs text-muted-foreground">{key}</div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Требования к языковой поддержке</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Все формы отчетности заполняются на государственном (казахском) и русском языках</p>
            <p>• Интерфейс системы поддерживает переключение между языками</p>
            <p>• Терминология соответствует официальным документам МЧС РК</p>
            <p>• Автоматическая проверка полноты переводов перед отправкой отчетов</p>
            <p>• Экспорт отчетов возможен на обоих официальных языках</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}