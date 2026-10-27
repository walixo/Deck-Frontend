import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { MorphShape } from '@/components/deckgames/MorphShape';
import { RequestError, setStoredToken, getStoredToken } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  googleSignInUrl,
  matchApi,
  MatchLine,
  type Gender,
  type MatchEvent,
  type MatchProfile,
  type Online,
} from './matchApi';
import { VoiceCall } from './voiceCall';

/**
 * Match — match.onedeck.africa. Two voices, two minutes.
 *
 * Sign in with Google, say once whether you are a man or a woman, and press
 * Find someone: men are matched only with women who are online and waiting,
 * and women only with men. The two talk, voice only, for two minutes. When
 * the time is up each may press Share; if both do, each sees the other's
 * LagosLife username and they carry on there.
 *
 * One screen at a time, driven by the live line (see `matchApi.ts`): the
 * server decides matches and keeps the clock; this page asks for the
 * microphone, runs the call (`voiceCall.ts`) and shows where things stand.
 */

type Screen =
  | 'loading'
  | 'signedOut'
  | 'setup'
  | 'lobby'
  | 'waiting'
  | 'connecting'
  | 'live'
  | 'ended'
  | 'paused';

interface CallInfo {
  callId: string;
  caller: boolean;
  endsAt: number | null;
  total: number;
}

interface Ended {
  callId: string;
  reason: 'time' | 'left' | 'no-connection' | 'reported';
  by: 'you' | 'them' | null;
  canShare: boolean;
  shareUntil: number;
}

const other = (gender: Gender): Gender => (gender === 'male' ? 'female' : 'male');
const people = (gender: Gender, count: number) =>
  `${count} ${gender === 'male' ? (count === 1 ? 'man' : 'men') : count === 1 ? 'woman' : 'women'}`;

