# Grid
Grid drawing website.

## Install
Install node modules.
```bash
npm install
```

Copy `.env.example` to `.env` and adjust values.

## Tailwind css
Make tailwind components in `views/css/tailwindcss.css`.

When using new tailwind classes, run this to update the css file.
```bash
npx tailwindcss -i ./views/css/tailwindcss.css -o public/css/tailwind.css
```