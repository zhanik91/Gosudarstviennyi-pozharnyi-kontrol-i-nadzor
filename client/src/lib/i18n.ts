import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  ru: {
    translation: {
      "app.title": "Единая система учета ЧС",
      "menu.fire": "Гос. учет пожаров",
      "menu.supervision": "Контроль и надзор",
      "menu.crm": "CRM и Документы",
      "menu.reports": "Отчеты",
      "menu.admin": "Администрирование",
      "menu.help": "Помощь",
      "common.add": "Добавить",
      "common.edit": "Редактировать",
      "common.delete": "Удалить",
      "common.save": "Сохранить",
      "common.cancel": "Отмена",
      "common.search": "Поиск",
      "common.filter": "Фильтры",
      "common.import": "Импорт",
      "common.export": "Экспорт",
      "incident.journal": "Журнал пожаров",
      "incident.new": "Новое происшествие",
      "incident.type": "Тип события",
      "incident.date": "Дата и время",
      "incident.address": "Адрес",
      "auth.login": "Войти",
      "auth.logout": "Выйти",
      "dashboard.welcome": "Добро пожаловать",
    }
  },
  kk: {
    translation: {
      "app.title": "ТЖ есебінің бірыңғай жүйесі",
      "menu.fire": "Өрттерді мемлекеттік есепке алу",
      "menu.supervision": "Бақылау және қадағалау",
      "menu.crm": "CRM және Құжаттар",
      "menu.reports": "Есептер",
      "menu.admin": "Әкімшілендіру",
      "menu.help": "Көмек",
      "common.add": "Қосу",
      "common.edit": "Өңдеу",
      "common.delete": "Жою",
      "common.save": "Сақтау",
      "common.cancel": "Болдырмау",
      "common.search": "Іздеу",
      "common.filter": "Сүзгілер",
      "common.import": "Импорттау",
      "common.export": "Экспорттау",
      "incident.journal": "Өрттер журналы",
      "incident.new": "Жаңа оқиға",
      "incident.type": "Оқиға түрі",
      "incident.date": "Күні мен уақыты",
      "incident.address": "Мекенжай",
      "auth.login": "Кіру",
      "auth.logout": "Шығу",
      "dashboard.welcome": "Қош келдіңіз",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ru',
    debug: false,
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