export function MatchApp({ signInError = '' }: { signInError?: string }) {
  const [screen, setScreen] = useState<Screen>(() => (getStoredToken() ? 'loading' : 'signedOut'));
  const [profile, setProfile] = useState<MatchProfile | null>(null);
  const [online, setOnline] = useState<Online | null>(null);
  const [queue, setQueue] = useState<{ position: number; waiting: Record<Gender, number> } | null>(
    null,
  );
  const [call, setCall] = useState<CallInfo | null>(null);
  const [ended, setEnded] = useState<Ended | null>(null);
  const [shared, setShared] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [notice, setNotice] = useState(signInError);
  const [reporting, setReporting] = useState(false);
  const [matches, setMatches] = useState<{ handle: string; at: string }[]>([]);
  const now = useNow(screen === 'live' || screen === 'ended');

  const line = useRef<MatchLine | null>(null);
  const voice = useRef<VoiceCall | null>(null);
  const mic = useRef<MediaStream | null>(null);
  const audio = useRef<AudioContext | null>(null);

  const dropMic = () => {
    for (const track of mic.current?.getTracks() ?? []) track.stop();
    mic.current = null;
  };

  const refreshMatches = useCallback(() => {
    void matchApi
      .matches()
      .then(setMatches)
      .catch(() => undefined);
  }, []);

  /* Events from the live line. A ref, so the line keeps one handler while it
     always sees the latest state. */
  const onEvent = useRef<(event: MatchEvent, data: unknown) => void>(() => undefined);
  const handle = (event: MatchEvent, raw: unknown) => {
    const data = raw as Record<string, never>;
    switch (event) {
      case 'hello': {
        setOnline(data.online);
        /* Back after a reload: a call or a place in line cannot be resumed
           without the microphone and the call itself, so let them go. */
        const hello = raw as { state: string; call: { callId: string } | null };
        if (hello.call && !voice.current)
          void matchApi.leave(hello.call.callId).catch(() => undefined);
        if (hello.state === 'waiting' && !mic.current)
          void matchApi.unqueue().catch(() => undefined);
        if (hello.state === 'idle' && screen === 'waiting') setScreen('lobby');
        break;
      }
      case 'online':
        setOnline(raw as Online);
        break;
      case 'queue':
        setQueue(raw as { position: number; waiting: Record<Gender, number> });
        break;
      case 'matched': {
        const { callId, caller } = raw as { callId: string; caller: boolean };
        if (!mic.current || !audio.current) {
          void matchApi.leave(callId).catch(() => undefined);
          return;
        }
        voice.current?.close();
        voice.current = new VoiceCall(callId, caller, mic.current, audio.current, (state) => {
          if (state === 'failed') setNotice('Your voices could not reach each other.');
        });
        void voice.current.start().catch(() => undefined);
        setCall({ callId, caller, endsAt: null, total: 120_000 });
        setMuted(false);
        setNotice('');
        setScreen('connecting');
        break;
      }
      case 'signal':
        voice.current?.handle((raw as { data: Record<string, never> }).data);
        break;
      case 'started': {
        const started = raw as { startedAt: number; endsAt: number; serverNow: number };
        const offset = started.serverNow - Date.now();
        setCall(
          (current) =>
            current && {
              ...current,
              endsAt: started.endsAt - offset,
              total: started.endsAt - started.startedAt,
            },
        );
        setScreen('live');
        break;
      }
      case 'ended': {
        const end = raw as Ended & { serverNow: number };
        voice.current?.close();
        voice.current = null;
        mic.current = null;
        setEnded({ ...end, shareUntil: end.shareUntil - (end.serverNow - Date.now()) });
        setShared(false);
        setRevealed(null);
        setReporting(false);
        setScreen('ended');
        break;
      }
      case 'revealed':
        setRevealed((raw as { handle: string }).handle);
        refreshMatches();
        break;
      case 'banned':
        setScreen('paused');
        break;
    }
  };
  useEffect(() => {
    onEvent.current = handle;
  });

  const openLine = useCallback(() => {
    line.current?.stop();
    line.current = new MatchLine(
      (event, data) => onEvent.current(event, data),
      (status) => {
        if (status === 401) {
          setStoredToken(null);
          setScreen('signedOut');
        } else if (status === 403) setScreen('paused');
        else setScreen('setup');
      },
    );
    line.current.start();
  }, []);

  const enter = useCallback(
    (me: MatchProfile) => {
      setProfile(me);
      if (me.bannedUntil) {
        setScreen('paused');
        return;
      }
      setScreen('lobby');
      openLine();
      refreshMatches();
    },
    [openLine, refreshMatches],
  );

  /* Start-up: who this is, if they are signed in. */
  useEffect(() => {
    let cancelled = false;
    if (getStoredToken()) {
      matchApi
        .me()
        .then((me) => {
          if (cancelled) return;
          if (me) enter(me);
          else setScreen('setup');
        })
        .catch((error) => {
          if (cancelled) return;
          if (error instanceof RequestError && error.status === 401) setStoredToken(null);
          setScreen('signedOut');
        });
    }
    return () => {
      cancelled = true;
      line.current?.stop();
      voice.current?.close();
    };
  }, [enter]);

  /* Signed out, the count comes from a light poll instead of the line. */
  useEffect(() => {
    if (screen !== 'signedOut' && screen !== 'setup') return;
    const load = () =>
      void matchApi
        .online()
        .then(setOnline)
        .catch(() => undefined);
    load();
    const timer = window.setInterval(load, 10_000);
    return () => window.clearInterval(timer);
  }, [screen]);

  /* ---------------------------------------------------------- actions --- */

  const find = async () => {
    setNotice('');
    try {
      audio.current ??= new AudioContext();
      await audio.current.resume();
      mic.current ??= await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      setNotice('Allow your microphone so the other person can hear you.');
      return;
    }
    try {
      const { position } = await matchApi.queue();
      setQueue((current) => ({ position, waiting: current?.waiting ?? { male: 0, female: 0 } }));
      setScreen((current) =>
        current === 'connecting' || current === 'live' ? current : 'waiting',
      );
    } catch (error) {
      dropMic();
      setNotice(error instanceof Error ? error.message : 'Could not join the line.');
    }
  };

  const cancel = async () => {
    await matchApi.unqueue().catch(() => undefined);
    dropMic();
    setScreen('lobby');
  };

  const hangUp = () => call && void matchApi.leave(call.callId).catch(() => undefined);

  const share = async () => {
    if (!ended) return;
    try {
      await matchApi.share(ended.callId);
      setShared(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not share.');
    }
  };

  const saveHandle = async (handle: string) => {
    try {
      setProfile(await matchApi.setHandle(handle));
      setNotice('');
      return true;
    } catch (error) {
      setNotice(
        error instanceof RequestError
          ? (error.fieldError('lagosLife') ?? error.message)
          : 'Could not save.',
      );
      return false;
    }
  };

  const report = async (reason: string) => {
    const id = call?.callId ?? ended?.callId;
    if (!id) return;
    await matchApi.report(id, reason).catch(() => undefined);
    setReporting(false);
    setNotice('Reported. You won’t be matched with them again.');
  };

  const signOut = () => {
    line.current?.stop();
    setStoredToken(null);
    setProfile(null);
    setScreen('signedOut');
  };

  /* ---------------------------------------------------------- screens --- */

  let body: ReactNode = null;
  if (screen === 'loading') body = <Pulse />;
  else if (screen === 'signedOut') body = <SignedOut online={online} />;
  else if (screen === 'setup') body = <Setup onDone={enter} />;
  else if (screen === 'paused') body = <Paused onSignOut={signOut} />;
  else if (screen === 'lobby' && profile)
    body = (
      <Lobby
        profile={profile}
        online={online}
        matches={matches}
        onFind={find}
        onSaveHandle={saveHandle}
        onSignOut={signOut}
      />
    );
  else if (screen === 'waiting' && profile)
    body = <Waiting profile={profile} online={online} queue={queue} onCancel={cancel} />;
  else if (screen === 'connecting') body = <Connecting onLeave={hangUp} />;
  else if (screen === 'live' && call)
    body = (
      <Live
        now={now}
        call={call}
        voice={voice}
        muted={muted}
        onMute={() => {
          voice.current?.setMuted(!muted);
          setMuted(!muted);
        }}
        onLeave={hangUp}
        onReport={() => setReporting(true)}
      />
    );
  else if (screen === 'ended' && ended && profile)
    body = (
      <After
        now={now}
        ended={ended}
        profile={profile}
        shared={shared}
        revealed={revealed}
        onShare={share}
        onSaveHandle={saveHandle}
        onNext={find}
        onLobby={() => setScreen('lobby')}
        onReport={() => setReporting(true)}
      />
    );

  return (
    <Shell
      online={screen === 'loading' ? null : online}
      onHome={profile ? () => screen === 'ended' && setScreen('lobby') : undefined}
    >
      {body}
      {notice && (
        <p role="status" className="mt-6 text-center text-[14px] leading-relaxed text-[#ffb3c4]">
          {notice}
        </p>
      )}
      {reporting && <ReportSheet onReport={report} onClose={() => setReporting(false)} />}
    </Shell>
  );
}

/* -------------------------------------------------------------- pieces --- */

const SLAB =
  'inline-flex items-center justify-center gap-3 rounded-[8px] border-2 border-[#f4f2ee] px-6 py-4 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] shadow-[4px_4px_0_#f4f2ee] transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_#f4f2ee] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#f4f2ee] disabled:opacity-50';
const PRIMARY = `${SLAB} bg-[#ff5c8a] text-[#0b0a09]`;
const QUIET = `${SLAB} bg-[#161412] text-[#f4f2ee]`;
const EYEBROW = 'font-mono text-[11px] uppercase tracking-[0.2em] text-[#ff8fab]';

function Shell({
  online,
  onHome,
  children,
}: {
  online: Online | null;
  onHome?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-[#0b0a09] text-[#f4f2ee]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-48 left-1/2 size-[44rem] -translate-x-1/2 rounded-full bg-[#ff5c8a]/12 blur-3xl" />
        <div className="absolute -bottom-56 -right-32 size-[34rem] rounded-full bg-[#9d6bff]/10 blur-3xl" />
      </div>
      <header className="mx-auto flex w-full max-w-[40rem] items-center justify-between px-5 py-5">
        <button
          type="button"
          onClick={onHome}
          className="flex items-baseline gap-2"
          aria-label="Match"
        >
          <span className="text-[26px] font-semibold tracking-[-0.06em]">match</span>
          <span className="size-2 rounded-full bg-[#ff5c8a]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
            by Deck
          </span>
        </button>
        {online && online.total > 0 && (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em]">
            <span className="size-2 animate-pulse rounded-full bg-[#5dcaa5]" />
            {online.total.toLocaleString()} online
          </span>
        )}
      </header>
      <main className="mx-auto flex w-full max-w-[40rem] flex-1 flex-col justify-center px-5 pb-10">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-[40rem] px-5 pb-6 text-center text-[11px] leading-relaxed text-white/40">
        18+ only · Voice only, never recorded ·{' '}
        <a
          href="https://onedeck.africa/terms"
          className="underline underline-offset-4 hover:text-white/70"
        >
          Terms
        </a>{' '}
        ·{' '}
        <a
          href="https://onedeck.africa/privacy"
          className="underline underline-offset-4 hover:text-white/70"
        >
          Privacy
        </a>
      </footer>
    </div>
  );
}

function Pulse() {
  return (
    <div className="mx-auto size-10 animate-spin rounded-full border-2 border-white/15 border-t-[#ff5c8a]" />
  );
}

function SignedOut({ online }: { online: Online | null }) {
  return (
    <div className="text-center">
      <MorphShape set="love" className="mx-auto -mb-4 aspect-square w-full max-w-[19rem]" />
      <h1 className="text-[clamp(2.75rem,11vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.055em]">
        Two voices.
        <span className="block text-white/45">Two minutes.</span>
      </h1>
      <p className="mx-auto mt-5 max-w-sm text-[16px] leading-relaxed text-white/65">
        No photos, no profiles. Talk to someone online right now — and if you click, swap LagosLife
        usernames.
      </p>
      <a
        href={googleSignInUrl()}
        className="mt-8 inline-flex items-center justify-center gap-3 rounded-[8px] border-2 border-[#f4f2ee] bg-[#f4f2ee] px-6 py-4 text-[15px] font-medium text-[#1f1f1f] shadow-[4px_4px_0_#ff5c8a] transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_#ff5c8a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#ff5c8a]"
      >
        <GoogleG />
        Continue with Google
      </a>
      {online && online.total > 0 && (
        <p className="mt-6 font-mono text-[12px] uppercase tracking-[0.14em] text-white/50">
          {people('male', online.male)} · {people('female', online.female)} online
        </p>
      )}
    </div>
  );
}

function Setup({ onDone }: { onDone: (profile: MatchProfile) => void }) {
  const [gender, setGender] = useState<Gender | null>(null);
  const [handle, setHandle] = useState('');
  const [adult, setAdult] = useState(false);
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-7"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!gender) return setProblem('Choose whether you are a man or a woman.');
        if (!adult) return setProblem('Match is for people 18 and over.');
        setBusy(true);
        try {
          onDone(await matchApi.create({ gender, lagosLife: handle.trim(), adult: true }));
        } catch (error) {
          setProblem(
            error instanceof RequestError
              ? (error.fieldError('lagosLife') ?? error.message)
              : 'Something went wrong.',
          );
          setBusy(false);
        }
      }}
    >
      <div>
        <p className={EYEBROW}>One-time setup</p>
        <h1 className="mt-3 text-[clamp(2.25rem,9vw,3.5rem)] font-semibold leading-[1] tracking-[-0.05em]">
          I am a…
        </h1>
      </div>
      <div className="grid grid-cols-2 gap-4" role="radiogroup" aria-label="I am a">
        {(['male', 'female'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={gender === value}
            onClick={() => setGender(value)}
            className={cn(
              'rounded-[12px] border-2 border-[#f4f2ee] px-5 py-7 text-left shadow-[5px_5px_0_#f4f2ee] transition',
              gender === value ? 'bg-[#ff5c8a] text-[#0b0a09]' : 'bg-[#161412] hover:bg-[#1f1c19]',
            )}
          >
            <span className="block text-[30px] font-semibold tracking-[-0.04em]">
              {value === 'male' ? 'Man' : 'Woman'}
            </span>
            <span
              className={cn(
                'mt-1 block text-[13px]',
                gender === value ? 'text-[#0b0a09]/70' : 'text-white/55',
              )}
            >
              Matched with {value === 'male' ? 'women' : 'men'}
            </span>
          </button>
        ))}
      </div>
      <p className="-mt-3 text-[12px] text-white/45">This can’t be changed later.</p>
      <label className="block">
        <span className="text-[14px] font-medium">Your LagosLife username</span>
        <span className="ml-2 text-[12px] text-white/45">optional — needed only to share</span>
        <span className="mt-2 flex items-center rounded-[8px] border-2 border-white/20 bg-[#161412] focus-within:border-[#ff5c8a]">
          <span className="pl-4 font-mono text-[16px] text-white/45">@</span>
          <input
            value={handle}
            onChange={(event) => setHandle(event.target.value.replace(/^@/, ''))}
            placeholder="username"
            autoComplete="off"
            className="w-full bg-transparent px-2 py-3.5 font-mono text-[16px] outline-none placeholder:text-white/25"
          />
        </span>
      </label>
      <label className="flex items-start gap-3 text-[14px] leading-relaxed text-white/75">
        <input
          type="checkbox"
          checked={adult}
          onChange={(event) => setAdult(event.target.checked)}
          className="mt-1 size-4 accent-[#ff5c8a]"
        />
        I’m 18 or older. I understand calls connect my browser directly to the other person’s, so
        each can see the other’s network address, and that calls are never recorded.
      </label>
      {problem && <p className="text-[14px] text-[#ffb3c4]">{problem}</p>}
      <button type="submit" disabled={busy} className={cn(PRIMARY, 'w-full')}>
        {busy ? 'Saving…' : 'Continue'}
      </button>
    </form>
  );
}

