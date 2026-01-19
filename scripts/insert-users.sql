-- Создание пользователей МЧС РК
-- 1 админ, 1 МЧС, 20 ДЧС, 227 УЧС/ОЧС

-- Очистка старых данных
DELETE FROM users;

-- Пароль "test123" с хешем (для простоты используем простой bcrypt хеш)
-- Для продакшена нужно заменить на реальные хеши

-- 1. Администратор системы
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'admin', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'Администратор системы', 'admin', '', '', true);

-- 2. МЧС РК (центральный аппарат)
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'mchs', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'МЧС Республики Казахстан', 'MCHS', '', '', true);

-- 3. ДЧС города Астана
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'dchs_astana', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ДЧС города Астана', 'DCHS', 'г. Астана', '', true);

-- УЧС районов г. Астана
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active) VALUES
(gen_random_uuid()::text, 'uchs_astana_1', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС района "Алматы"', 'OCHS', 'г. Астана', 'район Алматы', true),
(gen_random_uuid()::text, 'uchs_astana_2', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС района "Байконыр"', 'OCHS', 'г. Астана', 'район Байконыр', true),
(gen_random_uuid()::text, 'uchs_astana_3', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС района "Есиль"', 'OCHS', 'г. Астана', 'район Есиль', true),
(gen_random_uuid()::text, 'uchs_astana_4', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС района "Нура"', 'OCHS', 'г. Астана', 'район Нура', true),
(gen_random_uuid()::text, 'uchs_astana_5', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС района "Сарыарка"', 'OCHS', 'г. Астана', 'район Сарыарка', true),
(gen_random_uuid()::text, 'uchs_astana_6', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС района "Сарайшык"', 'OCHS', 'г. Астана', 'район Сарайшык', true);

-- 4. ДЧС города Алматы
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'dchs_almaty', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ДЧС города Алматы', 'DCHS', 'г. Алматы', '', true);

-- УЧС районов г. Алматы
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active) VALUES
(gen_random_uuid()::text, 'uchs_almaty_1', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС Алатауского района', 'OCHS', 'г. Алматы', 'Алатауский район', true),
(gen_random_uuid()::text, 'uchs_almaty_2', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС Алмалинского района', 'OCHS', 'г. Алматы', 'Алмалинский район', true),
(gen_random_uuid()::text, 'uchs_almaty_3', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС Ауэзовского района', 'OCHS', 'г. Алматы', 'Ауэзовский район', true),
(gen_random_uuid()::text, 'uchs_almaty_4', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС Бостандыкского района', 'OCHS', 'г. Алматы', 'Бостандыкский район', true),
(gen_random_uuid()::text, 'uchs_almaty_5', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС Жетысуского района', 'OCHS', 'г. Алматы', 'Жетысуский район', true),
(gen_random_uuid()::text, 'uchs_almaty_6', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС Медеуского района', 'OCHS', 'г. Алматы', 'Медеуский район', true),
(gen_random_uuid()::text, 'uchs_almaty_7', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС Наурызбайского района', 'OCHS', 'г. Алматы', 'Наурызбайский район', true),
(gen_random_uuid()::text, 'uchs_almaty_8', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС Турксибского района', 'OCHS', 'г. Алматы', 'Турксибский район', true);

-- 5. ДЧС города Шымкент
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'dchs_shymkent', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ДЧС города Шымкент', 'DCHS', 'г. Шымкент', '', true);

-- УЧС районов г. Шымкент
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active) VALUES
(gen_random_uuid()::text, 'uchs_shymkent_1', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС Абайского района', 'OCHS', 'г. Шымкент', 'Абайский район', true),
(gen_random_uuid()::text, 'uchs_shymkent_2', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС Аль-Фарабийского района', 'OCHS', 'г. Шымкент', 'Аль-Фарабийский район', true),
(gen_random_uuid()::text, 'uchs_shymkent_3', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС Енбекшинского района', 'OCHS', 'г. Шымкент', 'Енбекшинский район', true),
(gen_random_uuid()::text, 'uchs_shymkent_4', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС Туранского района', 'OCHS', 'г. Шымкент', 'Туранский район', true),
(gen_random_uuid()::text, 'uchs_shymkent_5', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС района "Каратау"', 'OCHS', 'г. Шымкент', 'район Каратау', true);

-- 6. ДЧС Акмолинской области
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'dchs_akmola', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ДЧС Акмолинской области', 'DCHS', 'Акмолинская область', '', true);

INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active) VALUES
(gen_random_uuid()::text, 'uchs_akmola_1', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Кокшетау', 'OCHS', 'Акмолинская область', 'город Кокшетау', true),
(gen_random_uuid()::text, 'ochs_akmola_2', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Жаркаинского района', 'OCHS', 'Акмолинская область', 'Жаркаинский район', true),
(gen_random_uuid()::text, 'ochs_akmola_3', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Аккольского района', 'OCHS', 'Акмолинская область', 'Аккольский район', true),
(gen_random_uuid()::text, 'ochs_akmola_4', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Аршалинского района', 'OCHS', 'Акмолинская область', 'Аршалинский район', true),
(gen_random_uuid()::text, 'ochs_akmola_5', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Астраханского района', 'OCHS', 'Акмолинская область', 'Астраханский район', true),
(gen_random_uuid()::text, 'ochs_akmola_6', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Атбасарского района', 'OCHS', 'Акмолинская область', 'Атбасарский район', true),
(gen_random_uuid()::text, 'ochs_akmola_7', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС района Биржан сал', 'OCHS', 'Акмолинская область', 'район Биржан сал', true),
(gen_random_uuid()::text, 'ochs_akmola_8', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Буландынского района', 'OCHS', 'Акмолинская область', 'Буландынский район', true),
(gen_random_uuid()::text, 'ochs_akmola_9', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Бурабайского района', 'OCHS', 'Акмолинская область', 'Бурабайский район', true),
(gen_random_uuid()::text, 'ochs_akmola_10', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Егиндыкольского района', 'OCHS', 'Акмолинская область', 'Егиндыкольский район', true),
(gen_random_uuid()::text, 'ochs_akmola_11', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Ерейментауского района', 'OCHS', 'Акмолинская область', 'Ерейментауский район', true),
(gen_random_uuid()::text, 'ochs_akmola_12', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Есильского района', 'OCHS', 'Акмолинская область', 'Есильский район', true),
(gen_random_uuid()::text, 'ochs_akmola_13', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Жаксынского района', 'OCHS', 'Акмолинская область', 'Жаксынский район', true),
(gen_random_uuid()::text, 'ochs_akmola_14', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Зерендинского района', 'OCHS', 'Акмолинская область', 'Зерендинский район', true),
(gen_random_uuid()::text, 'ochs_akmola_15', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Коргалжынского района', 'OCHS', 'Акмолинская область', 'Коргалжынский район', true),
(gen_random_uuid()::text, 'ochs_akmola_16', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС города Косшы', 'OCHS', 'Акмолинская область', 'город Косшы', true),
(gen_random_uuid()::text, 'ochs_akmola_17', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Сандыктауского района', 'OCHS', 'Акмолинская область', 'Сандыктауский район', true),
(gen_random_uuid()::text, 'uchs_akmola_18', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Степногорска', 'OCHS', 'Акмолинская область', 'город Степногорск', true),
(gen_random_uuid()::text, 'ochs_akmola_19', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Целиноградского района', 'OCHS', 'Акмолинская область', 'Целиноградский район', true),
(gen_random_uuid()::text, 'ochs_akmola_20', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Шортандинского района', 'OCHS', 'Акмолинская область', 'Шортандинский район', true);

-- 7. ДЧС Актюбинской области
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'dchs_aktobe', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ДЧС Актюбинской области', 'DCHS', 'Актюбинская область', '', true);

INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active) VALUES
(gen_random_uuid()::text, 'uchs_aktobe_1', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Актобе', 'OCHS', 'Актюбинская область', 'город Актобе', true),
(gen_random_uuid()::text, 'ochs_aktobe_2', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Айтекебийского района', 'OCHS', 'Актюбинская область', 'Айтекебийский район', true),
(gen_random_uuid()::text, 'ochs_aktobe_3', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Алгинского района', 'OCHS', 'Актюбинская область', 'Алгинский район', true),
(gen_random_uuid()::text, 'ochs_aktobe_4', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Байганинского района', 'OCHS', 'Актюбинская область', 'Байганинский район', true),
(gen_random_uuid()::text, 'ochs_aktobe_5', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Иргизского района', 'OCHS', 'Актюбинская область', 'Иргизский район', true),
(gen_random_uuid()::text, 'ochs_aktobe_6', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Каргалинского района', 'OCHS', 'Актюбинская область', 'Каргалинский район', true),
(gen_random_uuid()::text, 'ochs_aktobe_7', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Кобдинского района', 'OCHS', 'Актюбинская область', 'Кобдинский район', true),
(gen_random_uuid()::text, 'ochs_aktobe_8', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Мартукского района', 'OCHS', 'Актюбинская область', 'Мартукский район', true),
(gen_random_uuid()::text, 'ochs_aktobe_9', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Мугалжарского района', 'OCHS', 'Актюбинская область', 'Мугалжарский район', true),
(gen_random_uuid()::text, 'ochs_aktobe_10', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Темирского района', 'OCHS', 'Актюбинская область', 'Темирский район', true),
(gen_random_uuid()::text, 'ochs_aktobe_11', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Уилского района', 'OCHS', 'Актюбинская область', 'Уилский район', true),
(gen_random_uuid()::text, 'ochs_aktobe_12', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Хромтауского района', 'OCHS', 'Актюбинская область', 'Хромтауский район', true),
(gen_random_uuid()::text, 'ochs_aktobe_13', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Шалкарского района', 'OCHS', 'Актюбинская область', 'Шалкарский район', true);

-- 8. ДЧС Алматинской области
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'dchs_almaty_obl', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ДЧС Алматинской области', 'DCHS', 'Алматинская область', '', true);

INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active) VALUES
(gen_random_uuid()::text, 'ochs_almaty_obl_1', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС г.Алатау', 'OCHS', 'Алматинская область', 'г.Алатау', true),
(gen_random_uuid()::text, 'ochs_almaty_obl_2', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Карасайского района', 'OCHS', 'Алматинская область', 'Карасайский район', true),
(gen_random_uuid()::text, 'ochs_almaty_obl_3', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Талгарского района', 'OCHS', 'Алматинская область', 'Талгарский район', true),
(gen_random_uuid()::text, 'ochs_almaty_obl_4', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Райымбекского района', 'OCHS', 'Алматинская область', 'Райымбекский район', true),
(gen_random_uuid()::text, 'ochs_almaty_obl_5', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Жамбылского района', 'OCHS', 'Алматинская область', 'Жамбылский район', true),
(gen_random_uuid()::text, 'ochs_almaty_obl_6', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Енбекшиказахского района', 'OCHS', 'Алматинская область', 'Енбекшиказахский район', true),
(gen_random_uuid()::text, 'ochs_almaty_obl_7', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Илийского района', 'OCHS', 'Алматинская область', 'Илийский район', true),
(gen_random_uuid()::text, 'ochs_almaty_obl_8', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Кегенского района', 'OCHS', 'Алматинская область', 'Кегенский район', true),
(gen_random_uuid()::text, 'ochs_almaty_obl_9', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Балхашского района', 'OCHS', 'Алматинская область', 'Балхашский район', true),
(gen_random_uuid()::text, 'ochs_almaty_obl_10', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Уйгурского района', 'OCHS', 'Алматинская область', 'Уйгурский район', true),
(gen_random_uuid()::text, 'uchs_almaty_obl_11', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС г.Конаев', 'OCHS', 'Алматинская область', 'г.Конаев', true);

-- 9. ДЧС Атырауской области
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'dchs_atyrau', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ДЧС Атырауской области', 'DCHS', 'Атырауская область', '', true);

INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active) VALUES
(gen_random_uuid()::text, 'uchs_atyrau_1', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Атырау', 'OCHS', 'Атырауская область', 'город Атырау', true),
(gen_random_uuid()::text, 'ochs_atyrau_2', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Жылыойского района', 'OCHS', 'Атырауская область', 'Жылыойский район', true),
(gen_random_uuid()::text, 'ochs_atyrau_3', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Индерского района', 'OCHS', 'Атырауская область', 'Индерский район', true),
(gen_random_uuid()::text, 'ochs_atyrau_4', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Исатайского района', 'OCHS', 'Атырауская область', 'Исатайский район', true),
(gen_random_uuid()::text, 'ochs_atyrau_5', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Курмангазинского района', 'OCHS', 'Атырауская область', 'Курмангазинский район', true),
(gen_random_uuid()::text, 'ochs_atyrau_6', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Кызылкогинского района', 'OCHS', 'Атырауская область', 'Кызылкогинский район', true),
(gen_random_uuid()::text, 'ochs_atyrau_7', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Макатского района', 'OCHS', 'Атырауская область', 'Макатский район', true),
(gen_random_uuid()::text, 'ochs_atyrau_8', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Махамбетского района', 'OCHS', 'Атырауская область', 'Махамбетский район', true);

-- 10. ДЧС ВКО
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'dchs_vko', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ДЧС ВКО', 'DCHS', 'Восточно-Казахстанская область', '', true);

INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active) VALUES
(gen_random_uuid()::text, 'uchs_vko_1', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Усть-Каменогорска', 'OCHS', 'Восточно-Казахстанская область', 'город Усть-Каменогорск', true),
(gen_random_uuid()::text, 'ochs_vko_2', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Глубоковского района', 'OCHS', 'Восточно-Казахстанская область', 'Глубоковский район', true),
(gen_random_uuid()::text, 'ochs_vko_3', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Зайсанского района', 'OCHS', 'Восточно-Казахстанская область', 'Зайсанский район', true),
(gen_random_uuid()::text, 'ochs_vko_4', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Катон-Карагайского района', 'OCHS', 'Восточно-Казахстанская область', 'Катон-Карагайский район', true),
(gen_random_uuid()::text, 'ochs_vko_5', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Курчумского района', 'OCHS', 'Восточно-Казахстанская область', 'Курчумский район', true),
(gen_random_uuid()::text, 'ochs_vko_6', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС района Самар', 'OCHS', 'Восточно-Казахстанская область', 'район Самар', true),
(gen_random_uuid()::text, 'ochs_vko_7', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Тарбагатайского района', 'OCHS', 'Восточно-Казахстанская область', 'Тарбагатайский район', true),
(gen_random_uuid()::text, 'ochs_vko_8', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Уланского района', 'OCHS', 'Восточно-Казахстанская область', 'Уланский район', true),
(gen_random_uuid()::text, 'ochs_vko_9', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Шемонаихинского района', 'OCHS', 'Восточно-Казахстанская область', 'Шемонаихинский район', true),
(gen_random_uuid()::text, 'uchs_vko_10', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Риддер', 'OCHS', 'Восточно-Казахстанская область', 'город Риддер', true),
(gen_random_uuid()::text, 'uchs_vko_11', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС района Алтай', 'OCHS', 'Восточно-Казахстанская область', 'район Алтай', true),
(gen_random_uuid()::text, 'ochs_vko_12', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС района Маркакел', 'OCHS', 'Восточно-Казахстанская область', 'район Маркакел', true),
(gen_random_uuid()::text, 'ochs_vko_13', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС района Улкен Нарын', 'OCHS', 'Восточно-Казахстанская область', 'район Улкен Нарын', true);

-- 11. ДЧС Жамбылской области
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'dchs_zhambyl', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ДЧС Жамбылской области', 'DCHS', 'Жамбылская область', '', true);

INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active) VALUES
(gen_random_uuid()::text, 'uchs_zhambyl_1', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Тараз', 'OCHS', 'Жамбылская область', 'город Тараз', true),
(gen_random_uuid()::text, 'ochs_zhambyl_2', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Байзакского района', 'OCHS', 'Жамбылская область', 'Байзакский район', true),
(gen_random_uuid()::text, 'ochs_zhambyl_3', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Жамбылского района', 'OCHS', 'Жамбылская область', 'Жамбылский район', true),
(gen_random_uuid()::text, 'ochs_zhambyl_4', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Жуалынского района', 'OCHS', 'Жамбылская область', 'Жуалынский район', true),
(gen_random_uuid()::text, 'ochs_zhambyl_5', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Кордайского района', 'OCHS', 'Жамбылская область', 'Кордайский район', true),
(gen_random_uuid()::text, 'ochs_zhambyl_6', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Меркенского района', 'OCHS', 'Жамбылская область', 'Меркенский район', true),
(gen_random_uuid()::text, 'ochs_zhambyl_7', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Мойынкумского района', 'OCHS', 'Жамбылская область', 'Мойынкумский район', true),
(gen_random_uuid()::text, 'ochs_zhambyl_8', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС района Турара Рыскулова', 'OCHS', 'Жамбылская область', 'район Турара Рыскулова', true),
(gen_random_uuid()::text, 'ochs_zhambyl_9', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Сарысуского района', 'OCHS', 'Жамбылская область', 'Сарысуский район', true),
(gen_random_uuid()::text, 'ochs_zhambyl_10', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Таласского района', 'OCHS', 'Жамбылская область', 'Таласский район', true),
(gen_random_uuid()::text, 'ochs_zhambyl_11', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Шуского района', 'OCHS', 'Жамбылская область', 'Шуский район', true);

-- 12. ДЧС ЗКО
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'dchs_zko', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ДЧС ЗКО', 'DCHS', 'Западно-Казахстанская область', '', true);

INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active) VALUES
(gen_random_uuid()::text, 'uchs_zko_1', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Уральска', 'OCHS', 'Западно-Казахстанская область', 'город Уральск', true),
(gen_random_uuid()::text, 'ochs_zko_2', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Акжаикского района', 'OCHS', 'Западно-Казахстанская область', 'Акжаикский район', true),
(gen_random_uuid()::text, 'ochs_zko_3', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Бокейординского района', 'OCHS', 'Западно-Казахстанская область', 'Бокейординский район', true),
(gen_random_uuid()::text, 'ochs_zko_4', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Бурлинского района', 'OCHS', 'Западно-Казахстанская область', 'Бурлинский район', true),
(gen_random_uuid()::text, 'ochs_zko_5', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Жангалинского района', 'OCHS', 'Западно-Казахстанская область', 'Жангалинский район', true),
(gen_random_uuid()::text, 'ochs_zko_6', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Жанибекского района', 'OCHS', 'Западно-Казахстанская область', 'Жанибекский район', true),
(gen_random_uuid()::text, 'ochs_zko_7', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Казталовского района', 'OCHS', 'Западно-Казахстанская область', 'Казталовский район', true),
(gen_random_uuid()::text, 'ochs_zko_8', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Каратобинского района', 'OCHS', 'Западно-Казахстанская область', 'Каратобинский район', true),
(gen_random_uuid()::text, 'ochs_zko_9', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС района Байтерек', 'OCHS', 'Западно-Казахстанская область', 'район Байтерек', true),
(gen_random_uuid()::text, 'ochs_zko_10', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Сырымского района', 'OCHS', 'Западно-Казахстанская область', 'Сырымский район', true),
(gen_random_uuid()::text, 'ochs_zko_11', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Таскалинского района', 'OCHS', 'Западно-Казахстанская область', 'Таскалинский район', true),
(gen_random_uuid()::text, 'ochs_zko_12', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Теректинского района', 'OCHS', 'Западно-Казахстанская область', 'Теректинский район', true),
(gen_random_uuid()::text, 'ochs_zko_13', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Чингирлауского района', 'OCHS', 'Западно-Казахстанская область', 'Чингирлауский район', true);

-- 13. ДЧС Карагандинской области
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'dchs_karaganda', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ДЧС Карагандинской области', 'DCHS', 'Карагандинская область', '', true);

INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active) VALUES
(gen_random_uuid()::text, 'uchs_karaganda_1', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Караганды', 'OCHS', 'Карагандинская область', 'город Караганды', true),
(gen_random_uuid()::text, 'ochs_karaganda_2', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС города Приозерска', 'OCHS', 'Карагандинская область', 'город Приозерск', true),
(gen_random_uuid()::text, 'ochs_karaganda_3', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Абайского района', 'OCHS', 'Карагандинская область', 'Абайский район', true),
(gen_random_uuid()::text, 'ochs_karaganda_4', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Актогайского района', 'OCHS', 'Карагандинская область', 'Актогайский район', true),
(gen_random_uuid()::text, 'ochs_karaganda_5', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Бухар-Жырауского района', 'OCHS', 'Карагандинская область', 'Бухар-Жырауский район', true),
(gen_random_uuid()::text, 'ochs_karaganda_6', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС города Сарани', 'OCHS', 'Карагандинская область', 'город Сарань', true),
(gen_random_uuid()::text, 'ochs_karaganda_7', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС города Шахтинска', 'OCHS', 'Карагандинская область', 'город Шахтинск', true),
(gen_random_uuid()::text, 'ochs_karaganda_8', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Каркаралинского района', 'OCHS', 'Карагандинская область', 'Каркаралинский район', true),
(gen_random_uuid()::text, 'ochs_karaganda_9', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Нуринского района', 'OCHS', 'Карагандинская область', 'Нуринский район', true),
(gen_random_uuid()::text, 'ochs_karaganda_10', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Осакаровского района', 'OCHS', 'Карагандинская область', 'Осакаровский район', true),
(gen_random_uuid()::text, 'ochs_karaganda_11', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Шетского района', 'OCHS', 'Карагандинская область', 'Шетский район', true),
(gen_random_uuid()::text, 'ochs_karaganda_12', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС города Балхаша', 'OCHS', 'Карагандинская область', 'город Балхаш', true),
(gen_random_uuid()::text, 'uchs_karaganda_13', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Темиртау', 'OCHS', 'Карагандинская область', 'город Темиртау', true);

-- 14. ДЧС Костанайской области
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'dchs_kostanay', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ДЧС Костанайской области', 'DCHS', 'Костанайская область', '', true);

INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active) VALUES
(gen_random_uuid()::text, 'uchs_kostanay_1', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Костанай', 'OCHS', 'Костанайская область', 'город Костанай', true),
(gen_random_uuid()::text, 'ochs_kostanay_2', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Узункольского района', 'OCHS', 'Костанайская область', 'Узункольский район', true),
(gen_random_uuid()::text, 'ochs_kostanay_3', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Алтынсаринского района', 'OCHS', 'Костанайская область', 'Алтынсаринский район', true),
(gen_random_uuid()::text, 'ochs_kostanay_4', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Амангельдинского района', 'OCHS', 'Костанайская область', 'Амангельдинский район', true),
(gen_random_uuid()::text, 'uchs_kostanay_5', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Аркалыка', 'OCHS', 'Костанайская область', 'город Аркалык', true),
(gen_random_uuid()::text, 'ochs_kostanay_6', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Аулиекольского района', 'OCHS', 'Костанайская область', 'Аулиекольский район', true),
(gen_random_uuid()::text, 'ochs_kostanay_7', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Денисовского района', 'OCHS', 'Костанайская область', 'Денисовский район', true),
(gen_random_uuid()::text, 'ochs_kostanay_8', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Жангельдинского района', 'OCHS', 'Костанайская область', 'Жангельдинский район', true),
(gen_random_uuid()::text, 'ochs_kostanay_9', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Житикаринского района', 'OCHS', 'Костанайская область', 'Житикаринский район', true),
(gen_random_uuid()::text, 'ochs_kostanay_10', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Камыстинского района', 'OCHS', 'Костанайская область', 'Камыстинский район', true),
(gen_random_uuid()::text, 'ochs_kostanay_11', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Карабалыкского района', 'OCHS', 'Костанайская область', 'Карабалыкский район', true),
(gen_random_uuid()::text, 'ochs_kostanay_12', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Карасуского района', 'OCHS', 'Костанайская область', 'Карасуский район', true),
(gen_random_uuid()::text, 'ochs_kostanay_13', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Костанайского района', 'OCHS', 'Костанайская область', 'Костанайский район', true),
(gen_random_uuid()::text, 'ochs_kostanay_14', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС города Лисаковска', 'OCHS', 'Костанайская область', 'город Лисаковск', true),
(gen_random_uuid()::text, 'ochs_kostanay_15', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС района Беимбета Майлина', 'OCHS', 'Костанайская область', 'район Беимбета Майлина', true),
(gen_random_uuid()::text, 'ochs_kostanay_16', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Мендыкаринского района', 'OCHS', 'Костанайская область', 'Мендыкаринский район', true),
(gen_random_uuid()::text, 'ochs_kostanay_17', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Наурзумского района', 'OCHS', 'Костанайская область', 'Наурзумский район', true),
(gen_random_uuid()::text, 'uchs_kostanay_18', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Рудный', 'OCHS', 'Костанайская область', 'город Рудный', true),
(gen_random_uuid()::text, 'ochs_kostanay_19', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Сарыкольского района', 'OCHS', 'Костанайская область', 'Сарыкольский район', true),
(gen_random_uuid()::text, 'ochs_kostanay_20', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Федоровского района', 'OCHS', 'Костанайская область', 'Федоровский район', true);

-- 15. ДЧС Кызылординской области
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'dchs_kyzylorda', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ДЧС Кызылординской области', 'DCHS', 'Кызылординская область', '', true);

INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active) VALUES
(gen_random_uuid()::text, 'uchs_kyzylorda_1', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Кызылорды', 'OCHS', 'Кызылординская область', 'город Кызылорда', true),
(gen_random_uuid()::text, 'ochs_kyzylorda_2', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Аральского района', 'OCHS', 'Кызылординская область', 'Аральский район', true),
(gen_random_uuid()::text, 'ochs_kyzylorda_3', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Жалагашского района', 'OCHS', 'Кызылординская область', 'Жалагашский район', true),
(gen_random_uuid()::text, 'ochs_kyzylorda_4', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Жанакорганского района', 'OCHS', 'Кызылординская область', 'Жанакорганский район', true),
(gen_random_uuid()::text, 'ochs_kyzylorda_5', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Казалинского района', 'OCHS', 'Кызылординская область', 'Казалинский район', true),
(gen_random_uuid()::text, 'ochs_kyzylorda_6', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Кармакшинского района', 'OCHS', 'Кызылординская область', 'Кармакшинский район', true),
(gen_random_uuid()::text, 'ochs_kyzylorda_7', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Сырдарьинского района', 'OCHS', 'Кызылординская область', 'Сырдарьинский район', true),
(gen_random_uuid()::text, 'ochs_kyzylorda_8', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Шиелийского района', 'OCHS', 'Кызылординская область', 'Шиелийский район', true);

-- 16. ДЧС Мангистауской области
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'dchs_mangystau', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ДЧС Мангистауской области', 'DCHS', 'Мангистауская область', '', true);

INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active) VALUES
(gen_random_uuid()::text, 'uchs_mangystau_1', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Актау', 'OCHS', 'Мангистауская область', 'город Актау', true),
(gen_random_uuid()::text, 'ochs_mangystau_2', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Бейнеуского района', 'OCHS', 'Мангистауская область', 'Бейнеуский район', true),
(gen_random_uuid()::text, 'ochs_mangystau_3', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС города Жанаозен', 'OCHS', 'Мангистауская область', 'город Жанаозен', true),
(gen_random_uuid()::text, 'ochs_mangystau_4', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Каракиянского района', 'OCHS', 'Мангистауская область', 'Каракиянский район', true),
(gen_random_uuid()::text, 'ochs_mangystau_5', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Мангистауского района', 'OCHS', 'Мангистауская область', 'Мангистауский район', true),
(gen_random_uuid()::text, 'ochs_mangystau_6', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Мунайлинского района', 'OCHS', 'Мангистауская область', 'Мунайлинский район', true),
(gen_random_uuid()::text, 'ochs_mangystau_7', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Тупкараганского района', 'OCHS', 'Мангистауская область', 'Тупкараганский район', true);

-- 17. ДЧС Павлодарской области
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'dchs_pavlodar', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ДЧС Павлодарской области', 'DCHS', 'Павлодарская область', '', true);

INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active) VALUES
(gen_random_uuid()::text, 'uchs_pavlodar_1', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Павлодар', 'OCHS', 'Павлодарская область', 'город Павлодар', true),
(gen_random_uuid()::text, 'ochs_pavlodar_2', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Актогайского района', 'OCHS', 'Павлодарская область', 'Актогайский район', true),
(gen_random_uuid()::text, 'ochs_pavlodar_3', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Баянаульского района', 'OCHS', 'Павлодарская область', 'Баянаульский район', true),
(gen_random_uuid()::text, 'ochs_pavlodar_4', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС города Аксу', 'OCHS', 'Павлодарская область', 'город Аксу', true),
(gen_random_uuid()::text, 'ochs_pavlodar_5', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Железинского района', 'OCHS', 'Павлодарская область', 'Железинский район', true),
(gen_random_uuid()::text, 'ochs_pavlodar_6', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Иртышского района', 'OCHS', 'Павлодарская область', 'Иртышский район', true),
(gen_random_uuid()::text, 'ochs_pavlodar_7', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Майского района', 'OCHS', 'Павлодарская область', 'Майский район', true),
(gen_random_uuid()::text, 'ochs_pavlodar_8', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Павлодарского района', 'OCHS', 'Павлодарская область', 'Павлодарский район', true),
(gen_random_uuid()::text, 'ochs_pavlodar_9', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС района Аккулы', 'OCHS', 'Павлодарская область', 'район Аккулы', true),
(gen_random_uuid()::text, 'ochs_pavlodar_10', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС района Теренкел', 'OCHS', 'Павлодарская область', 'район Теренкел', true),
(gen_random_uuid()::text, 'ochs_pavlodar_11', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Успенского района', 'OCHS', 'Павлодарская область', 'Успенский район', true),
(gen_random_uuid()::text, 'ochs_pavlodar_12', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Щербактинского района', 'OCHS', 'Павлодарская область', 'Щербактинский район', true),
(gen_random_uuid()::text, 'uchs_pavlodar_13', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Экибастуза', 'OCHS', 'Павлодарская область', 'город Экибастуз', true);

-- 18. ДЧС СКО
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'dchs_sko', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ДЧС СКО', 'DCHS', 'Северо-Казахстанская область', '', true);

INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active) VALUES
(gen_random_uuid()::text, 'uchs_sko_1', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Петропавловск', 'OCHS', 'Северо-Казахстанская область', 'город Петропавловск', true),
(gen_random_uuid()::text, 'ochs_sko_2', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Айыртауского района', 'OCHS', 'Северо-Казахстанская область', 'Айыртауский район', true),
(gen_random_uuid()::text, 'ochs_sko_3', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Акжарского района', 'OCHS', 'Северо-Казахстанская область', 'Акжарский район', true),
(gen_random_uuid()::text, 'ochs_sko_4', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Аккайынского района', 'OCHS', 'Северо-Казахстанская область', 'Аккайынский район', true),
(gen_random_uuid()::text, 'ochs_sko_5', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС района имени Габита Мусрепова', 'OCHS', 'Северо-Казахстанская область', 'район имени Габита Мусрепова', true),
(gen_random_uuid()::text, 'ochs_sko_6', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Есильского района', 'OCHS', 'Северо-Казахстанская область', 'Есильский район', true),
(gen_random_uuid()::text, 'ochs_sko_7', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Жамбылского района', 'OCHS', 'Северо-Казахстанская область', 'Жамбылский район', true),
(gen_random_uuid()::text, 'ochs_sko_8', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС района Магжана Жумабаева', 'OCHS', 'Северо-Казахстанская область', 'район Магжана Жумабаева', true),
(gen_random_uuid()::text, 'ochs_sko_9', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Кызылжарского района', 'OCHS', 'Северо-Казахстанская область', 'Кызылжарский район', true),
(gen_random_uuid()::text, 'ochs_sko_10', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Мамлютского района', 'OCHS', 'Северо-Казахстанская область', 'Мамлютский район', true),
(gen_random_uuid()::text, 'ochs_sko_11', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Тайыншинского района', 'OCHS', 'Северо-Казахстанская область', 'Тайыншинский район', true),
(gen_random_uuid()::text, 'ochs_sko_12', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Тимирязевского района', 'OCHS', 'Северо-Казахстанская область', 'Тимирязевский район', true),
(gen_random_uuid()::text, 'ochs_sko_13', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Уалихановского района', 'OCHS', 'Северо-Казахстанская область', 'Уалихановский район', true),
(gen_random_uuid()::text, 'ochs_sko_14', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС района имени Шал акына', 'OCHS', 'Северо-Казахстанская область', 'район имени Шал акына', true);

-- 19. ДЧС Туркестанской области
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'dchs_turkestan', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ДЧС Туркестанской области', 'DCHS', 'Туркестанская область', '', true);

INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active) VALUES
(gen_random_uuid()::text, 'uchs_turkestan_1', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Туркестана', 'OCHS', 'Туркестанская область', 'город Туркестан', true),
(gen_random_uuid()::text, 'ochs_turkestan_2', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Арысского района', 'OCHS', 'Туркестанская область', 'Арысский район', true),
(gen_random_uuid()::text, 'ochs_turkestan_3', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Байдибекского района', 'OCHS', 'Туркестанская область', 'Байдибекский район', true),
(gen_random_uuid()::text, 'ochs_turkestan_4', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС города Кентау', 'OCHS', 'Туркестанская область', 'город Кентау', true),
(gen_random_uuid()::text, 'ochs_turkestan_5', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Жетысайского района', 'OCHS', 'Туркестанская область', 'Жетысайский район', true),
(gen_random_uuid()::text, 'ochs_turkestan_6', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Казыгуртского района', 'OCHS', 'Туркестанская область', 'Казыгуртский район', true),
(gen_random_uuid()::text, 'ochs_turkestan_7', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Келесского района', 'OCHS', 'Туркестанская область', 'Келесский район', true),
(gen_random_uuid()::text, 'ochs_turkestan_8', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Мактааральского района', 'OCHS', 'Туркестанская область', 'Мактааральский район', true),
(gen_random_uuid()::text, 'ochs_turkestan_9', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Ордабасинского района', 'OCHS', 'Туркестанская область', 'Ордабасинский район', true),
(gen_random_uuid()::text, 'ochs_turkestan_10', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Отрарского района', 'OCHS', 'Туркестанская область', 'Отрарский район', true),
(gen_random_uuid()::text, 'ochs_turkestan_11', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС района Сауран', 'OCHS', 'Туркестанская область', 'район Сауран', true),
(gen_random_uuid()::text, 'uchs_turkestan_12', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС Сайрамского района', 'OCHS', 'Туркестанская область', 'Сайрамский район', true),
(gen_random_uuid()::text, 'ochs_turkestan_13', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Сарыагашского района', 'OCHS', 'Туркестанская область', 'Сарыагашский район', true),
(gen_random_uuid()::text, 'ochs_turkestan_14', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Созакского района', 'OCHS', 'Туркестанская область', 'Созакский район', true),
(gen_random_uuid()::text, 'ochs_turkestan_15', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Толебийского района', 'OCHS', 'Туркестанская область', 'Толебийский район', true),
(gen_random_uuid()::text, 'ochs_turkestan_16', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Тюлькубасского района', 'OCHS', 'Туркестанская область', 'Тюлькубасский район', true),
(gen_random_uuid()::text, 'ochs_turkestan_17', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Шардаринского района', 'OCHS', 'Туркестанская область', 'Шардаринский район', true);

-- 20. ДЧС области Абай
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'dchs_abay', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ДЧС области Абай', 'DCHS', 'Область Абай', '', true);

INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active) VALUES
(gen_random_uuid()::text, 'uchs_abay_1', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Семей', 'OCHS', 'Область Абай', 'город Семей', true),
(gen_random_uuid()::text, 'ochs_abay_2', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Абайского района', 'OCHS', 'Область Абай', 'Абайский район', true),
(gen_random_uuid()::text, 'ochs_abay_3', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС района Аксуат', 'OCHS', 'Область Абай', 'район Аксуат', true),
(gen_random_uuid()::text, 'ochs_abay_4', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Аягозского района', 'OCHS', 'Область Абай', 'Аягозский район', true),
(gen_random_uuid()::text, 'ochs_abay_5', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Бескарагайского района', 'OCHS', 'Область Абай', 'Бескарагайский район', true),
(gen_random_uuid()::text, 'ochs_abay_6', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Бородулихинского района', 'OCHS', 'Область Абай', 'Бородулихинский район', true),
(gen_random_uuid()::text, 'ochs_abay_7', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Жарминского района', 'OCHS', 'Область Абай', 'Жарминский район', true),
(gen_random_uuid()::text, 'ochs_abay_8', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Кокпектинского района', 'OCHS', 'Область Абай', 'Кокпектинский район', true),
(gen_random_uuid()::text, 'ochs_abay_9', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС города Курчатова', 'OCHS', 'Область Абай', 'город Курчатов', true),
(gen_random_uuid()::text, 'ochs_abay_10', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС района Маканшы', 'OCHS', 'Область Абай', 'район Маканшы', true),
(gen_random_uuid()::text, 'ochs_abay_11', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС района Жанасемей', 'OCHS', 'Область Абай', 'район Жанасемей', true),
(gen_random_uuid()::text, 'ochs_abay_12', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Урджарского района', 'OCHS', 'Область Абай', 'Урджарский район', true);

-- 21. ДЧС области Жетісу
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'dchs_zhetisu', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ДЧС области Жетісу', 'DCHS', 'Область Жетісу', '', true);

INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active) VALUES
(gen_random_uuid()::text, 'ochs_zhetisu_1', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Аксуского района', 'OCHS', 'Область Жетісу', 'Аксуский район', true),
(gen_random_uuid()::text, 'ochs_zhetisu_2', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Алакольского района', 'OCHS', 'Область Жетісу', 'Алакольский район', true),
(gen_random_uuid()::text, 'uchs_zhetisu_3', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Талдыкоргана', 'OCHS', 'Область Жетісу', 'город Талдыкорган', true),
(gen_random_uuid()::text, 'ochs_zhetisu_4', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС города Текели', 'OCHS', 'Область Жетісу', 'город Текели', true),
(gen_random_uuid()::text, 'ochs_zhetisu_5', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Ескельдинского района', 'OCHS', 'Область Жетісу', 'Ескельдинский район', true),
(gen_random_uuid()::text, 'ochs_zhetisu_6', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Каратальского района', 'OCHS', 'Область Жетісу', 'Каратальский район', true),
(gen_random_uuid()::text, 'ochs_zhetisu_7', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Кербулакского района', 'OCHS', 'Область Жетісу', 'Кербулакский район', true),
(gen_random_uuid()::text, 'ochs_zhetisu_8', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Коксуского района', 'OCHS', 'Область Жетісу', 'Коксуский район', true),
(gen_random_uuid()::text, 'ochs_zhetisu_9', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Панфиловского района', 'OCHS', 'Область Жетісу', 'Панфиловский район', true),
(gen_random_uuid()::text, 'ochs_zhetisu_10', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Сарканского района', 'OCHS', 'Область Жетісу', 'Сарканский район', true);

-- 22. ДЧС области Ұлытау
INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active)
VALUES (gen_random_uuid()::text, 'dchs_ulytau', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ДЧС области Ұлытау', 'DCHS', 'Область Ұлытау', '', true);

INSERT INTO users (id, username, password_hash, full_name, role, region, district, is_active) VALUES
(gen_random_uuid()::text, 'uchs_ulytau_1', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'УЧС города Жезказгана', 'OCHS', 'Область Ұлытау', 'город Жезказган', true),
(gen_random_uuid()::text, 'ochs_ulytau_2', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС города Караджала', 'OCHS', 'Область Ұлытау', 'город Караджал', true),
(gen_random_uuid()::text, 'ochs_ulytau_3', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС города Саттаева', 'OCHS', 'Область Ұлытау', 'город Саттаев', true),
(gen_random_uuid()::text, 'ochs_ulytau_4', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Ұлытауского района', 'OCHS', 'Область Ұлытау', 'Ұлытауский район', true),
(gen_random_uuid()::text, 'ochs_ulytau_5', 'fc1c24d4eae91aa58ea6e6f4d1970e1c6b0e426a0c4d32f7ddbc4ec8b4b5a0e7.4f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c', 'ОЧС Жанааркинского района', 'OCHS', 'Область Ұлытау', 'Жанааркинский район', true);
