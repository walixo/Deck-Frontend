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
  type MatchHandles,
  type MatchProfile,
  type Online,
} from './matchApi';
import { setMusicMuted, useMusic, useMusicMuted } from './music';
import {
  isInstalled,
  isIOS,
  pushSupported,
  subscribeToPings,
  unsubscribeFromPings,
  useInstallPrompt,
  useWakeLock,
} from './device';
import { VoiceCall } from './voiceCall';

/**
 * Match — match.onedeck.africa. Two voices, two minutes.
 *
 * Sign in with Google, say once whether you are a man or a woman, and press
 * Find someone: men are matched only with women who are online and waiting,
 * and women only with men. The two talk, voice only, for two minutes. When
 * the time is up each may press Share; if both do, each sees the other's
 * X or Instagram usernames and they carry on there.
 *
 * One screen at a time, driven by the live line (see `matchApi.ts`): the
 * server decides matches and keeps the clock; this page asks for the
 * microphone, runs the call (`voiceCall.ts`) and shows where things stand.
 *
 * Match is open 8pm to 10pm, Lagos time. Until enough people are on, it says
 * "busy" or "quiet" rather than showing a small number, and anyone can ask to
 * be pinged (browser push) when someone on the other side arrives.
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

interface Queue {
  position: number;
  otherWaiting: boolean;
}

interface Extend {
  mine: boolean;
  theirs: boolean;
  extended: boolean;
}

const other = (gender: Gender): Gender => (gender === 'male' ? 'female' : 'male');
const people = (gender: Gender, count: number) =>
  `${count} ${gender === 'male' ? (count === 1 ? 'man' : 'men') : count === 1 ? 'woman' : 'women'}`;
const plural = (gender: Gender) => (gender === 'male' ? 'Men' : 'Women');

/* Times are Lagos times: Match keeps Lagos evening hours. */
const clock = new Intl.DateTimeFormat('en-NG', {
  timeZone: 'Africa/Lagos',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});
const timeOf = (ms: number) => clock.format(ms).toLowerCase().replace(':00', '').replace(/\s/g, '');

function countdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

/** The header's one word on how Match is right now. */
function status(online: Online): string {
  if (!online.hours.open) return `Opens ${timeOf(online.hours.opensAt)}`;
  if (online.live) return `${online.live.total.toLocaleString()} online`;
  return online.available.male && online.available.female ? 'Busy' : 'Quiet right now';
}

