import type { LegalDocument } from '@/data/legal';

/**
 * Match's own terms and privacy policy, as data, in the same shape as Deck's.
 *
 * **Everything here describes what Match actually does**, taken from the code:
 * what the profile, call, report, wallet and verification records hold, that
 * voice goes browser to browser, that the selfie is deleted at the decision.
 * If a data flow or a price changes, this file changes with it.
 *
 * `{{double braces}}` mark details only the business can supply. They render
 * as loud markers and are counted at the top of the page.
 */

const EFFECTIVE = '29 October 2026';

export const MATCH_PRIVACY: LegalDocument = {
  slug: 'privacy',
  eyebrow: 'Match · Privacy',
  title: 'Privacy policy',
  summary:
    'What Match keeps about you, what it never keeps, who can see what, and how to make us delete it.',
  effective: EFFECTIVE,
  sections: [
    {
      title: 'Who we are',
      blocks: [
        {
          kind: 'p',
          text: 'Match (match.onedeck.africa) is a product of Deck, operated by {{Legal entity name}}, {{Registered address}}, registration number {{Company registration number}}. We decide how your data is used, so we are responsible for it under the Nigeria Data Protection Act 2023 and, where it applies, the GDPR.',
        },
        {
          kind: 'p',
          text: 'Questions, requests and complaints about your data go to {{Privacy contact email}}.',
        },
      ],
    },
    {
      title: 'The short version',
      blocks: [
        {
          kind: 'list',
          items: [
            'Your voice is never recorded, and it never passes through our servers. It goes straight from your browser to theirs.',
            'The person you talk to learns nothing about you except your voice — and the Verified badge, if you have it.',
            'Your X and Instagram usernames are shown to someone only if you both tap share after a call.',
            'Match runs no ads, no analytics and no tracking cookies, and we never sell your data.',
          ],
        },
      ],
    },
    {
      title: 'What we collect',
      blocks: [
        {
          kind: 'table',
          head: ['What', 'Why and when'],
          rows: [
            [
              'Your Google account id, verified email, name and picture',
              'When you sign in with Google. They are held in your Deck account so you can sign in again. Nobody on Match is ever shown them.',
            ],
            [
              'Your section (man or woman) and when you confirmed you’re 18 or over',
              'When you set up Match. We use your section to match you with the other one.',
            ],
            [
              'Your X and Instagram usernames',
              'Only if you add them. They are shown only to people you both chose to share with.',
            ],
            [
              'Call records',
              'For every call: who you were matched with, when, how long each of you waited, when the call started and ended, why it ended and who ended it, extra minutes, and who tapped share. Never the audio.',
            ],
            [
              'Reports and blocks',
              'Who reported whom, the reason, any note, and what we decided. The person reported is never told who reported them. People you report are blocked from being matched with you again.',
            ],
            ['Requests to change section', 'The note you send, if you ask us to move you.'],
            [
              'Ping settings',
              'If you turn on pings: the delivery address and keys your browser gives us for notifications, and when we last pinged you.',
            ],
            [
              'Match credit and purchases',
              'Your balance and a record of every top-up and every spend — extra minutes, gifts, themed-night entries, the Verified badge and Match+ — with its amount and date.',
            ],
            ['Your verification selfie', 'Only if you apply for the Verified badge. See below.'],
          ],
        },
        {
          kind: 'note',
          text: 'Card and bank details never reach us. Top-ups are paid on the checkout page of Bachs, our payments provider; we receive a reference, the amount and whether it succeeded.',
        },
      ],
    },
    {
      title: 'Your voice',
      blocks: [
        {
          kind: 'p',
          text: 'Calls connect your browser directly to the other person’s, encrypted, using the standard technology browsers use for video calls (WebRTC). Our server only passes the short messages that set the connection up. It never receives, hears or stores the audio, and neither does anyone at Deck.',
        },
        {
          kind: 'p',
          text: 'Because the connection is direct, each browser can see the other’s network (IP) address, which can show a rough location such as a city or an internet provider. You agree to this when you set up Match. To find a route between the two browsers, your browser also contacts Google’s public connection servers, which see your IP address for that lookup.',
        },
      ],
    },
    {
      title: 'The Verified badge selfie',
      blocks: [
        {
          kind: 'list',
          items: [
            'You take one selfie making a pose Match picks, so we can tell it is a live photo of you.',
            'It is stored privately in our own database, not with an image host, and is seen only by the Deck staff who check it.',
            'It is deleted as soon as they approve or decline it. We keep only the decision and its date.',
            'If the person in the photo appears to be under 18, the account is removed from Match.',
          ],
        },
      ],
    },
    {
      title: 'Who can see what',
      blocks: [
        {
          kind: 'list',
          items: [
            'The person you talk to: your voice during the call, the Verified badge if you have it, your usernames only if you both share, and any gift you send them.',
            'Other Match users: nothing. The lobby shows only counts of people online.',
            'Deck staff: the records above, to run Match and handle reports, payments, verification and section requests.',
          ],
        },
      ],
    },
    {
      title: 'How we use it, and our legal basis',
      blocks: [
        {
          kind: 'table',
          head: ['Use', 'Legal basis'],
          rows: [
            [
              'Matching you, running calls and opening hours, sharing usernames when you both agree',
              'To provide the service you signed up for',
            ],
            [
              'Credit, purchases and payment records',
              'To provide the service, and our legal duty to keep financial records',
            ],
            [
              'Reports, blocks, bans and keeping under-18s off Match',
              'Our legitimate interest, and yours, in keeping Match safe',
            ],
            ['Pings', 'Your consent. Turn them off at any time.'],
            ['Your verification selfie', 'Your consent, given when you take it'],
            [
              'Daily counts of people online',
              'Our legitimate interest in running Match. These are totals with no one named.',
            ],
          ],
        },
      ],
    },
    {
      title: 'Providers who handle data for us',
      blocks: [
        {
          kind: 'table',
          head: ['Provider', 'What for'],
          rows: [
            ['MongoDB Atlas', 'The database Match’s records are stored in.'],
            ['Render', 'Runs the Match server.'],
            ['Vercel', 'Serves the Match website.'],
            ['Google', 'Sign-in, and the public servers that help two browsers find each other.'],
            ['Bachs', 'Top-up payments.'],
            [
              'Your browser’s notification service (Google, Apple or Mozilla)',
              'Delivers pings, if you turn them on. A ping says only that someone is on Match.',
            ],
          ],
        },
        {
          kind: 'p',
          text: 'Some of these providers process data outside Nigeria. Where they do, we rely on their contractual safeguards for international transfers.',
        },
      ],
    },
    {
      title: 'How long we keep it',
      blocks: [
        {
          kind: 'list',
          items: [
            'Your Match profile, credit balance and usernames: until you ask us to delete your account.',
            'Call records: {{Call record retention}}.',
            'Reports and bans: {{Report retention}}, so a banned person cannot simply come back.',
            'Purchase and top-up records: {{Payment record retention}}.',
            'Your verification selfie: deleted at the decision, usually within a day.',
            'Ping delivery details: until you turn pings off, sign out of that browser, or the browser withdraws them.',
          ],
        },
      ],
    },
    {
      title: 'On your device',
      blocks: [
        {
          kind: 'p',
          text: 'Match keeps two things in your browser’s storage: your sign-in, so you stay signed in, and whether you turned the music off. It sets no cookies of its own. Signing in with Google uses one short-lived Deck cookie to check that the sign-in came back to the browser that started it, and deletes it straight away.',
        },
      ],
    },
    {
      title: 'Your rights',
      blocks: [
        {
          kind: 'p',
          text: 'You can ask us for a copy of your data, to correct it, to delete it, to stop using it for a purpose, or to send it to you in a portable form. You can withdraw consent at any time — turn pings off, or ask us to delete a selfie that has not been checked yet. Write to {{Privacy contact email}}; we reply within 30 days.',
        },
        {
          kind: 'p',
          text: 'If you are unhappy with how we handled your data, you can complain to the Nigeria Data Protection Commission (ndpc.gov.ng), or to the data protection authority where you live.',
        },
      ],
    },
    {
      title: 'Age',
      blocks: [
        {
          kind: 'p',
          text: 'Match is for people 18 and over. If we learn that someone under 18 is using it, we remove their account from Match.',
        },
      ],
    },
    {
      title: 'Changes',
      blocks: [
        {
          kind: 'p',
          text: 'If we change this policy we update the date at the top, and tell you in Match before a change that affects how your data is used takes effect.',
        },
      ],
    },
  ],
};

