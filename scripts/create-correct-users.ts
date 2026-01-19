import { db } from "../server/storage/db";
import { users } from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

interface UserData {
  username: string;
  password: string;
  fullName: string;
  role: string;
  region: string;
  district: string;
}

const allUsers: UserData[] = [];

// 1. Администратор системы
allUsers.push({
  username: "admin",
  password: "admin123",
  fullName: "Администратор системы",
  role: "admin",
  region: "",
  district: ""
});

// 2. МЧС РК (центральный аппарат)
allUsers.push({
  username: "mchs",
  password: "mchs123",
  fullName: "МЧС Республики Казахстан",
  role: "MCHS",
  region: "",
  district: ""
});

// 3. ДЧС города Астана
allUsers.push({
  username: "dchs_astana",
  password: "dchs123",
  fullName: "ДЧС города Астана",
  role: "DCHS",
  region: "г. Астана",
  district: ""
});

// УЧС районов г. Астана
const astanaDistricts = [
  "Алматы", "Байконыр", "Есиль", "Нура", "Сарыарка", "Сарайшык"
];
astanaDistricts.forEach(d => {
  allUsers.push({
    username: `uchs_astana_${transliterate(d)}`,
    password: "uchs123",
    fullName: `УЧС района "${d}"`,
    role: "OCHS",
    region: "г. Астана",
    district: `район ${d}`
  });
});

// 4. ДЧС города Алматы
allUsers.push({
  username: "dchs_almaty",
  password: "dchs123",
  fullName: "ДЧС города Алматы",
  role: "DCHS",
  region: "г. Алматы",
  district: ""
});

// УЧС районов г. Алматы
const almatyDistricts = [
  "Алатауского", "Алмалинского", "Ауэзовского", "Бостандыкского",
  "Жетысуского", "Медеуского", "Наурызбайского", "Турксибского"
];
almatyDistricts.forEach(d => {
  allUsers.push({
    username: `uchs_almaty_${transliterate(d)}`,
    password: "uchs123",
    fullName: `УЧС ${d} района`,
    role: "OCHS",
    region: "г. Алматы",
    district: `${d} район`
  });
});

// 5. ДЧС города Шымкент
allUsers.push({
  username: "dchs_shymkent",
  password: "dchs123",
  fullName: "ДЧС города Шымкент",
  role: "DCHS",
  region: "г. Шымкент",
  district: ""
});

// УЧС районов г. Шымкент
const shymkentDistricts = [
  "Абайского", "Аль-Фарабийского", "Енбекшинского", "Туранского", "Каратау"
];
shymkentDistricts.forEach(d => {
  allUsers.push({
    username: `uchs_shymkent_${transliterate(d)}`,
    password: "uchs123",
    fullName: `УЧС ${d} района`,
    role: "OCHS",
    region: "г. Шымкент",
    district: `${d} район`
  });
});

// 6. ДЧС Акмолинской области
allUsers.push({
  username: "dchs_akmola",
  password: "dchs123",
  fullName: "ДЧС Акмолинской области",
  role: "DCHS",
  region: "Акмолинская область",
  district: ""
});

const akmolaUnits = [
  { name: "УЧС города Кокшетау", type: "uchs" },
  { name: "ОЧС Жаркаинского района", type: "ochs" },
  { name: "ОЧС Аккольского района", type: "ochs" },
  { name: "ОЧС Аршалинского района", type: "ochs" },
  { name: "ОЧС Астраханского района", type: "ochs" },
  { name: "ОЧС Атбасарского района", type: "ochs" },
  { name: "ОЧС района Биржан сал", type: "ochs" },
  { name: "ОЧС Буландынского района", type: "ochs" },
  { name: "ОЧС Бурабайского района", type: "ochs" },
  { name: "ОЧС Егиндыкольского района", type: "ochs" },
  { name: "ОЧС Ерейментауского района", type: "ochs" },
  { name: "ОЧС Есильского района", type: "ochs" },
  { name: "ОЧС Жаксынского района", type: "ochs" },
  { name: "ОЧС Зерендинского района", type: "ochs" },
  { name: "ОЧС Коргалжынского района", type: "ochs" },
  { name: "ОЧС города Косшы", type: "ochs" },
  { name: "ОЧС Сандыктауского района", type: "ochs" },
  { name: "УЧС города Степногорска", type: "uchs" },
  { name: "ОЧС Целиноградского района", type: "ochs" },
  { name: "ОЧС Шортандинского района", type: "ochs" }
];
akmolaUnits.forEach((u, i) => {
  allUsers.push({
    username: `${u.type}_akmola_${i + 1}`,
    password: `${u.type}123`,
    fullName: u.name,
    role: "OCHS",
    region: "Акмолинская область",
    district: u.name.replace(/^[УО]ЧС /, "")
  });
});