export function MatchApp({ signInError = '' }: { signInError?: string }) {
  const [screen, setScreen] = useState<Screen>(() => (getStoredToken() ? 'loading' : 'signedOut'));
  const [profile, setProfile] = useState<MatchProfile | null>(null);
  const [online, setOnline] = useState<Online | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [extend, setExtend] = useState<Extend>({ mine: false, theirs: false, extended: false });
  const [call, setCall] = useState<CallInfo | null>(null);
  const [ended, setEnded] = useState<Ended | null>(null);
  const [shared, setShared] = useState(false);
  const [revealed, setRevealed] = useState<MatchHandles | null>(null);
  const [muted, setMuted] = useState(false);
  const [notice, setNotice] = useState(signInError);
  const [reporting, setReporting] = useState(false);
  const [matches, setMatches] = useState<{ handles: MatchHandles; at: string }[]>([]);
  const closed = online ? !online.hours.open : false;
  const now = useNow(screen === 'live' || screen === 'ended' || (screen === 'lobby' && closed));
  useWakeLock(screen === 'connecting' || screen === 'live');
  /* Music everywhere but a call — and not while a call is being set up. */
  useMusic(['signedOut', 'setup', 'lobby', 'waiting', 'ended'].includes(screen));

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
        setQueue(raw as Queue);
        break;
      case 'closed':
        dropMic();
        setScreen((current) => (current === 'waiting' ? 'lobby' : current));
        setNotice('Match has closed for tonight. Back tomorrow at 8pm.');
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
        setExtend({ mine: false, theirs: false, extended: false });
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
      case 'extend': {
        const votes = raw as { mine: boolean; theirs: boolean };
        setExtend((current) => ({ ...current, mine: votes.mine, theirs: votes.theirs }));
        break;
      }
      case 'extended': {
        const more = raw as { endsAt: number; serverNow: number };
        const offset = more.serverNow - Date.now();
        setCall(
          (current) =>
            current && {
              ...current,
              endsAt: more.endsAt - offset,
              total: current.total + 60_000,
            },
        );
        setExtend({ mine: true, theirs: true, extended: true });
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
        setRevealed((raw as { handles: MatchHandles }).handles);
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
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';
      setNotice(
        name === 'NotFoundError'
          ? 'No microphone found. Plug one in or switch devices, then try again.'
          : name === 'NotReadableError'
            ? 'Your microphone is busy in another app. Close it there and try again.'
            : 'Microphone blocked. Click the icon at the left of the address bar, allow Microphone, then press Find someone again.',
      );
      return;
    }
    try {
      const { position } = await matchApi.queue();
      setQueue((current) => ({ position, otherWaiting: current?.otherWaiting ?? false }));
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

  const askForMore = () => {
    if (!call) return;
    setExtend((current) => ({ ...current, mine: true }));
    void matchApi.extend(call.callId).catch(() => undefined);
  };

  /* Pings: this browser's push subscription, on or off. */
  const togglePings = async () => {
    if (!profile) return;
    setNotice('');
    try {
      if (profile.pings) {
        await matchApi.unsubscribe(await unsubscribeFromPings());
        setProfile({ ...profile, pings: false });
        return;
      }
      if (!online?.pushKey) return;
      const subscription = await subscribeToPings(online.pushKey);
      if (!subscription) {
        setNotice('Allow notifications for Match to get pings.');
        return;
      }
      await matchApi.subscribe(subscription);
      setProfile({ ...profile, pings: true });
    } catch {
      setNotice('Could not change pings just now.');
    }
  };

  const requestSection = async (note: string) => {
    try {
      setProfile(await matchApi.requestSection(note));
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not send that.');
      return false;
    }
  };

  const share = async () => {
    if (!ended) return;
    try {
      await matchApi.share(ended.callId);
      setShared(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not share.');
    }
  };

  const saveHandles = async (handles: MatchHandles) => {
    try {
      setProfile(await matchApi.setHandles(handles));
      setNotice('');
      return true;
    } catch (error) {
      setNotice(
        error instanceof RequestError
          ? (error.fieldError('x') ?? error.fieldError('instagram') ?? error.message)
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
        now={now}
        profile={profile}
        online={online}
        matches={matches}
        onFind={find}
        onSaveHandles={saveHandles}
        onTogglePings={togglePings}
        onRequestSection={requestSection}
        onSignOut={signOut}
      />
    );
  else if (screen === 'waiting' && profile)
    body = (
      <Waiting
        profile={profile}
        online={online}
        queue={queue}
        onCancel={cancel}
        onTogglePings={togglePings}
      />
    );
  else if (screen === 'connecting') body = <Connecting onLeave={hangUp} />;
  else if (screen === 'live' && call)
    body = (
      <Live
        now={now}
        call={call}
        voice={voice}
        muted={muted}
        extend={extend}
        onExtend={askForMore}
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
        onSaveHandles={saveHandles}
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
        <div className="flex items-center gap-2">
          {online && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em]">
              <span
                className={cn(
                  'size-2 rounded-full',
                  online.hours.open ? 'animate-pulse bg-[#5dcaa5]' : 'bg-white/35',
                )}
              />
              {status(online)}
            </span>
          )}
          <MusicToggle />
        </div>
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

/** Music on or off, remembered on this device. */
function MusicToggle() {
  const muted = useMusicMuted();
  return (
    <button
      type="button"
      onClick={() => setMusicMuted(!muted)}
      aria-pressed={!muted}
      aria-label={muted ? 'Turn music on' : 'Turn music off'}
      title={muted ? 'Music off' : 'Music on'}
      className="grid size-[34px] place-items-center rounded-full border border-white/15 bg-white/5 text-white/75 hover:text-white"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
        {muted ? (
          <path d="M17 9l5 6M22 9l-5 6" strokeLinecap="round" />
        ) : (
          <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" strokeLinecap="round" />
        )}
      </svg>
    </button>
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
        No photos, no profiles. Talk to someone online right now — and if you click, swap X or
        Instagram usernames.
      </p>
      <a
        href={googleSignInUrl()}
        className="mt-8 inline-flex items-center justify-center gap-3 rounded-[8px] border-2 border-[#f4f2ee] bg-[#f4f2ee] px-6 py-4 text-[15px] font-medium text-[#1f1f1f] shadow-[4px_4px_0_#ff5c8a] transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_#ff5c8a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#ff5c8a]"
      >
        <GoogleG />
        Continue with Google
      </a>
      <p className="mt-6 font-mono text-[12px] uppercase tracking-[0.14em] text-white/50">
        {online && !online.hours.open
          ? `Live every night ${timeOf(online.hours.opensAt)}–${timeOf(online.hours.closesAt)} · Lagos time`
          : online?.live
            ? `${people('male', online.live.male)} · ${people('female', online.live.female)} online`
            : 'Live now · every night 8–10pm'}
      </p>
    </div>
  );
}

function Setup({ onDone }: { onDone: (profile: MatchProfile) => void }) {
  const [gender, setGender] = useState<Gender | null>(null);
  const [handles, setHandles] = useState<MatchHandles>({ x: '', instagram: '' });
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
          onDone(
            await matchApi.create({
              gender,
              x: handles.x.trim(),
              instagram: handles.instagram.trim(),
              adult: true,
            }),
          );
        } catch (error) {
          setProblem(
            error instanceof RequestError
              ? (error.fieldError('x') ?? error.fieldError('instagram') ?? error.message)
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
      <p className="-mt-3 text-[12px] text-white/45">
        You can’t switch this yourself later — if you choose wrong, ask us to change it.
      </p>
      <div>
        <p className="text-[14px] font-medium">
          Your X and Instagram
          <span className="ml-2 text-[12px] font-normal text-white/45">
            optional — one is needed to share
          </span>
        </p>
        <div className="mt-2 space-y-2">
          <HandleInput site="x" value={handles.x} onChange={(x) => setHandles({ ...handles, x })} />
          <HandleInput
            site="instagram"
            value={handles.instagram}
            onChange={(instagram) => setHandles({ ...handles, instagram })}
          />
        </div>
      </div>
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

const SITES = {
  x: { name: 'X', field: 'X username', url: (handle: string) => `https://x.com/${handle}` },
  instagram: {
    name: 'Instagram',
    field: 'Instagram username',
    url: (handle: string) => `https://www.instagram.com/${handle}/`,
  },
} as const;
type Site = keyof typeof SITES;

/** The usernames someone has, in a fixed order, with where each one lives. */
const linksFor = (handles: MatchHandles) =>
  (['x', 'instagram'] as const)
    .filter((site) => handles[site])
    .map((site) => ({
      site,
      handle: handles[site],
      href: SITES[site].url(encodeURIComponent(handles[site])),
    }));

/** One username field: pasted links and a leading @ are tidied as you type. */
function HandleInput({
  site,
  value,
  onChange,
}: {
  site: Site;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <span className="flex items-center rounded-[8px] border-2 border-white/20 bg-[#161412] focus-within:border-[#ff5c8a]">
      <span className="w-24 shrink-0 pl-4 font-mono text-[12px] uppercase tracking-[0.12em] text-white/45">
        {SITES[site].name}
      </span>
      <span className="font-mono text-[16px] text-white/45">@</span>
      <input
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
              .replace(/^(https?:\/\/)?(www\.)?(x|twitter|instagram)\.com\//i, '')
              .replace(/^@/, ''),
          )
        }
        placeholder="username"
        aria-label={SITES[site].field}
        autoComplete="off"
        autoCapitalize="none"
        className="w-full bg-transparent px-2 py-3.5 font-mono text-[16px] outline-none placeholder:text-white/25"
      />
    </span>
  );
}

function HandlesEditor({
  value,
  onSave,
  cta = 'Save',
}: {
  value: MatchHandles;
  onSave: (handles: MatchHandles) => Promise<boolean>;
  cta?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        await onSave({ x: draft.x.trim(), instagram: draft.instagram.trim() });
        setBusy(false);
      }}
    >
      <HandleInput site="x" value={draft.x} onChange={(x) => setDraft({ ...draft, x })} />
      <HandleInput
        site="instagram"
        value={draft.instagram}
        onChange={(instagram) => setDraft({ ...draft, instagram })}
      />
      <button
        type="submit"
        disabled={busy || (!draft.x.trim() && !draft.instagram.trim())}
        className={cn(QUIET, 'w-full py-3')}
      >
        {cta}
      </button>
    </form>
  );
}

function Lobby({
  now,
  profile,
  online,
  matches,
  onFind,
  onSaveHandles,
  onTogglePings,
  onRequestSection,
  onSignOut,
}: {
  now: number;
  profile: MatchProfile;
  online: Online | null;
  matches: { handles: MatchHandles; at: string }[];
  onFind: () => void;
  onSaveHandles: (handles: MatchHandles) => Promise<boolean>;
  onTogglePings: () => void;
  onRequestSection: (note: string) => Promise<boolean>;
  onSignOut: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const them = other(profile.gender);
  const open = online?.hours.open ?? true;
  return (
    <div className="space-y-10">
      {open ? (
        <div className="text-center">
          <p className={EYEBROW}>
            Live now{online ? ` · until ${timeOf(online.hours.closesAt)}` : ''}
          </p>
          <p className="mt-2 text-[clamp(4.5rem,22vw,8rem)] font-semibold leading-none tracking-[-0.06em] tabular-nums">
            {online?.live
              ? online.live.total.toLocaleString()
              : online?.available[them]
                ? 'Busy'
                : 'Quiet'}
          </p>
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-white/60">
            {online?.live ? (
              <>
                <b className="font-semibold text-white">{people(them, online.live[them])}</b> you
                could meet · {people(profile.gender, online.live[profile.gender])}
              </>
            ) : online?.available[them] ? (
              `${plural(them)} are on now. Press Find someone.`
            ) : (
              'Quiet right now — nobody on the other side yet. Press Find someone and you’ll be first in line.'
            )}
          </p>
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
          {isIOS() && (
            <p className="mx-auto mt-3 max-w-xs text-[12px] text-white/40">
              On iPhone, keep Match open during a call — locking the screen ends it.
            </p>
          )}
        </div>
      ) : (
        <div className="text-center">
          <MorphShape set="love" className="mx-auto -mb-2 aspect-square w-full max-w-[12rem]" />
          <p className={EYEBROW}>Closed right now</p>
          <p className="mt-2 text-[clamp(4rem,20vw,7rem)] font-semibold leading-none tracking-[-0.06em]">
            {online ? timeOf(online.hours.opensAt) : '8pm'}
          </p>
          <p className="mt-3 text-[15px] text-white/60">
            Match is live every night{' '}
            {online ? `${timeOf(online.hours.opensAt)}–${timeOf(online.hours.closesAt)}` : '8–10pm'}
            , Lagos time
            {online ? ` · opens in ${countdown(online.hours.opensAt - now)}` : ''}.
          </p>
        </div>
      )}

      <PingCard online={online} profile={profile} onToggle={onTogglePings} />
      <InstallCard />

      <section className="rounded-[12px] border border-white/12 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">
            Your X and Instagram
          </p>
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#ff8fab] hover:underline"
          >
            {editing ? 'Close' : profile.x || profile.instagram ? 'Change' : 'Add'}
          </button>
        </div>
        {editing ? (
          <div className="mt-3">
            <HandlesEditor
              value={{ x: profile.x, instagram: profile.instagram }}
              onSave={async (handles) => {
                const saved = await onSaveHandles(handles);
                if (saved) setEditing(false);
                return saved;
              }}
            />
          </div>
        ) : (
          <div className="mt-2 space-y-1">
            {linksFor(profile).map((link) => (
              <p key={link.site} className="font-mono text-[17px]">
                @{link.handle}{' '}
                <span className="text-[12px] uppercase tracking-[0.12em] text-white/45">
                  on {SITES[link.site].name}
                </span>
              </p>
            ))}
            {!profile.x && !profile.instagram && (
              <p className="text-[15px] text-white/40">Not added — you’ll need one to share</p>
            )}
          </div>
        )}
      </section>

      {matches.length > 0 && (
        <section>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">
            Your matches
          </p>
          <ul className="mt-3 divide-y divide-white/10 rounded-[12px] border border-white/12">
            {matches.map((match) => (
              <li key={match.at} className="space-y-2 px-5 py-3.5">
                {linksFor(match.handles).map((link) => (
                  <div key={link.site} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate font-mono text-[16px]">@{link.handle}</span>
                    <OpenLink href={link.href} site={link.site} />
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </section>
      )}

      <SectionCard profile={profile} onRequest={onRequestSection} />

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

/** "Ping me when someone's free" — where this browser can do it. */
function PingCard({
  online,
  profile,
  onToggle,
  compact = false,
}: {
  online: Online | null;
  profile: MatchProfile;
  onToggle: () => void;
  compact?: boolean;
}) {
  if (!online?.pushKey || !pushSupported()) {
    if (isIOS() && !isInstalled() && online?.pushKey && !compact) {
      return (
        <p className="text-center text-[13px] text-white/45">
          Add Match to your Home Screen to get pings when someone’s free.
        </p>
      );
    }
    return null;
  }
  const them = plural(other(profile.gender)).toLowerCase();
  return (
    <section
      className={cn(
        'flex items-center justify-between gap-4 rounded-[12px] border border-white/12 bg-white/[0.03]',
        compact ? 'mx-auto mt-6 max-w-sm p-4 text-left' : 'p-5',
      )}
    >
      <div>
        <p className="text-[15px] font-medium">Ping me when someone’s free</p>
        <p className="mt-0.5 text-[13px] text-white/50">
          A notification when {them} come on — at most once a night.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={profile.pings}
        aria-label="Ping me when someone’s free"
        onClick={onToggle}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full border-2 border-[#f4f2ee] transition-colors',
          profile.pings ? 'bg-[#ff5c8a]' : 'bg-[#161412]',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-[#f4f2ee] transition-[left]',
            profile.pings ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </section>
  );
}

/** Install Match to the home screen: the browser's own offer, or iPhone steps. */
function InstallCard() {
  const { canInstall, install } = useInstallPrompt();
  if (isInstalled()) return null;
  if (canInstall) {
    return (
      <section className="flex items-center justify-between gap-4 rounded-[12px] border border-white/12 bg-white/[0.03] p-5">
        <div>
          <p className="text-[15px] font-medium">Get Match on your home screen</p>
          <p className="mt-0.5 text-[13px] text-white/50">
            Opens like an app, straight to the lobby.
          </p>
        </div>
        <button type="button" onClick={() => void install()} className={cn(QUIET, 'px-4 py-3')}>
          Install
        </button>
      </section>
    );
  }
  if (isIOS()) {
    return (
      <section className="rounded-[12px] border border-white/12 bg-white/[0.03] p-5">
        <p className="text-[15px] font-medium">Get Match on your home screen</p>
        <p className="mt-1 text-[13px] leading-relaxed text-white/55">
          In Safari, tap <b className="text-white">Share</b>, then{' '}
          <b className="text-white">Add to Home Screen</b>.
        </p>
      </section>
    );
  }
  return null;
}

/** The section a person is in, and how to ask for it to be changed. */
function SectionCard({
  profile,
  onRequest,
}: {
  profile: MatchProfile;
  onRequest: (note: string) => Promise<boolean>;
}) {
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <section className="text-center text-[13px] text-white/45">
      <p>
        You’re in the {profile.gender === 'male' ? 'men’s' : 'women’s'} section.{' '}
        {profile.sectionRequested ? (
          <span className="text-white/70">Change requested — we’ll switch it if it’s right.</span>
        ) : (
          !asking && (
            <button
              type="button"
              onClick={() => setAsking(true)}
              className="underline underline-offset-4 hover:text-white/70"
            >
              Chose wrong? Ask to change
            </button>
          )
        )}
      </p>
      {asking && !profile.sectionRequested && (
        <form
          className="mx-auto mt-3 max-w-sm space-y-2 text-left"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            if (await onRequest(note.trim())) setAsking(false);
            setBusy(false);
          }}
        >
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Anything we should know? (optional)"
            className="w-full rounded-[8px] border-2 border-white/20 bg-[#161412] px-3 py-2 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-[#ff5c8a]"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={cn(QUIET, 'px-4 py-2.5')}>
              Send request
            </button>
            <button
              type="button"
              onClick={() => setAsking(false)}
              className="px-3 text-[13px] text-white/55 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function Waiting({
  profile,
  online,
  queue,
  onCancel,
  onTogglePings,
}: {
  profile: MatchProfile;
  online: Online | null;
  queue: Queue | null;
  onCancel: () => void;
  onTogglePings: () => void;
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
            {online?.live ? ` · ${people(them, online.live[them])} online` : ''}
          </>
        ) : (
          'Joining the line…'
        )}
      </p>
      {queue && !queue.otherWaiting && (
        <p className="mx-auto mt-2 max-w-xs text-[13px] text-white/45">
          Quiet on the other side right now. Stay here — you’ll be matched the moment someone
          arrives.
        </p>
      )}
      {queue && !queue.otherWaiting && !profile.pings && (
        <PingCard online={online} profile={profile} onToggle={onTogglePings} compact />
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
      {isIOS() && (
        <p className="mx-auto mt-2 max-w-xs text-[12px] text-white/40">
          Keep this screen open — locking your iPhone ends the call.
        </p>
      )}
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
  extend,
  onExtend,
  onMute,
  onLeave,
  onReport,
}: {
  now: number;
  call: CallInfo;
  voice: React.RefObject<VoiceCall | null>;
  muted: boolean;
  extend: Extend;
  onExtend: () => void;
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
      <div className="mt-8 min-h-14">
        {extend.extended ? (
          <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[#5dcaa5]">
            +1 minute added
          </p>
        ) : (
          (seconds <= 20 || extend.theirs) && (
            <button
              type="button"
              onClick={onExtend}
              disabled={extend.mine}
              className={cn(
                SLAB,
                extend.theirs && !extend.mine
                  ? 'animate-pulse bg-[#5dcaa5] text-[#0b0a09]'
                  : 'bg-[#161412] text-[#f4f2ee]',
              )}
            >
              {extend.mine
                ? 'Waiting for them…'
                : extend.theirs
                  ? 'They want 1 more minute · +1'
                  : '+1 minute'}
            </button>
          )
        )}
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
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
  onSaveHandles,
  onNext,
  onLobby,
  onReport,
}: {
  now: number;
  ended: Ended;
  profile: MatchProfile;
  shared: boolean;
  revealed: MatchHandles | null;
  onShare: () => void;
  onSaveHandles: (handles: MatchHandles) => Promise<boolean>;
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
            It’s a match — carry on here
          </p>
          <div className="mt-4 space-y-4">
            {linksFor(revealed).map((link) => (
              <div key={link.site}>
                <p className="break-all font-mono text-[28px] font-semibold leading-tight">
                  @{link.handle}
                </p>
                <div className="mt-2">
                  <OpenLink href={link.href} site={link.site} dark />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : ended.canShare && left > 0 ? (
        <div className="mx-auto mt-6 max-w-sm space-y-4">
          <p className="text-[15px] leading-relaxed text-white/65">
            Want to keep talking? Share your X or Instagram. You’ll only see theirs — and they yours
            — if you both share.
          </p>
          {!profile.x && !profile.instagram ? (
            <HandlesEditor value={{ x: '', instagram: '' }} onSave={onSaveHandles} cta="Add" />
          ) : shared ? (
            <p className="rounded-[10px] border border-white/15 bg-white/5 px-4 py-4 text-[15px]">
              Shared. Waiting to see if they share too…
            </p>
          ) : (
            <button type="button" onClick={onShare} className={cn(PRIMARY, 'w-full py-5')}>
              Share my{' '}
              {linksFor(profile)
                .map((link) => SITES[link.site].name)
                .join(' & ')}
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

/** Opens their profile in the X or Instagram app, or the site. */
function OpenLink({ href, site, dark = false }: { href: string; site: Site; dark?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-block shrink-0 rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em]',
        dark
          ? 'bg-[#0b0a09] text-[#f4f2ee]'
          : 'border border-white/20 text-white/75 hover:text-white',
      )}
    >
      Open on {SITES[site].name}
    </a>
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
