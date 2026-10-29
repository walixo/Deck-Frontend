import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import {
  useMatchAction,
  useMatchMoneyAction,
  useMatchNights,
  useMatchReports,
  useMatchRevenue,
  useMatchSectionRequests,
  useMatchStats,
  useMatchVerifications,
  type MatchPerson,
  type MatchRates,
} from '@/hooks/useMatchAdmin';
import { relativeTime } from '@/lib/utils';

/**
 * Match, for staff — match.onedeck.africa.
 *
 * Four numbers say whether it is working: calls a day (are people getting
 * matched), average wait by side (is one side waiting too long), share rate
 * (do people like who they meet) and report rate (is it safe). Below them,
 * the people reported — grouped, with their history — and anyone who asked
 * to switch section.
 */

const REASONS: Record<string, string> = {
  abusive: 'Rude or abusive',
  sexual: 'Sexual or explicit',
  underage: 'Seems under 18',
  spam: 'Spam or scam',
  other: 'Something else',
};

const percent = (value: number | null) => (value === null ? '—' : `${Math.round(value * 100)}%`);
const seconds = (value: number | null) =>
  value === null ? '—' : value < 60 ? `${value}s` : `${Math.floor(value / 60)}m ${value % 60}s`;
const naira = (minor: number) => `₦${(minor / 100).toLocaleString('en-NG')}`;
const KINDS: Record<string, string> = {
  minute: 'Extra minutes',
  gift: 'Gifts',
  entry: 'Themed nights',
  badge: 'Verified badges',
  plus: 'Match+',
};
const section = (gender: 'male' | 'female' | null) =>
  gender === 'male' ? 'Men' : gender === 'female' ? 'Women' : '—';

export function AdminMatch() {
  return (
    <div className="space-y-12">
      <header>
        <h1 className="display-tight text-3xl">Match</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted text-pretty">
          Two voices, two minutes, at match.onedeck.africa. Whether it is working, who has been
          reported, and who chose the wrong section.
        </p>
      </header>
      <Numbers />
      <Revenue />
      <Verifications />
      <Nights />
      <Reports />
      <SectionRequests />
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="mb-3 border-b border-line pb-2 font-mono text-[11px] font-medium uppercase tracking-[0.12em]">
      {children}
    </h2>
  );
}