// 7. ДЧС Актюбинской области
allUsers.push({
  username: "dchs_aktobe",
  password: "dchs123",
  fullName: "ДЧС Актюбинской области",
  role: "DCHS",
  region: "Актюбинская область",
  district: ""
});

const aktobeUnits = [
  "УЧС города Актобе", "ОЧС Айтекебийского района", "ОЧС Алгинского района",
  "ОЧС Байганинского района", "ОЧС Иргизского района", "ОЧС Каргалинского района",
  "ОЧС Кобдинского района", "ОЧС Мартукского района", "ОЧС Мугалжарского района",
  "ОЧС Темирского района", "ОЧС Уилского района", "ОЧС Хромтауского района",
  "ОЧС Шалкарского района"
];
aktobeUnits.forEach((name, i) => {
  const type = name.startsWith("УЧС") ? "uchs" : "ochs";
  allUsers.push({
    username: `${type}_aktobe_${i + 1}`,
    password: `${type}123`,
    fullName: name,
    role: "OCHS",
    region: "Актюбинская область",
    district: name.replace(/^[УО]ЧС /, "")
  });
});

// 8. ДЧС Алматинской области
allUsers.push({
  username: "dchs_almaty_obl",
  password: "dchs123",
  fullName: "ДЧС Алматинской области",
  role: "DCHS",
  region: "Алматинская область",
  district: ""
});

const almatyOblUnits = [
  "ОЧС г.Алатау", "ОЧС Карасайского района", "ОЧС Талгарского района",
  "ОЧС Райымбекского района", "ОЧС Жамбылского района", "ОЧС Енбекшиказахского района",
  "ОЧС Илийского района", "ОЧС Кегенского района", "ОЧС Балхашского района",
  "ОЧС Уйгурского района", "УЧС г.Конаев"
];
almatyOblUnits.forEach((name, i) => {
  const type = name.startsWith("УЧС") ? "uchs" : "ochs";
  allUsers.push({
    username: `${type}_almaty_obl_${i + 1}`,
    password: `${type}123`,
    fullName: name,
    role: "OCHS",
    region: "Алматинская область",
    district: name.replace(/^[УО]ЧС /, "")
  });
});

// 9. ДЧС Атырауской области
allUsers.push({
  username: "dchs_atyrau",
  password: "dchs123",
  fullName: "ДЧС Атырауской области",
  role: "DCHS",
  region: "Атырауская область",
  district: ""
});

const atyrauUnits = [
  "УЧС города Атырау", "ОЧС Жылыойского района", "ОЧС Индерского района",
  "ОЧС Исатайского района", "ОЧС Курмангазинского района", "ОЧС Кызылкогинского района",
  "ОЧС Макатского района", "ОЧС Махамбетского района"
];
atyrauUnits.forEach((name, i) => {
  const type = name.startsWith("УЧС") ? "uchs" : "ochs";
  allUsers.push({
    username: `${type}_atyrau_${i + 1}`,
    password: `${type}123`,
    fullName: name,
    role: "OCHS",
    region: "Атырауская область",
    district: name.replace(/^[УО]ЧС /, "")
  });
});

