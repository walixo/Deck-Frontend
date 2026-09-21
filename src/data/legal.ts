/**
 * The privacy policy and the terms of service, as data.
 *
 * Kept out of the pages for two reasons. One renderer serves both documents, so
 * the contents rail, the anchor links and the typography cannot drift between
 * them. And a legal document is text that a non-developer has to be able to
 * read, correct and re-read in a diff — which is much easier when it is not
 * interleaved with JSX.
 *
 * **Everything here describes what the code actually does.** The retention
 * windows, the cookie names, the processors and the hashing are all taken from
 * the implementation, not from a template — a privacy policy that disagrees
 * with the software is worse than no policy, because it is a written statement
 * that happens to be false. If a data flow changes, this file changes with it.
 *
 * `{{double braces}}` mark details only the business can supply — the legal
 * entity, the addresses, the jurisdiction. They render as loud red markers and
 * the page counts them in a banner, so neither document can be published while
 * any remain.
 */

export type LegalBlock =
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'table'; head: [string, string]; rows: [string, string][] }
  | { kind: 'note'; text: string };

export interface LegalSection {
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  slug: string;
  eyebrow: string;
  title: string;
  summary: string;
  effective: string;
  sections: LegalSection[];
}

/* Both documents carry the same date so a reader can tell at a glance that
   they were reviewed together. Update it whenever either one changes. */
const EFFECTIVE = '19 September 2026';

/* -------------------------------------------------------------- privacy --- */

