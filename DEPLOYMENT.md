# Публикация SelfMap

Репозиторий: https://github.com/visnulya/selfmap

Адрес после публикации: https://visnulya.github.io/selfmap/

## Первая отправка

1. Проверить подготовленные файлы командой `npm run check:publication` и production-сборку `npm run build`.
2. Получить подтверждение пользователя на подключение remote и первую отправку.
3. Снова проверить удалённую историю. При наличии новых коммитов сначала получить и согласовать их; не перезаписывать удалённую ветку.
4. Подключить `origin` к `https://github.com/visnulya/selfmap.git`, создать коммит с реальной настроенной Git-идентичностью и выполнить обычный `git push -u origin main`. Не использовать `--force`.
5. В репозитории открыть Settings → Pages и выбрать Source: **GitHub Actions**. Для изменения настройки нужен доступ к настройкам репозитория. Пароли и токены не записывать в исходники, URL remote или workflow.
6. Открыть Actions → Deploy SelfMap to GitHub Pages и дождаться успешного выполнения build и deploy. При необходимости повторить через Run workflow.
7. Проверить публичный адрес, изображения, шрифты, пять эффектов и Дзен. До этой проверки публичный сайт не считается опубликованным и проверенным.

## Автоматическое обновление

Workflow реагирует на push в `main`, устанавливает зависимости по lock-файлу на Node.js 22, собирает Vite и передаёт `dist/` в Pages. Job сборки имеет только чтение содержимого, job публикации — разрешения Pages и OIDC. Отдельный PAT для workflow не нужен.

После согласованной правки через Codex: проверить изменения и сборку, создать коммит, выполнить обычную отправку в `main`, дождаться Actions и проверить сайт. Перед работой с уже существующей удалённой историей использовать `git fetch` и безопасное объединение; не применять force push или reset к удалённой истории.

## Проверка публичной версии через Codex

```powershell
$env:SELFMAP_URL = 'https://visnulya.github.io/selfmap/'
npm run check:production
npm run check:links
```

Первая команда сравнивает публичную выдачу ресурсов с текущими локальными оригиналами; выполнять после публикации именно этого коммита. Вторая проверяет сообщения, схему, трещину, hover, reduced motion и реальное открытие Дзена в отдельной вкладке. Отчёты остаются в `artifacts/`, а не в репозитории.

## Что хранится только локально

`node_modules/`, `dist/`, `artifacts/`, `checkpoints/`, `design/`, временные файлы, кэши и локальные секреты исключены `.gitignore`. Для сайта необходимы `src/`, `public/`, `index.html`, package-файлы и конфигурация Vite; все они должны быть в репозитории. Workflow находится в `.github/workflows/deploy.yml`.

## Официальные инструкции

- [Vite: GitHub Pages и base](https://vite.dev/guide/static-deploy.html#github-pages)
- [GitHub: публикация Pages через Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
