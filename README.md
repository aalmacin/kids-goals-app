# Kids Goals

This app is a Progressive Web App used for keeping track of kids goals. The app is similar to habitica for keeping track of tasks and get rewards/points. The main features are

- Login/Logout
  -- Parent login is using email + password (supabase auth)
  -- Kid login with their family, name and passcode
- Set family name (unique across app).
- Add Kid
- Each kid has name and birthday. Also kid name and passcode.
- Once logged in, the main app page shows the current date.
- For kids logged in, they can see the date and the activities they are supposed to do.
- Kids can check on tasks to indicate they completed it. They can also uncheck it if they made a mistake.
- Kids can also Pay 100 points for rest day. A verification is asked to confirm they want to pay 100 points. During rest day, only important chores are shown (examples of important chores: brush teeth, etc)
- Or specify which activities they completed.
- The parent can set whether a chore is important or not for kids.
- The kids can use their points to purchase rewards. Rewards can be going to the restaurant, going to indoor playground, etc. The parents can set these rewards.
- All the actions are kept track in an activity log. The parent and kids can view all the activities for all the kids.
- Each chore has a penalty assigned. If it was not done, the penalties will reduce the kids points. When the chores are all finished, there is a dropdown of effort that the kid can set.
- The day ending, penalties and all other things can only be assigned when a "End day" button is clicked.
- If the current date does not match the previous date, the previous dates can still be accessed through a calendar. The calendar has a marking on which dates have been completed.
- Effort can be managed by the parent and rewards for each effort can be set by the parent.
- Current points for the kid logged in can be seen on the main navbar.
- The interface looks kid friendly and fun.
- Colorful icons can be selected for the individual rewards, chores, etc.

Technologies

- Supabase (Auth, Database, Realtime)
- NextJS

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
