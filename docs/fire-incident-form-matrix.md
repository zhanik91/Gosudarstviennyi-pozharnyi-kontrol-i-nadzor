# Матрица маппинга журнала происшествий в формы 1–7

> Статус: **эталон (baseline)** для последующих изменений маппинга и валидации.
>
> Источники правды:
> - `server/storage/incident.storage.ts` (основная агрегация по формам)
> - `shared/mappings/form7-co-object.mapping.ts` (специализированный маппинг объектов для формы 7-CO)

## Общие правила

- Базовый набор данных берется из:
  - `incidents.*` (события),
  - `incident_victims.*` (пострадавшие/погибшие), привязка по `incident_id`.
- Для периода и орг-скоупа используется единый `getReportDataset(...)`, затем отдельная ветка `switch (params.form)` по форме.
- `locality=city_pgt` нормализуется в `cities`.

---

## 1-ОСП

| Источник поля журнала | Правило преобразования | Строка формы | Обязательность / условие `incidentType` |
|---|---|---|---|
| `incidents.id` | Подсчет количества инцидентов (`+1` на запись) с разбивкой total/urban/rural | `1` | Только для инцидентов из набора `fire, steppe_fire, nonfire, steppe_smolder, co_nofire` |
| `incidents.damage` | Сумма ущерба по locality | `2` | То же условие, что строка `1` |
| `incidents.deaths_total` | Сумма погибших | `3` | То же условие, что строка `1` |
| `incidents.deaths_children` | Сумма погибших детей | `3.1` | То же условие, что строка `1` |
| `incidents.deaths_drunk` | Сумма погибших в состоянии опьянения | `3.2` | То же условие, что строка `1` |
| `incidents.deaths_co_total` | Сумма погибших от CO | `4` | **Только** `co_nofire` |
| `incidents.deaths_co_children` | Сумма погибших детей от CO | `4.1` | **Только** `co_nofire` |
| `incidents.injured_total` | Сумма травмированных | `5` | Набор `fire, steppe_fire, nonfire, steppe_smolder, co_nofire` |
| `incidents.injured_children` | Сумма травмированных детей | `5.1` | То же условие, что строка `5` |
| `incidents.injured_co_total` | Сумма травмированных от CO | `6` | **Только** `co_nofire` |
| `incidents.injured_co_children` | Сумма травмированных детей от CO | `6.1` | **Только** `co_nofire` |
| `incidents.saved_people_total` | Сумма спасенных людей | `7` | Набор `fire, steppe_fire, nonfire, steppe_smolder, co_nofire` |
| `incidents.saved_people_children` | Сумма спасенных детей | `7.1` | То же условие, что строка `7` |
| `incidents.saved_property` | Сумма спасенного имущества | `8` | Набор `fire, steppe_fire, nonfire, steppe_smolder, co_nofire` |

**Особенность:** при наличии импортированных данных из `report_forms.data` для `1-osp` используется импортный источник вместо расчета по `incidents`.

---

## 2-ССГ

| Источник поля журнала | Правило преобразования | Строка формы | Обязательность / условие `incidentType` |
|---|---|---|---|
| `incidents.cause_code` / `incidents.cause_detailed` | Берется `cause_code`, если пусто — `cause_detailed`; далее счетчик по коду | `NON_FIRE_CASES[].code` | **Только** `nonfire` |

---

## 3-СПВП

| Источник поля журнала | Правило преобразования | Строка формы | Обязательность / условие `incidentType` |
|---|---|---|---|
| `incidents.cause_code`, `incidents.damage` | Агрегация `count` + `sum(damage)` по коду верхнего уровня | `FIRE_CAUSES[].code` (без `.`) | Используется `fireIncidents` = `fire, steppe_fire, nonfire, steppe_smolder, co_nofire` |
| `incidents.cause_detailed`, `incidents.damage` | Агрегация `count` + `sum(damage)` по детализированному коду | `FIRE_CAUSES[].code` (с `.`) | То же условие |

---

## 4-СОВП

| Источник поля журнала | Правило преобразования | Строка формы | Обязательность / условие `incidentType` |
|---|---|---|---|
| `incidents.object_code`, `damage`, `deaths_total`, `injured_total` | `count` + суммы ущерба/погибших/травмированных по коду объекта | `FORM_4_SOVP_ROWS[].id` (без `.`) | Используется `fireIncidents` = `fire, steppe_fire, nonfire, steppe_smolder, co_nofire` |
| `incidents.object_detailed`, `damage`, `deaths_total`, `injured_total` | То же, но по детализированному коду | `FORM_4_SOVP_ROWS[].id` (с `.`) | То же условие |