// 10. ДЧС ВКО
allUsers.push({
  username: "dchs_vko",
  password: "dchs123",
  fullName: "ДЧС ВКО",
  role: "DCHS",
  region: "Восточно-Казахстанская область",
  district: ""
});

const vkoUnits = [
  "УЧС города Усть-Каменогорска", "ОЧС Глубоковского района", "ОЧС Зайсанского района",
  "ОЧС Катон-Карагайского района", "ОЧС Курчумского района", "ОЧС района Самар",
  "ОЧС Тарбагатайского района", "ОЧС Уланского района", "ОЧС Шемонаихинского района",
  "УЧС города Риддер", "УЧС района Алтай", "ОЧС района Маркакел", "ОЧС района Улкен Нарын"
];
vkoUnits.forEach((name, i) => {
  const type = name.startsWith("УЧС") ? "uchs" : "ochs";
  allUsers.push({
    username: `${type}_vko_${i + 1}`,
    password: `${type}123`,
    fullName: name,
    role: "OCHS",
    region: "Восточно-Казахстанская область",
    district: name.replace(/^[УО]ЧС /, "")
  });
});

// 11. ДЧС Жамбылской области
allUsers.push({
  username: "dchs_zhambyl",
  password: "dchs123",
  fullName: "ДЧС Жамбылской области",
  role: "DCHS",
  region: "Жамбылская область",
  district: ""
});

const zhambylUnits = [
  "УЧС города Тараз", "ОЧС Байзакского района", "ОЧС Жамбылского района",
  "ОЧС Жуалынского района", "ОЧС Кордайского района", "ОЧС Меркенского района",
  "ОЧС Мойынкумского района", "ОЧС района Турара Рыскулова", "ОЧС Сарысуского района",
  "ОЧС Таласского района", "ОЧС Шуского района"
];
zhambylUnits.forEach((name, i) => {
  const type = name.startsWith("УЧС") ? "uchs" : "ochs";
  allUsers.push({
    username: `${type}_zhambyl_${i + 1}`,
    password: `${type}123`,
    fullName: name,
    role: "OCHS",
    region: "Жамбылская область",
    district: name.replace(/^[УО]ЧС /, "")
  });
});

// 12. ДЧС ЗКО
allUsers.push({
  username: "dchs_zko",
  password: "dchs123",
  fullName: "ДЧС ЗКО",
  role: "DCHS",
  region: "Западно-Казахстанская область",
  district: ""
});

const zkoUnits = [
  "УЧС города Уральска", "ОЧС Акжаикского района", "ОЧС Бокейординского района",
  "ОЧС Бурлинского района", "ОЧС Жангалинского района", "ОЧС Жанибекского района",
  "ОЧС Казталовского района", "ОЧС Каратобинского района", "ОЧС района Байтерек",
  "ОЧС Сырымского района", "ОЧС Таскалинского района", "ОЧС Теректинского района",
  "ОЧС Чингирлауского района"
];
zkoUnits.forEach((name, i) => {
  const type = name.startsWith("УЧС") ? "uchs" : "ochs";
  allUsers.push({
    username: `${type}_zko_${i + 1}`,
    password: `${type}123`,
    fullName: name,
    role: "OCHS",
    region: "Западно-Казахстанская область",
    district: name.replace(/^[УО]ЧС /, "")
  });
});

// 13. ДЧС Карагандинской области
allUsers.push({
  username: "dchs_karaganda",
  password: "dchs123",
  fullName: "ДЧС Карагандинской области",
  role: "DCHS",
  region: "Карагандинская область",
  district: ""
});

const karagandaUnits = [
  "УЧС города Караганды", "ОЧС города Приозерска", "ОЧС Абайского района",
  "ОЧС Актогайского района", "ОЧС Бухар-Жырауского района", "ОЧС города Сарани",
  "ОЧС города Шахтинска", "ОЧС Каркаралинского района", "ОЧС Нуринского района",
  "ОЧС Осакаровского района", "ОЧС Шетского района", "ОЧС города Балхаша",
  "УЧС города Темиртау"
];
karagandaUnits.forEach((name, i) => {
  const type = name.startsWith("УЧС") ? "uchs" : "ochs";
  allUsers.push({
    username: `${type}_karaganda_${i + 1}`,
    password: `${type}123`,
    fullName: name,
    role: "OCHS",
    region: "Карагандинская область",
    district: name.replace(/^[УО]ЧС /, "")
  });
});

