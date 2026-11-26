This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Habit and device tracking

The daily forms are split between `/habits` and `/devices`. Device values are entered manually; this PWA does not read phone sensors or screen-time data. The old `/today` URL redirects to `/habits`.

## Dashboard

The dashboard prioritizes habit metrics and compares this week with the same days of the previous week. It includes a screen-time versus sleep-quality scatter plot and a category donut for social media, video, gaming, and work screen time.

Device-category durations are entered manually in minutes. Existing entries without the new category fields remain valid and appear in the category chart once those values are recorded.

Push reminders are no longer part of the app. If an earlier deployment created QStash schedules, cancel the `daily-reminder-*` schedules in the Upstash console and remove the old VAPID/QStash environment variables, including `APP_URL` if it was only used for reminders. The service worker unregisters itself when an existing installation next visits the app.