---

## 5-СПЖС (в коде: `5-spzs`)

| Источник поля журнала | Правило преобразования | Строка формы | Обязательность / условие `incidentType` |
|---|---|---|---|
| `incidents.object_code` / `incidents.object_detailed` | Фильтр жилого сектора: код начинается с `14` | Все строки формы 5 (как предикат входа) | База: `fireIncidents`; дополнительно `objectCode/objectDetailed` startsWith `14` |
| `incidents.id` | Подсчет пожаров в жилье | `1` | Только отфильтрованные `residentialIncidents` |
| `incidents.damage` | Сумма ущерба | `1.1` | То же |
| `incidents.deaths_total` | Сумма погибших | `2` | То же |
| `incident_victims.gender/status/victim_type` | `dead + male` | `2.1` | `victim_type='fire'` и `status='dead'` и инцидент в `residentialIncidents` |
| `incident_victims.gender/status/victim_type` | `dead + female` | `2.2` | То же |
| `incidents.deaths_children` + `incident_victims.age_group='child'` | В коде строка `2.3` заполняется из **двух источников** (инцидентный total детей + детские victim-записи) | `2.3` | То же |
| `incident_victims.social_status` | Нормализация + маппинг `FORM_5_SOCIAL_STATUS_TO_ROW` | `2.1.1 ... 2.1.10` | `victim_type='fire'`, `status='dead'` |
| `incidents.injured_total` | Сумма травмированных | `3` | `residentialIncidents` |
| `incident_victims.gender/status/victim_type` | injured male/female | `3.1`, `3.2` | `victim_type='fire'`, `status='injured'` |
| `incidents.injured_children` | Сумма травмированных детей | `3.3` | `residentialIncidents` |
| `incident_victims.condition` | Нормализация + `FORM_5_CONDITION_TO_ROW` | `3.1.1 ... 3.1.6` | `victim_type='fire'`, `status='dead'` |
| `incident_victims.death_cause` | Нормализация + `FORM_5_DEATH_CAUSE_TO_ROW` | `4.1.1 ... 4.1.6` | `victim_type='fire'`, `status='dead'` |
| `incident_victims.death_place` | Маппинг `FORM_5_DEATH_PLACE_TO_ROW` | `5.1.1 ... 5.1.3` | `victim_type='fire'`, `status='dead'` |
| `incidents.saved_people_total` | Сумма спасенных | `4` | `residentialIncidents` |
| `incidents.saved_people_children` | Сумма спасенных детей | `4.1` | `residentialIncidents` |
| `incidents.saved_property` | Сумма спасенного имущества | `5` | `residentialIncidents` |
| `incidents.livestock_lost.*` | Ключевой маппинг в строки раздела 6 | `section6_livestock_*` | `residentialIncidents`, значение > 0 |
| `incidents.destroyed_items.techniques` | Сумма уничтоженной техники | `7` | `residentialIncidents`, значение > 0 |
| `incidents.destroyed_items.structures` | Сумма уничтоженных строений | `8` | `residentialIncidents`, значение > 0 |
| `incidents.cause_detailed` / `cause_code` | Подсчет причин в жилье | `6.*` (через обход секции 6) | `residentialIncidents` |

---

## 6-ССПЗ

| Источник поля журнала | Правило преобразования | Строка формы | Обязательность / условие `incidentType` |
|---|---|---|---|
| `incidents.id` | `fires_count += 1` | По строкам `FORM_6_STEPPE_FIRES_ROWS` / `FORM_6_IGNITIONS_ROWS` (по `label`) | `steppe_fire` (блок степных пожаров) или `steppe_smolder` (блок загораний) |
| `incidents.steppe_area` | Сумма площади | `steppe_area` | То же |
| `incidents.steppe_damage` | Сумма ущерба | `damage_total` | То же |
| `incidents.steppe_people_dead`, `steppe_people_injured`, `steppe_people_total` | `people_dead`, `people_injured`; `people_total = steppe_people_total || (dead + injured)` | `people_*` | То же |
| `incidents.steppe_animals_dead`, `steppe_animals_injured`, `steppe_animals_total` | `animals_total = steppe_animals_total || (dead + injured)` | `animals_*` | То же |
| `incidents.steppe_extinguished_total/area/damage` | Суммы показателей тушения | `extinguished_*` | То же |
| `incidents.steppe_garrison_people/units`, `steppe_mchs_people/units` | Суммы привлеченных сил/средств | `garrison_*`, `mchs_*` | То же |
| `incidents.region` | Запись в региональную строку + дублирование в сводную строку `РК` | Строки по `label` региона + `РК` | Для всех инцидентов соответствующего блока |