function Numbers() {
  const [days, setDays] = useState(14);
  const { data, isLoading } = useMatchStats(days);
  if (isLoading || !data) return <Skeleton className="h-64 w-full" />;
  const t: MatchRates = data.totals;
  const busiest = Math.max(1, ...data.days.map((d) => d.calls));
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle>{`The numbers · last ${days} days`}</SectionTitle>
        <div className="flex gap-1">
          {[7, 14, 30].map((n) => (
            <Button
              key={n}
              size="sm"
              variant={n === days ? 'primary' : 'secondary'}
              onClick={() => setDays(n)}
            >
              {n}d
            </Button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted">
        {data.now.hours.open ? 'Open now' : 'Closed now'} ·{' '}
        <b className="text-body">{data.now.total}</b> online ({data.now.male} men, {data.now.female}{' '}
        women)
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Calls"
          value={t.calls.toLocaleString()}
          hint={`${percent(t.connectRate)} connected`}
        />
        <Kpi
          label="Average wait"
          value={`${seconds(t.avgWaitSeconds.male)} / ${seconds(t.avgWaitSeconds.female)}`}
          hint="Men / women, before a match"
        />
        <Kpi
          label="Share rate"
          value={percent(t.shareRate)}
          hint="Of calls that ran their full time"
        />
        <Kpi
          label="Report rate"
          value={percent(t.reportRate)}
          hint={`${t.reports} reports · per connected call`}
        />
        <Kpi label="Left early" value={percent(t.earlyLeaveRate)} hint="Of connected calls" />
        <Kpi label="+1 minute" value={percent(t.extendRate)} hint="Both asked for more time" />
      </div>

      <Card className="overflow-x-auto p-0">
        <div
          className="flex h-28 items-end gap-1 border-b border-line px-4 pt-4"
          aria-hidden="true"
        >
          {data.days.map((d) => (
            <div key={d.day} className="flex-1" title={`${d.day}: ${d.calls} calls`}>
              <div
                className="rounded-t-sm bg-accent"
                style={{ height: `${(d.calls / busiest) * 88}px` }}
              />
            </div>
          ))}
        </div>
        <table className="w-full text-sm">
          <thead className="text-left font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
            <tr>
              {[
                'Day',
                'Calls',
                'Connected',
                'Wait (m / w)',
                'Shared',
                'Reports',
                'Peak online',
              ].map((h) => (
                <th key={h} className="px-4 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...data.days].reverse().map((d) => (
              <tr key={d.day} className="border-t border-line">
                <td className="px-4 py-2 font-mono text-[12px]">{d.day}</td>
                <td className="px-4 py-2 tabular-nums">{d.calls}</td>
                <td className="px-4 py-2 tabular-nums">{percent(d.connectRate)}</td>
                <td className="px-4 py-2 tabular-nums">
                  {seconds(d.avgWaitSeconds.male)} / {seconds(d.avgWaitSeconds.female)}
                </td>
                <td className="px-4 py-2 tabular-nums">{percent(d.shareRate)}</td>
                <td className="px-4 py-2 tabular-nums">{d.reports}</td>
                <td className="px-4 py-2 tabular-nums">{d.peakOnline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] tabular-nums">{value}</p>
      <p className="mt-1 text-[12px] text-muted">{hint}</p>
    </Card>
  );
}

function History({ person }: { person: MatchPerson }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
      {section(person.gender)} · {person.history.calls} calls · {person.history.leftEarly} left
      early · {person.history.reports} reports all-time
      {person.x ? ` · @${person.x} on X` : ''}
      {person.instagram ? ` · @${person.instagram} on Instagram` : ''}
    </p>
  );
}

function Reports() {
  const { data, isLoading } = useMatchReports();
  const act = useMatchAction();
  if (isLoading || !data) return <Skeleton className="h-48 w-full" />;
  return (
    <section className="space-y-8">
      <div>
        <SectionTitle>{`Reports · ${data.groups.length} ${data.groups.length === 1 ? 'person' : 'people'} waiting`}</SectionTitle>
        {act.error && <p className="mb-3 text-sm text-danger">{act.error.message}</p>}
        {data.groups.length ? (
          <ul className="space-y-4">
            {data.groups.map((group) => (
              <li key={group.userId}>
                <Card className="space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-xl">{group.name}</p>
                      <p className="text-[13px] text-muted">
                        {group.email}
                        {group.username ? ` · @${group.username}` : ''}
                      </p>
                    </div>
                    <span className="rounded-full bg-surface-2 px-2.5 py-1 font-mono text-[11px]">
                      {group.reporters} {group.reporters === 1 ? 'reporter' : 'reporters'}
                    </span>
                  </div>
                  <History person={group} />
                  <ul className="space-y-1.5 text-sm">
                    {group.reports.map((r) => (
                      <li key={`${r.callId}-${r.at}`}>
                        <b>{REASONS[r.reason] ?? r.reason}</b>
                        {r.note ? ` — “${r.note}”` : ''}{' '}
                        <span className="text-muted">· {relativeTime(r.at)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      loading={act.isPending}
                      onClick={() => act.mutate({ kind: 'pause', userId: group.userId, days: 7 })}
                    >
                      Pause 7 days
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={act.isPending}
                      onClick={() => act.mutate({ kind: 'pause', userId: group.userId, days: 30 })}
                    >
                      Pause 30 days
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={act.isPending}
                      onClick={() => act.mutate({ kind: 'dismiss', userId: group.userId })}
                    >
                      Dismiss reports
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No open reports" description="Nobody is waiting on a decision." />
        )}
      </div>

      {data.paused.length > 0 && (
        <div>
          <SectionTitle>{`Paused now · ${data.paused.length}`}</SectionTitle>
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {data.paused.map((person) => (
              <li
                key={person.userId}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="font-medium">
                    {person.name} <span className="text-[13px] text-muted">{person.email}</span>
                  </p>
                  <History person={person} />
                  <p className="text-[12px] text-muted">
                    Paused until{' '}
                    {person.pausedUntil ? new Date(person.pausedUntil).toLocaleString() : '—'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={act.isPending}
                  onClick={() => act.mutate({ kind: 'unpause', userId: person.userId })}
                >
                  Unpause
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function SectionRequests() {
  const { data, isLoading } = useMatchSectionRequests();
  const act = useMatchAction();
  if (isLoading || !data) return <Skeleton className="h-32 w-full" />;
  return (
    <section>
      <SectionTitle>{`Section requests · ${data.length}`}</SectionTitle>
      {data.length ? (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {data.map((ask) => {
            const to = ask.gender === 'male' ? 'female' : 'male';
            return (
              <li
                key={ask.userId}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="font-medium">
                    {ask.name} <span className="text-[13px] text-muted">{ask.email}</span>
                  </p>
                  <p className="text-[13px] text-muted">
                    In the {section(ask.gender).toLowerCase()}’s section
                    {ask.at ? ` · asked ${relativeTime(ask.at)}` : ''}
                    {ask.note ? ` · “${ask.note}”` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    loading={act.isPending}
                    onClick={() => act.mutate({ kind: 'section', userId: ask.userId, gender: to })}
                  >
                    Move to {section(to).toLowerCase()}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={act.isPending}
                    onClick={() => act.mutate({ kind: 'decline', userId: ask.userId })}
                  >
                    Decline
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState title="No requests" description="Nobody has asked to switch section." />
      )}
    </section>
  );
}

/** What Match earned: credit spent by kind, cash in, and credit still held. */
function Revenue() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useMatchRevenue(days);
  if (isLoading || !data) return <Skeleton className="h-48 w-full" />;
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle>{`Money · last ${days} days`}</SectionTitle>
        <div className="flex gap-1">
          {[7, 30, 90].map((n) => (
            <Button
              key={n}
              size="sm"
              variant={n === days ? 'primary' : 'secondary'}
              onClick={() => setDays(n)}
            >
              {n}d
            </Button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Earned" value={naira(data.spentMinor)} hint="Credit spent, after refunds" />
        <Kpi
          label="Top-ups"
          value={naira(data.topupsMinor)}
          hint={`${data.topups} paid · cash in`}
        />
        <Kpi
          label="Credit held"
          value={naira(data.outstandingMinor)}
          hint="Bought, not yet spent"
        />
        <Kpi
          label="Members"
          value={`${data.plusMembers} · ${data.verifiedPeople}`}
          hint="Match+ now · verified people"
        />
      </div>
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead className="text-left font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
            <tr>
              {['What', 'Sold', 'Earned'].map((h) => (
                <th key={h} className="px-4 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(KINDS).map(([kind, label]) => (
              <tr key={kind} className="border-t border-line">
                <td className="px-4 py-2">{label}</td>
                <td className="px-4 py-2 tabular-nums">
                  {data.byKind[kind as keyof typeof data.byKind]?.count ?? 0}
                </td>
                <td className="px-4 py-2 tabular-nums">
                  {naira(data.byKind[kind as keyof typeof data.byKind]?.minor ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}

/** Selfies for the Verified badge: approve, decline, or decline as under 18. */
function Verifications() {
  const { data, isLoading } = useMatchVerifications();
  const act = useMatchMoneyAction();
  if (isLoading || !data) return <Skeleton className="h-32 w-full" />;
  return (
    <section>
      <SectionTitle>{`Verified badge checks · ${data.length}`}</SectionTitle>
      <p className="mb-3 text-[13px] text-muted">
        Approve if the face is clear, the person makes the pose asked for, and they look 18 or over.
        The photo is deleted as soon as you decide; a decline refunds their credit.
      </p>
      {act.error && <p className="mb-3 text-sm text-danger">{act.error.message}</p>}
      {data.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((check) => (
            <li key={check.id}>
              <Card className="space-y-3 p-4">
                {check.photo && (
                  <img
                    src={check.photo}
                    alt={`Selfie from ${check.name}`}
                    className="aspect-[3/4] w-full rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{check.name}</p>
                  <p className="text-[13px] text-muted">{check.email}</p>
                  <p className="mt-1 text-[13px]">
                    Asked for <b>{check.prompt}</b>
                    {check.submittedAt ? ` · ${relativeTime(check.submittedAt)}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    loading={act.isPending}
                    onClick={() => act.mutate({ kind: 'approve', id: check.id })}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={act.isPending}
                    onClick={() => act.mutate({ kind: 'decline', id: check.id })}
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={act.isPending}
                    onClick={() => act.mutate({ kind: 'decline', id: check.id, underage: true })}
                  >
                    Under 18 — remove
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No checks waiting" description="New selfies appear here." />
      )}
    </section>
  );
}

const EMPTY_NIGHT = {
  day: '',
  sponsorName: '',
  sponsorLine: '',
  sponsorUrl: '',
  themeTitle: '',
  themeBlurb: '',
  themeEntry: '',
};

/** Evenings with a sponsor's line on the countdown, or a theme people pay to join. */
function Nights() {
  const { data, isLoading } = useMatchNights();
  const act = useMatchMoneyAction();
  const [form, setForm] = useState(EMPTY_NIGHT);
  const set = (key: keyof typeof EMPTY_NIGHT) => (event: { target: { value: string } }) =>
    setForm({ ...form, [key]: event.target.value });

  const save = (event: FormEvent) => {
    event.preventDefault();
    act.mutate(
      {
        kind: 'saveNight',
        night: {
          day: form.day,
          sponsor: form.sponsorName.trim()
            ? {
                name: form.sponsorName.trim(),
                line: form.sponsorLine.trim(),
                url: form.sponsorUrl.trim(),
              }
            : null,
          theme: form.themeTitle.trim()
            ? {
                title: form.themeTitle.trim(),
                blurb: form.themeBlurb.trim(),
                entryMinor: Math.round(Number(form.themeEntry || 0) * 100),
              }
            : null,
        },
      },
      { onSuccess: () => setForm(EMPTY_NIGHT) },
    );
  };

  return (
    <section className="space-y-4">
      <SectionTitle>Sponsored and themed nights</SectionTitle>
      <Card className="p-5">
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <Input label="Date (Lagos)" type="date" required value={form.day} onChange={set('day')} />
          <div className="hidden md:block" />
          <Input
            label="Sponsor"
            placeholder="Zobo Co"
            value={form.sponsorName}
            onChange={set('sponsorName')}
            hint="Shown as “presented by” on the countdown and the waiting screen."
          />
          <Input
            label="Sponsor line"
            placeholder="Cold zobo, warm voices"
            value={form.sponsorLine}
            onChange={set('sponsorLine')}
          />
          <Input
            label="Sponsor link"
            placeholder="https://"
            value={form.sponsorUrl}
            onChange={set('sponsorUrl')}
          />
          <div className="hidden md:block" />
          <Input
            label="Theme"
            placeholder="Over-30s night"
            value={form.themeTitle}
            onChange={set('themeTitle')}
            hint="Leave empty for a normal night."
          />
          <Input
            label="Theme line"
            placeholder="Grown conversation only"
            value={form.themeBlurb}
            onChange={set('themeBlurb')}
          />
          <Input
            label="Entry (₦)"
            type="number"
            min={0}
            step={50}
            placeholder="300"
            value={form.themeEntry}
            onChange={set('themeEntry')}
            hint="Paid from credit to join that night. 0 for a free theme."
          />
          <div className="flex items-end">
            <Button type="submit" loading={act.isPending}>
              Save night
            </Button>
          </div>
        </form>
        {act.error && <p className="mt-3 text-sm text-danger">{act.error.message}</p>}
      </Card>
      {isLoading || !data ? (
        <Skeleton className="h-24 w-full" />
      ) : data.length ? (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {data.map((night) => (
            <li key={night.day} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-mono text-[13px]">{night.day}</p>
                <p className="text-sm">
                  {night.theme ? (
                    <b>
                      {night.theme.title} ·{' '}
                      {night.theme.entryMinor ? naira(night.theme.entryMinor) : 'free'}
                    </b>
                  ) : (
                    'Normal night'
                  )}
                  {night.sponsor ? ` · presented by ${night.sponsor.name}` : ''}
                </p>
                {night.theme && night.theme.entryMinor > 0 && (
                  <p className="text-[12px] text-muted">
                    {night.entries} joined · {naira(night.entriesMinor)}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setForm({
                      day: night.day,
                      sponsorName: night.sponsor?.name ?? '',
                      sponsorLine: night.sponsor?.line ?? '',
                      sponsorUrl: night.sponsor?.url ?? '',
                      themeTitle: night.theme?.title ?? '',
                      themeBlurb: night.theme?.blurb ?? '',
                      themeEntry: night.theme ? String(night.theme.entryMinor / 100) : '',
                    })
                  }
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={act.isPending}
                  onClick={() => act.mutate({ kind: 'removeNight', day: night.day })}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No nights set" description="Every night runs as normal." />
      )}
    </section>
  );
}