export const MATCH_TERMS: LegalDocument = {
  slug: 'terms',
  eyebrow: 'Match · Terms',
  title: 'Terms of use',
  summary:
    'The rules for using Match, what you pay for, and what we are and are not responsible for.',
  effective: EFFECTIVE,
  sections: [
    {
      title: 'About these terms',
      blocks: [
        {
          kind: 'p',
          text: 'Match is a product of Deck, operated by {{Legal entity name}}. By using Match you agree to these terms and to Deck’s terms of service (onedeck.africa/terms). Where the two disagree about Match, these terms apply.',
        },
      ],
    },
    {
      title: 'Who can use Match',
      blocks: [
        {
          kind: 'list',
          items: [
            'You must be 18 or older.',
            'One Match account per person, signed in with your own Google account.',
            'Choose your section honestly. Men are matched with women and women with men. You can’t switch it yourself; if you chose wrong, ask us and we’ll change it if it’s right.',
          ],
        },
      ],
    },
    {
      title: 'How Match works',
      blocks: [
        {
          kind: 'p',
          text: 'Match opens every night for set hours, Lagos time, shown on the site. You’re matched with someone online for a two-minute voice call. If you both want to keep in touch, you can each share your X or Instagram username; they are shown only if you both share. We can’t promise there will always be someone to match you with, and some networks don’t allow direct browser calls.',
        },
      ],
    },
    {
      title: 'Rules for calls',
      blocks: [
        { kind: 'p', text: 'Don’t:' },
        {
          kind: 'list',
          items: [
            'be abusive, threatening, hateful or harassing',
            'say or do anything sexually explicit, or pressure anyone for it',
            'ask for money, sell anything, or run any scam',
            'record a call, or let anyone else listen, without the other person’s agreement',
            'pretend to be someone else, or share another person’s username as your own',
            'use Match if you’re under 18, or help anyone under 18 to use it',
          ],
        },
        {
          kind: 'p',
          text: 'Reporting someone ends the call and blocks them from being matched with you again. If several people report you, your account is paused for a week. We can pause or remove any account that breaks these rules.',
        },
      ],
    },
    {
      title: 'After a call',
      blocks: [
        {
          kind: 'p',
          text: 'Once usernames are shared, what happens on X or Instagram is between you and the other person, under those platforms’ own rules. Take care when meeting someone in person: meet in a public place and tell a friend where you’ll be.',
        },
      ],
    },
    {
      title: 'Match credit',
      blocks: [
        {
          kind: 'list',
          items: [
            'Match credit is prepaid, in naira, and can only be spent on Match. It is not money, can’t be transferred to anyone else, and doesn’t expire.',
            'You buy credit through Deck’s checkout, provided by Bachs. Credit is added once the payment is confirmed.',
            'Credit isn’t refundable as cash, except where the law requires it or these terms say so.',
            'If we remove your account for breaking these terms, any credit left on it is not refunded.',
          ],
        },
      ],
    },
    {
      title: 'What credit pays for',
      blocks: [
        {
          kind: 'p',
          text: 'Prices are always shown before you pay. Today they are:',
        },
        {
          kind: 'table',
          head: ['Feature', 'How it works'],
          rows: [
            [
              'Extra minutes',
              'The first +1 minute in a call is free. After that each extra minute is ₦100 for each of you, and only charged if you both tap. If the call ends before the minute is added, you’re refunded.',
            ],
            [
              'Gifts',
              'A rose (₦200) or a drink (₦500), sent after you’ve both shared usernames. A gift is a note shown to the other person, not a real item, and can’t be refunded once sent.',
            ],
            [
              'Themed nights',
              'Some nights have a theme and an entry price, which lets you be matched that night only. Entry is for the whole night and isn’t refunded if you don’t get matched.',
            ],
            [
              'Verified badge',
              '₦500, once. A person at Deck checks one selfie. If it’s declined, the ₦500 goes back to your credit. The badge means a person matched the photo to a live pose — it is not an identity or background check.',
            ],
            [
              'Match+',
              '₦1,500 for 30 days: free extra minutes, talking until midnight, and pings whenever someone’s free. It doesn’t renew by itself; buying it again adds 30 days.',
            ],
          ],
        },
      ],
    },
    {
      title: 'Sponsored nights',
      blocks: [
        {
          kind: 'p',
          text: 'Some nights are presented by a sponsor, whose name appears in Match. Sponsors receive no information about you.',
        },
      ],
    },
    {
      title: 'Responsibility',
      blocks: [
        {
          kind: 'p',
          text: 'Match is provided as it is. We don’t check who people are, beyond the Verified badge, and we aren’t responsible for what other people say on calls or do afterwards. As far as the law allows, our total liability to you for anything to do with Match is limited to {{Liability cap}}. Nothing in these terms limits liability that the law does not allow us to limit.',
        },
      ],
    },
    {
      title: 'Ending your account',
      blocks: [
        {
          kind: 'p',
          text: 'You can stop using Match at any time and ask us to delete your account at {{Support contact email}}. We can change or close Match; if we close it, we’ll give notice in Match first.',
        },
      ],
    },
    {
      title: 'Law',
      blocks: [
        {
          kind: 'p',
          text: 'These terms are governed by {{Governing law}}, and disputes are settled by {{Courts and jurisdiction}}.',
        },
      ],
    },
    {
      title: 'Contact',
      blocks: [
        {
          kind: 'p',
          text: 'Questions about Match: {{Support contact email}}.',
        },
      ],
    },
  ],
};