function HandleEditor({
  value,
  onSave,
  cta = 'Save',
}: {
  value: string;
  onSave: (handle: string) => Promise<boolean>;
  cta?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="flex gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        await onSave(draft.trim());
        setBusy(false);
      }}
    >
      <span className="flex flex-1 items-center rounded-[8px] border-2 border-white/20 bg-[#161412] focus-within:border-[#ff5c8a]">
        <span className="pl-3 font-mono text-[15px] text-white/45">@</span>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value.replace(/^@/, ''))}
          placeholder="lagoslife username"
          aria-label="LagosLife username"
          className="w-full bg-transparent px-2 py-3 font-mono text-[15px] outline-none placeholder:text-white/25"
        />
      </span>
      <button type="submit" disabled={busy || !draft.trim()} className={cn(QUIET, 'px-4 py-3')}>
        {cta}
      </button>
    </form>
  );
}

function Lobby({
  profile,
  online,
  matches,
  onFind,
  onSaveHandle,
  onSignOut,
}: {
  profile: MatchProfile;
  online: Online | null;
  matches: { handle: string; at: string }[];
  onFind: () => void;
  onSaveHandle: (handle: string) => Promise<boolean>;
  onSignOut: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const them = other(profile.gender);
  return (
    <div className="space-y-10">
      <div className="text-center">
        <p className={EYEBROW}>Online now</p>
        <p className="mt-2 text-[clamp(5rem,24vw,8.5rem)] font-semibold leading-none tracking-[-0.06em] tabular-nums">
          {online ? online.total.toLocaleString() : '—'}
        </p>
        {online && (
          <p className="mt-3 text-[15px] text-white/60">
            <b className="font-semibold text-white">{people(them, online[them])}</b> you could meet
            · {people(profile.gender, online[profile.gender])}
          </p>
        )}
        <button
          type="button"
          onClick={onFind}
          className={cn(PRIMARY, 'mt-9 w-full max-w-xs py-5 text-[13px]')}
        >
          Find someone
        </button>
        <p className="mt-4 text-[13px] text-white/45">
          Two minutes, voice only. Leave whenever you like.
        </p>
      </div>

      <section className="rounded-[12px] border border-white/12 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">
            Your LagosLife
          </p>
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#ff8fab] hover:underline"
          >
            {editing ? 'Close' : profile.lagosLife ? 'Change' : 'Add'}
          </button>
        </div>
        {editing ? (
          <div className="mt-3">
            <HandleEditor
              value={profile.lagosLife}
              onSave={async (handle) => {
                const saved = await onSaveHandle(handle);
                if (saved) setEditing(false);
                return saved;
              }}
            />
          </div>
        ) : (
          <p className="mt-2 font-mono text-[18px]">
            {profile.lagosLife ? (
              `@${profile.lagosLife}`
            ) : (
              <span className="text-white/40">Not added — you’ll need it to share</span>
            )}
          </p>
        )}
      </section>

      {matches.length > 0 && (
        <section>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">
            Your matches
          </p>
          <ul className="mt-3 divide-y divide-white/10 rounded-[12px] border border-white/12">
            {matches.map((match) => (
              <li
                key={`${match.handle}-${match.at}`}
                className="flex items-center justify-between gap-3 px-5 py-3.5"
              >
                <span className="font-mono text-[16px]">@{match.handle}</span>
                <CopyButton text={`@${match.handle}`} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center">
        <button
          type="button"
          onClick={onSignOut}
          className="text-[13px] text-white/45 underline underline-offset-4 hover:text-white/70"
        >
          Sign out
        </button>
      </p>
    </div>
  );
}

function Waiting({
  profile,
  online,
  queue,
  onCancel,
}: {
  profile: MatchProfile;
  online: Online | null;
  queue: { position: number; waiting: Record<Gender, number> } | null;
  onCancel: () => void;
}) {
  const them = other(profile.gender);
  return (
    <div className="text-center">
      <MorphShape set="love" className="mx-auto aspect-square w-full max-w-[17rem]" />
      <h1 className="text-[clamp(2rem,8vw,3rem)] font-semibold tracking-[-0.05em]">
        Finding someone…
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-white/60">
        {queue ? (
          <>
            You’re <b className="font-semibold text-white">{ordinal(queue.position)}</b> in line
            {' · '}
            {queue.waiting[them] > 0
              ? `${people(them, queue.waiting[them])} waiting`
              : `${people(them, online?.[them] ?? 0)} online`}
          </>
        ) : (
          'Joining the line…'
        )}
      </p>
      {queue && queue.waiting[them] === 0 && (
        <p className="mx-auto mt-2 max-w-xs text-[13px] text-white/45">
          Nobody’s free on the other side right now. Stay here — you’ll be matched the moment
          someone is.
        </p>
      )}
      <button type="button" onClick={onCancel} className={cn(QUIET, 'mt-9')}>
        Stop looking
      </button>
    </div>
  );
}

function Connecting({ onLeave }: { onLeave: () => void }) {
  return (
    <div className="text-center">
      <div className="relative mx-auto grid size-40 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#ff5c8a]/25" />
        <span className="size-24 rounded-full bg-[#ff5c8a]" />
      </div>
      <h1 className="mt-10 text-[clamp(2rem,8vw,3rem)] font-semibold tracking-[-0.05em]">
        Matched.
      </h1>
      <p className="mt-3 text-[15px] text-white/60">
        Connecting your voices — the clock starts when you can hear each other.
      </p>
      <button type="button" onClick={onLeave} className={cn(QUIET, 'mt-9')}>
        Leave
      </button>
    </div>
  );
}

function Live({
  now,
  call,
  voice,
  muted,
  onMute,
  onLeave,
  onReport,
}: {
  now: number;
  call: CallInfo;
  voice: React.RefObject<VoiceCall | null>;
  muted: boolean;
  onMute: () => void;
  onLeave: () => void;
  onReport: () => void;
}) {
  const mine = useRef<HTMLSpanElement>(null);
  const theirs = useRef<HTMLSpanElement>(null);
  /* The voice rings breathe with each side's volume, outside React. */
  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const levels = voice.current?.levels() ?? { mine: 0, theirs: 0 };
      if (mine.current) mine.current.style.transform = `scale(${1 + levels.mine * 0.6})`;
      if (theirs.current) theirs.current.style.transform = `scale(${1 + levels.theirs * 0.6})`;
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [voice]);

  const left = Math.max(0, (call.endsAt ?? now) - now);
  const seconds = Math.ceil(left / 1000);
  const radius = 108;
  const around = 2 * Math.PI * radius;
  return (
    <div className="text-center">
      <div className="relative mx-auto size-[15rem]">
        <svg viewBox="0 0 240 240" className="size-full -rotate-90" aria-hidden="true">
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke="rgb(255 255 255 / 0.1)"
            strokeWidth="10"
          />
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke={seconds <= 15 ? '#ff7a59' : '#ff5c8a'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={around}
            strokeDashoffset={around * (1 - left / call.total)}
          />
        </svg>
        <p
          className="absolute inset-0 grid place-items-center font-mono text-[52px] font-semibold tabular-nums"
          aria-live="off"
        >
          {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
        </p>
      </div>
      <div className="mt-10 flex items-center justify-center gap-14">
        {[
          ['You', mine, muted ? 'Muted' : null],
          ['Them', theirs, null],
        ].map(([label, ref, note]) => (
          <div key={label as string} className="flex flex-col items-center gap-3">
            <span className="relative grid size-20 place-items-center">
              <span
                ref={ref as React.RefObject<HTMLSpanElement>}
                className="absolute inset-0 rounded-full bg-[#ff5c8a]/30 transition-transform duration-75"
              />
              <span
                className={cn(
                  'relative size-14 rounded-full border-2 border-[#f4f2ee]',
                  label === 'You' ? 'bg-[#161412]' : 'bg-[#ff5c8a]',
                )}
              />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/60">
              {(note as string) ?? (label as string)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onMute} className={QUIET} aria-pressed={muted}>
          {muted ? 'Unmute' : 'Mute'}
        </button>
        <button type="button" onClick={onLeave} className={cn(SLAB, 'bg-[#ff7a59] text-[#0b0a09]')}>
          End call
        </button>
        <button type="button" onClick={onReport} className={QUIET}>
          Report
        </button>
      </div>
    </div>
  );
}

function After({
  now,
  ended,
  profile,
  shared,
  revealed,
  onShare,
  onSaveHandle,
  onNext,
  onLobby,
  onReport,
}: {
  now: number;
  ended: Ended;
  profile: MatchProfile;
  shared: boolean;
  revealed: string | null;
  onShare: () => void;
  onSaveHandle: (handle: string) => Promise<boolean>;
  onNext: () => void;
  onLobby: () => void;
  onReport: () => void;
}) {
  const left = Math.max(0, Math.ceil((ended.shareUntil - now) / 1000));
  const title =
    ended.reason === 'time'
      ? 'Time’s up.'
      : ended.reason === 'no-connection'
        ? 'Couldn’t connect.'
        : ended.by === 'you'
          ? 'Call ended.'
          : 'They left the call.';
  return (
    <div className="text-center">
      <h1 className="text-[clamp(2.5rem,10vw,4rem)] font-semibold leading-[1] tracking-[-0.055em]">
        {title}
      </h1>

      {revealed ? (
        <div className="mx-auto mt-8 max-w-sm rounded-[14px] border-2 border-[#f4f2ee] bg-[#ff5c8a] p-7 text-[#0b0a09] shadow-[6px_6px_0_#f4f2ee]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em]">
            It’s a match — find them on LagosLife
          </p>
          <p className="mt-3 break-all font-mono text-[32px] font-semibold">@{revealed}</p>
          <div className="mt-4">
            <CopyButton text={`@${revealed}`} dark />
          </div>
        </div>
      ) : ended.canShare && left > 0 ? (
        <div className="mx-auto mt-6 max-w-sm space-y-4">
          <p className="text-[15px] leading-relaxed text-white/65">
            Want to keep talking? Share your LagosLife username. You’ll only see theirs — and they
            yours — if you both share.
          </p>
          {!profile.lagosLife ? (
            <HandleEditor value="" onSave={onSaveHandle} cta="Add" />
          ) : shared ? (
            <p className="rounded-[10px] border border-white/15 bg-white/5 px-4 py-4 text-[15px]">
              Shared <b className="font-mono">@{profile.lagosLife}</b>. Waiting to see if they share
              too…
            </p>
          ) : (
            <button type="button" onClick={onShare} className={cn(PRIMARY, 'w-full py-5')}>
              Share my LagosLife
            </button>
          )}
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/45">
            {left}s to decide
          </p>
        </div>
      ) : (
        <p className="mt-5 text-[15px] text-white/60">
          {ended.reason === 'time'
            ? shared
              ? 'They didn’t share this time.'
              : 'The time to share has passed.'
            : ended.reason === 'no-connection'
              ? 'Your voices couldn’t reach each other. Try someone new.'
              : 'Sharing opens only after a full two minutes.'}
        </p>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onNext} className={PRIMARY}>
          Next person
        </button>
        <button type="button" onClick={onLobby} className={QUIET}>
          Done
        </button>
      </div>
      {ended.reason !== 'reported' && (
        <button
          type="button"
          onClick={onReport}
          className="mt-6 text-[13px] text-white/45 underline underline-offset-4 hover:text-white/70"
        >
          Report this person
        </button>
      )}
    </div>
  );
}

function Paused({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="text-center">
      <h1 className="text-[clamp(2rem,8vw,3rem)] font-semibold tracking-[-0.05em]">
        Your account is paused.
      </h1>
      <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-white/60">
        Several people reported you recently, so Match is paused for a week. If you think this is a
        mistake, contact Deck support.
      </p>
      <button type="button" onClick={onSignOut} className={cn(QUIET, 'mt-8')}>
        Sign out
      </button>
    </div>
  );
}

const REASONS: [string, string][] = [
  ['abusive', 'Rude or abusive'],
  ['sexual', 'Sexual or explicit'],
  ['underage', 'Seems under 18'],
  ['spam', 'Spam or scam'],
  ['other', 'Something else'],
];

function ReportSheet({
  onReport,
  onClose,
}: {
  onReport: (reason: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/60 p-4 sm:place-items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Report"
    >
      <div className="w-full max-w-sm rounded-[14px] border-2 border-[#f4f2ee] bg-[#161412] p-6 shadow-[6px_6px_0_#f4f2ee]">
        <h2 className="text-[22px] font-semibold tracking-[-0.03em]">What happened?</h2>
        <p className="mt-1 text-[13px] text-white/55">
          They’ll be blocked and the call ends. They won’t know who reported them.
        </p>
        <div className="mt-5 grid gap-2">
          {REASONS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onReport(value)}
              className="rounded-[8px] border border-white/15 px-4 py-3 text-left text-[15px] hover:border-[#ff5c8a] hover:bg-white/5"
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2 text-[13px] text-white/55 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function CopyButton({ text, dark = false }: { text: string; dark?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          window.setTimeout(() => setDone(false), 1500);
        });
      }}
      className={cn(
        'rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em]',
        dark
          ? 'bg-[#0b0a09] text-[#f4f2ee]'
          : 'border border-white/20 text-white/75 hover:text-white',
      )}
    >
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function ordinal(n: number): string {
  const suffix =
    n % 100 >= 11 && n % 100 <= 13
      ? 'th'
      : (({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th');
  return `${n}${suffix}`;
}

/** The time, refreshed four times a second while `running`: for the countdowns. */
function useNow(running: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [running]);
  return now;
}