// 14. ДЧС Костанайской области
allUsers.push({
  username: "dchs_kostanay",
  password: "dchs123",
  fullName: "ДЧС Костанайской области",
  role: "DCHS",
  region: "Костанайская область",
  district: ""
});

const kostanayUnits = [
  "УЧС города Костанай", "ОЧС Узункольского района", "ОЧС Алтынсаринского района",
  "ОЧС Амангельдинского района", "УЧС города Аркалыка", "ОЧС Аулиекольского района",
  "ОЧС Денисовского района", "ОЧС Жангельдинского района", "ОЧС Житикаринского района",
  "ОЧС Камыстинского района", "ОЧС Карабалыкского района", "ОЧС Карасуского района",
  "ОЧС Костанайского района", "ОЧС города Лисаковска", "ОЧС района Беимбета Майлина",
  "ОЧС Мендыкаринского района", "ОЧС Наурзумского района", "УЧС города Рудный",
  "ОЧС Сарыкольского района", "ОЧС Федоровского района"
];
kostanayUnits.forEach((name, i) => {
  const type = name.startsWith("УЧС") ? "uchs" : "ochs";
  allUsers.push({
    username: `${type}_kostanay_${i + 1}`,
    password: `${type}123`,
    fullName: name,
    role: "OCHS",
    region: "Костанайская область",
    district: name.replace(/^[УО]ЧС /, "")
  });
});

// 15. ДЧС Кызылординской области
allUsers.push({
  username: "dchs_kyzylorda",
  password: "dchs123",
  fullName: "ДЧС Кызылординской области",
  role: "DCHS",
  region: "Кызылординская область",
  district: ""
});

const kyzylordaUnits = [
  "УЧС города Кызылорды", "ОЧС Аральского района", "ОЧС Жалагашского района",
  "ОЧС Жанакорганского района", "ОЧС Казалинского района", "ОЧС Кармакшинского района",
  "ОЧС Сырдарьинского района", "ОЧС Шиелийского района"
];
kyzylordaUnits.forEach((name, i) => {
  const type = name.startsWith("УЧС") ? "uchs" : "ochs";
  allUsers.push({
    username: `${type}_kyzylorda_${i + 1}`,
    password: `${type}123`,
    fullName: name,
    role: "OCHS",
    region: "Кызылординская область",
    district: name.replace(/^[УО]ЧС /, "")
  });
});

// 16. ДЧС Мангистауской области
allUsers.push({
  username: "dchs_mangystau",
  password: "dchs123",
  fullName: "ДЧС Мангистауской области",
  role: "DCHS",
  region: "Мангистауская область",
  district: ""
});

const mangystauUnits = [
  "УЧС города Актау", "ОЧС Бейнеуского района", "ОЧС города Жанаозен",
  "ОЧС Каракиянского района", "ОЧС Мангистауского района", "ОЧС Мунайлинского района",
  "ОЧС Тупкараганского района"
];
mangystauUnits.forEach((name, i) => {
  const type = name.startsWith("УЧС") ? "uchs" : "ochs";
  allUsers.push({
    username: `${type}_mangystau_${i + 1}`,
    password: `${type}123`,
    fullName: name,
    role: "OCHS",
    region: "Мангистауская область",
    district: name.replace(/^[УО]ЧС /, "")
  });
});

// 17. ДЧС Павлодарской области
allUsers.push({
  username: "dchs_pavlodar",
  password: "dchs123",
  fullName: "ДЧС Павлодарской области",
  role: "DCHS",
  region: "Павлодарская область",
  district: ""
});