---

## 7-CO

| Источник поля журнала | Правило преобразования | Строка формы | Обязательность / условие `incidentType` |
|---|---|---|---|
| `incident_victims.status='dead'`, `gender`, `age_group` | Базовые totals погибших + разрез по полу/детям | `1`, `1.1`, `1.2`, `1.3` | `victim_type='co_poisoning'`; тип инцидента явно не фильтруется |
| `incident_victims.status='injured'`, `gender`, `age_group` | Базовые totals травмированных + разрез | `11`, `11.1`, `11.2`, `11.3` | `victim_type='co_poisoning'` |
| `incident_victims.social_status` | Нормализация + маппинг на строки соцстатуса (погибшие/травм.) | `2.*`, `12.*` | `victim_type='co_poisoning'` + соответствующий `status` |
| `incident_victims.condition` | Нормализация + маппинг на строки состояния | `3.*`, `13.*` | `victim_type='co_poisoning'` + соответствующий `status` |
| `incidents.object_code` | Через `mapCoObjectCodeToForm7Rows(...)` определяются строки для погибших/травмированных | `5.*`, `15.*` | `victim_type='co_poisoning'`; при пустом/неизвестном коде fallback `5.12/15.12` |
| `incidents.time_of_day` и/или `incidents.date_time` | Бакетизация времени суток `00-06/06-12/12-18/18-24` | Погибшие: `8.1..8.4`; травмированные: `18.1..18.4` | `victim_type='co_poisoning'` |
| `incidents.date_time` | День недели (`Mon..Sun`) | Погибшие: `7.1..7.7`; травмированные: `17.1..17.7` | `victim_type='co_poisoning'` |

---

## Автопроизводные поля

### 1) `timeOfDay`
- Для формы 7-CO используется `resolveTimeOfDayBucket({ dateTime, timeOfDay })`.
- Приоритет: если есть нормализованное `timeOfDay`, используется оно; иначе бакет выводится из `dateTime`.
- Маппинг бакета в строку:
  - `00:00-06:00` → `8.1` / `18.1`
  - `06:00-12:00` → `8.2` / `18.2`
  - `12:00-18:00` → `8.3` / `18.3`
  - `18:00-24:00` → `8.4` / `18.4`

### 2) Children totals
- В 1-ОСП: детские показатели берутся напрямую из `incidents.*_children`.
- В 5-СПЖС: строка `2.3` фактически комбинирует:
  - инцидентный `incidents.deaths_children`,
  - плюс victim-level `age_group='child'` для погибших (возможен риск двойного учета при несовпадении методологий).

### 3) CO totals
- В 1-ОСП CO-метрики (`4/4.1/6/6.1`) считаются **только** из инцидентов `co_nofire` по агрегированным полям `incidents.*co*`.
- В 7-CO totals считаются **по записям victims** с `victim_type='co_poisoning'` (независимо от `incidentType` инцидента).

---

## Спорные / чувствительные места (для ревью изменений)

1. **Несоответствие источников CO между формами 1 и 7.**
   - 1-ОСП использует `incidents.deaths_co_* / injured_co_*` и фильтр `incidentType='co_nofire'`.
   - 7-CO использует `incident_victims` по `victim_type='co_poisoning'` без фильтра по `incidentType`.

2. **Потенциальная коллизия детской смертности в 5-СПЖС (`2.3`).**
   - Одновременно участвуют инцидентные totals и victim-строки.

3. **Object mapping для 7-CO зависит от отдельного справочника и fallback-логики.**
   - При неизвестном/пустом `object_code` используется fallback в `прочие` (`5.12/15.12`) с логированием.

4. **Широкий состав `fireIncidents`** (включая `nonfire`, `co_nofire`) влияет на формы 3, 4, 5 и часть строк формы 1.

См. реализацию в:
- `server/storage/incident.storage.ts`
- `shared/mappings/form7-co-object.mapping.ts`

---

## Решение по сопровождению

Данный документ принят как **эталонный контракт маппинга**. Любое изменение в логике заполнения форм 1–7 должно сопровождаться:
1. обновлением этого документа,
2. ссылкой на PR/commit с изменением маппинга,
3. (желательно) регрессионной проверкой соответствующих форм/строк.