export const PRIVACY_POLICY: LegalDocument = {
  slug: 'privacy',
  eyebrow: 'Privacy',
  title: 'Privacy policy',
  summary:
    'What Deck collects, why, how long it is kept, and what you can make us do about it. Written to the GDPR, and accurate to the software rather than to a template.',
  effective: EFFECTIVE,
  sections: [
    {
      title: 'Who is responsible for your data',
      blocks: [
        {
          kind: 'p',
          text: 'Deck is operated by {{Legal entity name}}, registered at {{Registered address}} ({{Company registration number}}). For the purposes of the UK and EU General Data Protection Regulation we are the controller of the personal data described here — meaning we decide what is collected and why.',
        },
        {
          kind: 'p',
          text: 'For anything in this policy, including a request to see or delete your data, write to {{Privacy contact email}}. Our representative in the European Union, appointed under Article 27, is {{EU representative}}.',
        },
        {
          kind: 'p',
          text: 'If you are in Nigeria, the Nigeria Data Protection Act applies to us in parallel with the GDPR. Where the two differ we apply whichever gives you the stronger protection.',
        },
      ],
    },

    {
      title: 'What we collect',
      blocks: [
        {
          kind: 'p',
          text: 'You can read Deck without an account and without telling us anything. What follows is collected only when you do something that needs it.',
        },
        {
          kind: 'table',
          head: ['What', 'When'],
          rows: [
            [
              'Name, username, email address, password',
              'When you register. The password is stored only as a bcrypt hash — nobody at Deck can read it, and we cannot tell you what it is.',
            ],
            [
              'Provider account id, verified email, display name, avatar',
              'When you sign in with GitHub or Google instead of a password. We receive only these; we never receive your provider password, and we ask for no access to your repositories, mail or files.',
            ],
            [
              'Profile details — avatar, bio, headline, website',
              'Only if you add them. All optional, all public.',
            ],
            [
              'What you post',
              'Launches, comments, reviews, ratings, votes, forum topics and replies, arcade scores, acquisition listings and fundraise applications. Public by design, which is the point of a launch board.',
            ],
            [
              'Delivery name and address, order reference, amounts',
              'When you buy from the shop. Needed to send you the thing.',
            ],
            [
              'Email address, amount and reference',
              'When you back a fundraise or commission a custom print.',
            ],
            [
              'IP address',
              'Recorded against staff moderation actions in an audit log, and used transiently for rate limiting sign-in attempts.',
            ],
          ],
        },
        {
          kind: 'note',
          text: 'Deck never sees your card details. Payments are handled entirely by Paystack on their own systems; we receive a reference, an amount and whether it succeeded.',
        },
      ],
    },

    {
      title: 'View counts, and why they are not tracking',
      blocks: [
        {
          kind: 'p',
          text: 'Each launch shows how many people have opened it. Counting that honestly means recognising a repeat visit, and recognising a repeat visit normally means identifying the visitor. We do it without keeping anything that identifies you.',
        },
        {
          kind: 'list',
          items: [
            'If you are signed in, the counter recognises your account id.',
            'If you are not, we take your IP address and browser user-agent string, combine them with a secret key held only on our server, and store the resulting SHA-256 digest. The digest cannot be reversed, and it is useless to anyone who does not also hold the key.',
            'That row is deleted automatically after twelve hours. It exists to answer one question — "has this person already been counted today?" — and nothing reads it for any other purpose.',
            'What survives is a daily total per launch: a number, with no reference to who contributed to it.',
            'Views of your own launches are never counted towards your own totals.',
          ],
        },
        {
          kind: 'p',
          text: 'We also use Vercel Web Analytics for aggregate traffic figures. It sets no cookies and builds no cross-site profile.',
        },
      ],
    },

    {
      title: 'Why we are allowed to use it',
      blocks: [
        {
          kind: 'p',
          text: 'Article 6 of the GDPR requires a lawful basis for every use of personal data. Ours are:',
        },
        {
          kind: 'table',
          head: ['Basis', 'What it covers'],
          rows: [
            [
              'Performance of a contract',
              'Running your account, publishing what you post, taking and fulfilling orders, and handling fundraise contributions. Without this data there is no service to provide.',
            ],
            [
              'Legitimate interests',
              'Keeping Deck working and honest: rate limiting sign-in attempts, logging staff moderation actions, counting views, and preventing spam and vote manipulation. We have weighed these against your rights and kept the data minimal — which is why view counting uses an irreversible digest that expires.',
            ],
            [
              'Consent',
              'Advertising and embedded video, and nothing else. You give it in the cookie notice, you can withdraw it at any time from the footer, and declining costs you nothing but the ads and the embeds.',
            ],
            ['Legal obligation', 'Keeping records of sales for tax and accounting.'],
          ],
        },
      ],
    },

    {
      title: 'Cookies and what is stored on your device',
      blocks: [
        {
          kind: 'p',
          text: 'Almost nothing Deck stores on your device is a cookie. Most of it is local storage, which — unlike a cookie — is never transmitted anywhere. It stays in your browser and we cannot read it.',
        },
        {
          kind: 'table',
          head: ['Name', 'What it is for'],
          rows: [
            ['deck-token', 'Keeps you signed in. Strictly necessary.'],
            [
              'deck-cookie-consent, deck-ads-consent',
              'Remembers your answer to the cookie notice, so we stop asking.',
            ],
            [
              'deck-theme, deck-fontset, deck-audio-muted, deck-display-currency',
              'Your display preferences — dark mode, typeface, sound, currency.',
            ],
            ['deck-cart', 'What is in your shopping basket before you check out.'],
            [
              'deck-snake-best, deck-blockdrop-best, deck-speedx-best, deck-skyrun-best',
              'Your personal best in each arcade game.',
            ],
            [
              'deck_oauth_state',
              'The only cookie we set. A short-lived, random value used once during GitHub or Google sign-in to prove the request came back from the same browser that started it. Deleted immediately afterwards.',
            ],
          ],
        },
        {
          kind: 'p',
          text: 'If you consent to advertising, Google AdSense sets its own cookies under its own policy. If you consent to embedded video, YouTube and Vimeo do the same when a video is present. Both load only after you say yes — declining means the scripts are never requested at all, so those companies do not learn that you visited.',
        },
      ],
    },

    {
      title: 'Who else handles it',
      blocks: [
        {
          kind: 'p',
          text: 'We do not sell personal data, and we never will. We share it only with the suppliers who make the service run, each under a contract that limits them to acting on our instructions:',
        },
        {
          kind: 'table',
          head: ['Who', 'What for'],
          rows: [
            ['MongoDB Atlas', 'The database everything is stored in.'],
            ['Render', 'Runs the application server.'],
            ['Vercel', 'Serves the website and provides aggregate traffic analytics.'],
            ['Cloudinary', 'Stores and delivers uploaded images.'],
            ['Paystack', 'Takes payments. They are a controller in their own right for card data.'],
            ['GitHub, Google', 'Only if you choose to sign in with them.'],
            ['Google AdSense', 'Only after you consent to advertising.'],
          ],
        },
        {
          kind: 'p',
          text: 'We will also disclose data where the law requires it, and to protect Deck or its users from fraud, abuse or a security threat. We will tell you if that happens to your data unless we are legally prevented from doing so.',
        },
      ],
    },

    {
      title: 'Where your data goes',
      blocks: [
        {
          kind: 'p',
          text: 'Our suppliers operate outside the European Economic Area, including in the United States. Where data leaves the EEA or the UK we rely on the European Commission’s Standard Contractual Clauses, together with the UK Addendum where the UK GDPR applies, and on any adequacy decision that covers the supplier in question. You can ask us for a copy of the safeguards in place for any transfer.',
        },
      ],
    },

    {
      title: 'How long we keep it',
      blocks: [
        {
          kind: 'table',
          head: ['Data', 'Kept for'],
          rows: [
            [
              'Your account and profile',
              'Until you delete it, or after {{Dormant account period}} of inactivity, whichever comes first.',
            ],
            [
              'What you posted publicly',
              'Until you delete it. Comments left on other people’s launches may remain as an attributed record of the discussion; ask us and we will remove them.',
            ],
            ['The view-counting digest', 'Twelve hours, then deleted automatically.'],
            [
              'Daily view totals per launch',
              'Indefinitely. These are aggregate numbers with no personal data in them.',
            ],
            [
              'Orders and payment records',
              'Seven years, as tax law requires. We cannot delete these on request.',
            ],
            [
              'Moderation audit log',
              '{{Audit log retention}}. It exists so staff decisions can be reviewed after the fact.',
            ],
            ['Support correspondence', 'Two years from the last message.'],
          ],
        },
      ],
    },

    {
      title: 'Your rights',
      blocks: [
        {
          kind: 'p',
          text: 'Under the GDPR you can require us to do all of the following, free of charge. Write to {{Privacy contact email}} and we will answer within one month.',
        },
        {
          kind: 'list',
          items: [
            'Access — get a copy of the personal data we hold about you.',
            'Rectification — have anything inaccurate corrected. Most of it you can edit yourself in your account settings.',
            'Erasure — have your account and personal data deleted, except where we are legally required to keep it.',
            'Restriction — have us stop using it while a dispute about it is resolved.',
            'Portability — receive what you gave us in a machine-readable format, or have it sent directly to another service.',
            'Objection — object to any processing we base on legitimate interests, including view counting.',
            'Withdraw consent — turn off advertising and embedded video at any time, from the footer. Withdrawing does not affect anything done before you withdrew.',
          ],
        },
        {
          kind: 'p',
          text: 'We may ask you to confirm who you are before acting, because handing someone else’s data to whoever asks for it would be its own breach.',
        },
        {
          kind: 'p',
          text: 'If you think we have got this wrong, you can complain to a data protection authority: in the EU, the supervisory authority where you live or work; in the UK, the Information Commissioner’s Office; in Nigeria, the Nigeria Data Protection Commission. We would rather you came to us first, but that is your right and not conditional on doing so.',
        },
      ],
    },

    {
      title: 'Automated decisions',
      blocks: [
        {
          kind: 'p',
          text: 'We make no decisions about you by automated means that produce legal or similarly significant effects. Ranking on the leaderboard is calculated from votes, comments and how recent a launch is; it affects what is shown on a page and nothing else. Moderation decisions are made by people.',
        },
      ],
    },

    {
      title: 'Children',
      blocks: [
        {
          kind: 'p',
          text: 'Deck is not for under-16s, and you may not create an account if you are younger. Some EU member states set the age of digital consent lower — as low as 13 — and where that is the case locally, the local age applies. Our Future Gen showcase features work by young makers, but the accounts and submissions behind it are managed by an adult.',
        },
        {
          kind: 'p',
          text: 'If you believe a child has given us personal data, tell us at {{Privacy contact email}} and we will delete it.',
        },
      ],
    },

    {
      title: 'How we protect it',
      blocks: [
        {
          kind: 'list',
          items: [
            'Passwords are hashed with bcrypt. They are never stored, logged or transmitted in a readable form.',
            'Everything travels over HTTPS, with HSTS enforced in production.',
            'Sign-in attempts are rate limited, which is what stops someone working through a list of common passwords.',
            'The view counter stores a salted, irreversible digest rather than an IP address.',
            'Access to the production database is limited to the people who need it.',
          ],
        },
        {
          kind: 'p',
          text: 'No system is perfectly secure. If a breach occurs that is likely to put your rights at risk, we will notify the relevant supervisory authority within 72 hours and tell you directly without undue delay.',
        },
      ],
    },

    {
      title: 'Changes',
      blocks: [
        {
          kind: 'p',
          text: 'When this policy changes we update the date at the top. If a change materially affects your rights or how we use your data, we will tell you by email or by a notice on the site before it takes effect, and where the law requires it we will ask for your consent again rather than assume it.',
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- terms --- */

export const TERMS_OF_SERVICE: LegalDocument = {
  slug: 'terms',
  eyebrow: 'Terms',
  title: 'Terms of service',
  summary:
    'The agreement between you and Deck: what you can post, what we can do about it, how the shop and fundraises work, and what happens when something goes wrong.',
  effective: EFFECTIVE,
  sections: [
    {
      title: 'These terms',
      blocks: [
        {
          kind: 'p',
          text: 'Deck is operated by {{Legal entity name}}, registered at {{Registered address}} ({{Company registration number}}). By using Deck you agree to these terms. If you do not, please do not use it.',
        },
        {
          kind: 'p',
          text: 'Our privacy policy explains what we do with your personal data and forms part of this agreement.',
        },
        {
          kind: 'note',
          text: 'If you are a consumer in the EU or the UK, nothing here removes rights the law gives you and does not let us take away. Where a term below conflicts with those rights, those rights win.',
        },
      ],
    },

    {
      title: 'Your account',
      blocks: [
        {
          kind: 'list',
          items: [
            'You must be at least 16, or the age of digital consent where you live if that is lower.',
            'Give us accurate details and keep them current.',
            'Your account is yours alone. Do not share it, sell it or let someone else use it.',
            'You are responsible for what happens under your account. Tell us at once if you think someone else has got into it.',
            'One person, one account. Additional accounts created to manipulate votes, reviews or rankings will all be removed.',
          ],
        },
        {
          kind: 'p',
          text: 'You can delete your account at any time. We can suspend or close it if you break these terms — see "Enforcement" below for how that works.',
        },
      ],
    },

    {
      title: 'Launching a product',
      blocks: [
        {
          kind: 'list',
          items: [
            'Launch things you made, or things you are authorised to represent. Do not post someone else’s product as your own.',
            'Describe it accurately. No invented features, fabricated metrics or borrowed screenshots.',
            'You may edit a launch for a short window after posting; after that, ship a new version instead. Both the window and the version history are deliberate — the board is a record of what was claimed and when.',
            'Staff curate. We can edit, unlist, recategorise or remove a launch, and being featured is an editorial decision, never something bought.',
          ],
        },
      ],
    },

    {
      title: 'Community rules',
      blocks: [
        { kind: 'p', text: 'Do not use Deck to:' },
        {
          kind: 'list',
          items: [
            'Post anything unlawful, defamatory, hateful, or that harasses or threatens another person.',
            'Post sexual content involving minors, or content that promotes violence or self-harm.',
            'Distribute malware, phishing pages, or anything designed to compromise a reader’s device or accounts.',
            'Infringe anyone’s copyright, trade marks or other rights.',
            'Impersonate another person, company or Deck staff.',
            'Spam: repeated posting, unsolicited promotion, or link schemes.',
            'Scrape the site, or access it through automated means, beyond what a search engine ordinarily does.',
            'Probe, overload or interfere with the service, or try to reach parts of it you are not authorised to reach.',
          ],
        },
      ],
    },

    {
      title: 'Votes and reviews',
      blocks: [
        {
          kind: 'p',
          text: 'The leaderboard is only worth anything if the votes behind it are real. So:',
        },
        {
          kind: 'list',
          items: [
            'Do not buy, sell, trade or solicit votes, and do not offer anything in exchange for one.',
            'Do not vote using accounts you control beyond your own, or organise others to vote as a bloc.',
            'Review honestly. If you have a stake in a product — you built it, you work there, you were paid — say so in the review.',
            'Do not post reviews of your own launches.',
          ],
        },
        {
          kind: 'p',
          text: 'We remove votes and reviews we believe are manipulated, and we may remove the launch that benefited from them, whether or not its maker organised it.',
        },
      ],
    },

    {
      title: 'What you post, and what we may do with it',
      blocks: [
        {
          kind: 'p',
          text: 'You keep ownership of everything you post. You give us a non-exclusive, worldwide, royalty-free licence to host, store, reproduce, adapt for formatting, and display it for the purpose of operating and promoting Deck — including in share cards, the daily leaderboard, newsletters and social posts about the board.',
        },
        {
          kind: 'p',
          text: 'That licence lasts as long as your content is on Deck, and ends when you delete it, except for copies already distributed elsewhere and for backups that are overwritten on their normal cycle. You confirm that you have the rights to grant it.',
        },
        {
          kind: 'p',
          text: 'Deck’s own name, wordmark and the design of the site belong to us. Do not use them to suggest we endorse you.',
        },
      ],
    },

    {
      title: 'The shop',
      blocks: [
        {
          kind: 'p',
          text: 'Prices are set in Nigerian naira. Other currencies shown on the site are an indicative conversion for your convenience; the naira figure is what is charged. Your order is an offer to buy, accepted when we confirm dispatch.',
        },
        {
          kind: 'p',
          text: 'If you are a consumer in the EU or UK you have a right to withdraw from a purchase within 14 days of receiving it, for any reason and without giving one. Tell us at {{Support contact email}} within that period and return the goods within 14 days of telling us. We refund what you paid, including standard outbound delivery, within 14 days of getting the goods back. Return postage is yours unless the item was faulty or wrong.',
        },
        {
          kind: 'p',
          text: 'Separately from the withdrawal right, goods must match their description and be of satisfactory quality. If something arrives faulty you are entitled to a repair, a replacement or a refund under the consumer law where you live — in the EU, for at least two years from delivery.',
        },
        {
          kind: 'note',
          text: 'Custom prints are made to your specification, so the 14-day withdrawal right does not apply to them once production has started. This is the personalised-goods exception in Article 16(c) of the Consumer Rights Directive, not a policy of ours. Faulty or misprinted items are still refunded in full.',
        },
      ],
    },

    {
      title: 'Fundraises',
      blocks: [
        {
          kind: 'p',
          text: 'Some launches can accept contributions from the community. Read this part carefully.',
        },
        {
          kind: 'list',
          items: [
            'A contribution is a voluntary payment to support a project. It is not an investment, it buys no shares, no debt, no revenue share and no security of any kind, and it carries no expectation of financial return.',
            'Deck is not a broker, a dealer, a crowdfunding service provider under Regulation (EU) 2020/1503, or a party to the relationship between you and the maker. We provide the page and pass the money on.',
            'A fundraise is reviewed by staff before it can take money. Approval means we checked the application, not that we endorse the project, verified its claims, or think it will succeed.',
            'Makers are responsible for delivering whatever they promised, and for their own tax and legal obligations.',
            'Contributions are generally not refundable. If a project is abandoned or a fundraise turns out to be fraudulent, contact us and we will help where we can, including refunding money still held and removing the project.',
          ],
        },
      ],
    },

    {
      title: 'Acquisitions',
      blocks: [
        {
          kind: 'p',
          text: 'Makers can list a launch as being for sale. Deck introduces buyers and sellers and takes a fee on a completed sale; we are not a party to the transaction, we do not hold the asset, and we do not verify what is being sold, what it earns or whether the seller can transfer it. Do your own diligence, and get your own advice before signing anything.',
        },
      ],
    },

    {
      title: 'Advertising',
      blocks: [
        {
          kind: 'p',
          text: 'Deck carries advertising. Ads are labelled, they are kept visually distinct from launches, and buying one has no effect on ranking, curation or whether a product is featured. Advertising loads only if you have consented to it.',
        },
      ],
    },

    {
      title: 'The arcade',
      blocks: [
        {
          kind: 'p',
          text: 'The games are there for fun. Submitting scores you did not earn — by modifying the game, automating play or tampering with requests — gets the scores removed and may cost you your account.',
        },
      ],
    },

    {
      title: 'Third-party links and embeds',
      blocks: [
        {
          kind: 'p',
          text: 'Launches link out, and some embed video. We do not control those sites and are not responsible for them. Their terms and privacy policies apply once you leave, and embedded players are only loaded if you have consented to them.',
        },
      ],
    },

    {
      title: 'Enforcement',
      blocks: [
        {
          kind: 'p',
          text: 'If you break these terms we may remove content, limit what your account can do, suspend it, or close it. Before we act we will tell you what the problem is and give you a chance to respond, unless the content is manifestly illegal, causes immediate harm, or telling you first would defeat the point.',
        },
        {
          kind: 'p',
          text: 'You can appeal any decision by writing to {{Support contact email}}, and a person who was not involved in the original decision will review it. Report content you think breaks these rules to the same address.',
        },
        {
          kind: 'p',
          text: 'We may stop providing Deck, or any part of it, at any time. If we close the service we will give reasonable notice and a way to export what you posted.',
        },
      ],
    },

    {
      title: 'Liability',
      blocks: [
        {
          kind: 'p',
          text: 'Deck is provided as it is. We do not promise it will be uninterrupted or error-free, and we do not guarantee that anything a maker says about their product is true.',
        },
        {
          kind: 'p',
          text: 'Nothing in these terms limits our liability for death or personal injury caused by our negligence, for fraud or fraudulent misrepresentation, or for anything else that cannot be limited by law — including, for consumers, our liability under consumer protection legislation.',
        },
        {
          kind: 'p',
          text: 'Subject to that: if you are a consumer, we are liable for loss you suffer that is a foreseeable result of us breaking these terms or failing to use reasonable care, and not for anything unforeseeable. If you are using Deck for business purposes, we exclude liability for lost profits, lost revenue, lost data and indirect or consequential loss, and our total liability to you is capped at the greater of {{Liability cap}} or what you paid us in the twelve months before the claim.',
        },
      ],
    },

    {
      title: 'Changes to these terms',
      blocks: [
        {
          kind: 'p',
          text: 'We may change these terms. For minor changes we will update the date at the top. For changes that materially affect your rights we will give you at least 30 days’ notice by email or on the site, and you may close your account before they take effect if you do not accept them.',
        },
      ],
    },

    {
      title: 'Law and disputes',
      blocks: [
        {
          kind: 'p',
          text: 'These terms are governed by the law of {{Governing law}}, and the courts of {{Courts and jurisdiction}} have jurisdiction.',
        },
        {
          kind: 'p',
          text: 'If you are a consumer, this does not deprive you of the protection of the mandatory rules of the country you live in, and you may bring proceedings in your local courts.',
        },
        {
          kind: 'p',
          text: 'Please come to us first at {{Support contact email}} — most things are settled that way. If we cannot resolve it, consumers in the EU may be able to use an approved alternative dispute resolution body in their own country; your national consumer authority can point you to one.',
        },
        {
          kind: 'note',
          text: 'Deliberately not mentioned here: the European Commission’s online dispute resolution platform. It is required boilerplate in a great many terms of service written before 2025 and it no longer exists, so linking to it would send consumers to a dead end.',
        },
      ],
    },

    {
      title: 'Odds and ends',
      blocks: [
        {
          kind: 'list',
          items: [
            'If any part of these terms turns out to be unenforceable, the rest carries on without it.',
            'Not enforcing something straight away does not mean we have given up the right to enforce it later.',
            'You may not transfer your rights under these terms. We may transfer ours if Deck is sold or reorganised, provided your rights are not reduced.',
            'These terms, together with the privacy policy, are the whole agreement between us.',
          ],
        },
        {
          kind: 'p',
          text: 'Questions about any of this: {{Support contact email}}.',
        },
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS = [PRIVACY_POLICY, TERMS_OF_SERVICE];

/** Every `{{placeholder}}` still unfilled, across one document. */
export function pendingPlaceholders(document: LegalDocument): string[] {
  const found = new Set<string>();

  const scan = (text: string): void => {
    for (const match of text.matchAll(/\{\{([^}]+)\}\}/g)) found.add(match[1]);
  };

  for (const section of document.sections) {
    for (const block of section.blocks) {
      if (block.kind === 'p' || block.kind === 'note') scan(block.text);
      if (block.kind === 'list') block.items.forEach(scan);
      if (block.kind === 'table') block.rows.forEach(([a, b]) => [a, b].forEach(scan));
    }
  }

  return [...found];
}