const pavlodarUnits = [
  "УЧС города Павлодар", "ОЧС Актогайского района", "ОЧС Баянаульского района",
  "ОЧС города Аксу", "ОЧС Железинского района", "ОЧС Иртышского района",
  "ОЧС Майского района", "ОЧС Павлодарского района", "ОЧС района Аккулы",
  "ОЧС района Теренкел", "ОЧС Успенского района", "ОЧС Щербактинского района",
  "УЧС города Экибастуза"
];
pavlodarUnits.forEach((name, i) => {
  const type = name.startsWith("УЧС") ? "uchs" : "ochs";
  allUsers.push({
    username: `${type}_pavlodar_${i + 1}`,
    password: `${type}123`,
    fullName: name,
    role: "OCHS",
    region: "Павлодарская область",
    district: name.replace(/^[УО]ЧС /, "")
  });
});

// 18. ДЧС СКО
allUsers.push({
  username: "dchs_sko",
  password: "dchs123",
  fullName: "ДЧС СКО",
  role: "DCHS",
  region: "Северо-Казахстанская область",
  district: ""
});

const skoUnits = [
  "УЧС города Петропавловск", "ОЧС Айыртауского района", "ОЧС Акжарского района",
  "ОЧС Аккайынского района", "ОЧС района имени Габита Мусрепова", "ОЧС Есильского района",
  "ОЧС Жамбылского района", "ОЧС района Магжана Жумабаева", "ОЧС Кызылжарского района",
  "ОЧС Мамлютского района", "ОЧС Тайыншинского района", "ОЧС Тимирязевского района",
  "ОЧС Уалихановского района", "ОЧС района имени Шал акына"
];
skoUnits.forEach((name, i) => {
  const type = name.startsWith("УЧС") ? "uchs" : "ochs";
  allUsers.push({
    username: `${type}_sko_${i + 1}`,
    password: `${type}123`,
    fullName: name,
    role: "OCHS",
    region: "Северо-Казахстанская область",
    district: name.replace(/^[УО]ЧС /, "")
  });
});

// 19. ДЧС Туркестанской области
allUsers.push({
  username: "dchs_turkestan",
  password: "dchs123",
  fullName: "ДЧС Туркестанской области",
  role: "DCHS",
  region: "Туркестанская область",
  district: ""
});

const turkestanUnits = [
  "УЧС города Туркестана", "ОЧС Арысского района", "ОЧС Байдибекского района",
  "ОЧС города Кентау", "ОЧС Жетысайского района", "ОЧС Казыгуртского района",
  "ОЧС Келесского района", "ОЧС Мактааральского района", "ОЧС Ордабасинского района",
  "ОЧС Отрарского района", "ОЧС района Сауран", "УЧС Сайрамского района",
  "ОЧС Сарыагашского района", "ОЧС Созакского района", "ОЧС Толебийского района",
  "ОЧС Тюлькубасского района", "ОЧС Шардаринского района"
];
turkestanUnits.forEach((name, i) => {
  const type = name.startsWith("УЧС") ? "uchs" : "ochs";
  allUsers.push({
    username: `${type}_turkestan_${i + 1}`,
    password: `${type}123`,
    fullName: name,
    role: "OCHS",
    region: "Туркестанская область",
    district: name.replace(/^[УО]ЧС /, "")
  });
});

// 20. ДЧС области Абай
allUsers.push({
  username: "dchs_abay",
  password: "dchs123",
  fullName: "ДЧС области Абай",
  role: "DCHS",
  region: "Область Абай",
  district: ""
});

const abayUnits = [
  "УЧС города Семей", "ОЧС Абайского района", "ОЧС района Аксуат",
  "ОЧС Аягозского района", "ОЧС Бескарагайского района", "ОЧС Бородулихинского района",
  "ОЧС Жарминского района", "ОЧС Кокпектинского района", "ОЧС города Курчатова",
  "ОЧС района Маканшы", "ОЧС района Жанасемей", "ОЧС Урджарского района"
];
abayUnits.forEach((name, i) => {
  const type = name.startsWith("УЧС") ? "uchs" : "ochs";
  allUsers.push({
    username: `${type}_abay_${i + 1}`,
    password: `${type}123`,
    fullName: name,
    role: "OCHS",
    region: "Область Абай",
    district: name.replace(/^[УО]ЧС /, "")
  });
});

// 21. ДЧС области Жетісу
allUsers.push({
  username: "dchs_zhetisu",
  password: "dchs123",
  fullName: "ДЧС области Жетісу",
  role: "DCHS",
  region: "Область Жетісу",
  district: ""
});

const zhetisuUnits = [
  "ОЧС Аксуского района", "ОЧС Алакольского района", "УЧС города Талдыкоргана",
  "ОЧС города Текели", "ОЧС Ескельдинского района", "ОЧС Каратальского района",
  "ОЧС Кербулакского района", "ОЧС Коксуского района", "ОЧС Панфиловского района",
  "ОЧС Сарканского района"
];
zhetisuUnits.forEach((name, i) => {
  const type = name.startsWith("УЧС") ? "uchs" : "ochs";
  allUsers.push({
    username: `${type}_zhetisu_${i + 1}`,
    password: `${type}123`,
    fullName: name,
    role: "OCHS",
    region: "Область Жетісу",
    district: name.replace(/^[УО]ЧС /, "")
  });
});

// 22. ДЧС области Ұлытау
allUsers.push({
  username: "dchs_ulytau",
  password: "dchs123",
  fullName: "ДЧС области Ұлытау",
  role: "DCHS",
  region: "Область Ұлытау",
  district: ""
});

const ulytauUnits = [
  "УЧС города Жезказгана", "ОЧС города Караджала", "ОЧС города Саттаева",
  "ОЧС Ұлытауского района", "ОЧС Жанааркинского района"
];
ulytauUnits.forEach((name, i) => {
  const type = name.startsWith("УЧС") ? "uchs" : "ochs";
  allUsers.push({
    username: `${type}_ulytau_${i + 1}`,
    password: `${type}123`,
    fullName: name,
    role: "OCHS",
    region: "Область Ұлытау",
    district: name.replace(/^[УО]ЧС /, "")
  });
});

function transliterate(text: string): string {
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'қ': 'q', 'ү': 'u', 'ұ': 'u', 'ң': 'n', 'ғ': 'g', 'ә': 'a', 'і': 'i',
    'ө': 'o', 'һ': 'h', '-': '_', ' ': '_', '.': ''
  };
  return text.toLowerCase().split('').map(c => map[c] || c).join('').replace(/[^a-z0-9_]/g, '');
}

async function createAllUsers() {
  console.log(`Создание ${allUsers.length} пользователей...`);
  
  let created = 0;
  for (const userData of allUsers) {
    try {
      const hashedPassword = await hashPassword(userData.password);
      await db.insert(users).values({
        username: userData.username,
        password: hashedPassword,
        fullName: userData.fullName,
        role: userData.role as any,
        region: userData.region,
        district: userData.district
      });
      created++;
      if (created % 50 === 0) {
        console.log(`Создано ${created} пользователей...`);
      }
    } catch (err: any) {
      console.error(`Ошибка создания ${userData.username}: ${err.message}`);
    }
  }
  
  // Статистика
  const admins = allUsers.filter(u => u.role === 'admin').length;
  const mchs = allUsers.filter(u => u.role === 'MCHS').length;
  const dchs = allUsers.filter(u => u.role === 'DCHS').length;
  const ochs = allUsers.filter(u => u.role === 'OCHS').length;
  
  console.log(`\n=== ИТОГО ===`);
  console.log(`Админ: ${admins}`);
  console.log(`МЧС: ${mchs}`);
  console.log(`ДЧС: ${dchs}`);
  console.log(`УЧС/ОЧС: ${ochs}`);
  console.log(`ВСЕГО: ${allUsers.length}`);
  
  process.exit(0);
}

createAllUsers().catch(console.error);
