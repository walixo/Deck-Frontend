import { matchApi } from './matchApi';

/**
 * One two-minute voice call, browser to browser.
 *
 * WebRTC carries the audio directly between the two people; Deck only passes
 * the set-up across (the offer, the answer and the network candidates each
 * browser finds). The man's browser offers and the woman's answers, so
 * neither waits on the other to decide. STUN servers tell each browser its
 * public address and the two connect directly, so each learns the other's
 * network address — the trade chosen for Match. Where the networks can't
 * reach each other (common on mobile data), Cloudflare's TURN relay carries
 * the still-encrypted audio instead, if Deck has it configured.
 *
 * When both can hear each other the call tells Deck, which starts the clock.
 * It also measures how loud each side is, for the orb on screen — from the
 * connection's own statistics, never by routing the call's audio through Web
 * Audio. Tapping the live tracks with an AudioContext (especially one made
 * before the microphone opened, at another sample rate) garbles them into
 * static on some phones, iPhones above all.
 */

/** Direct-only, for when the server's list couldn't be fetched. */
const DIRECT_ONLY: RTCIceServer[] = [
  { urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] },
];

export type CallState = 'connecting' | 'connected' | 'failed';

/** What one side reports about a call when it ends. */
export interface CallQuality {
  connected: boolean;
  route: 'direct' | 'relay' | 'none';
  lossPct?: number;
  concealedPct?: number;
  jitterMs?: number;
  rttMs?: number;
  heardSeconds?: number;
}

const round = (value: number) => Math.round(value * 10) / 10;

export class VoiceCall {
  private pc: RTCPeerConnection;
  private audio = new Audio();
  private pending: RTCIceCandidateInit[] = [];
  private told = false;
  /* Only where the browser's statistics lack a level: a meter on a copy of
     the microphone, never on the track being sent or the one being heard. */
  private localMeter: AnalyserNode | null = null;
  private meterTrack: MediaStreamTrack | null = null;
  private samples = new Uint8Array(512);
  private level = { mine: 0, theirs: 0 };
  private poll = 0;
  /* Set-up is applied strictly in arrival order: an answer before its offer
     has finished applying would be refused. */
  private chain: Promise<void> = Promise.resolve();

  constructor(
    private readonly callId: string,
    private readonly caller: boolean,
    private readonly mic: MediaStream,
    private readonly context: AudioContext,
    private readonly onState: (state: CallState) => void,
    iceServers: RTCIceServer[] = DIRECT_ONLY,
  ) {
    this.pc = new RTCPeerConnection({ iceServers });
    for (const track of mic.getTracks()) this.pc.addTrack(track, mic);
    this.poll = window.setInterval(() => void this.measure(), 100);

    this.pc.onicecandidate = ({ candidate }) => {
      if (candidate) void matchApi.signal(this.callId, { candidate: candidate.toJSON() });
    };
    this.pc.ontrack = ({ streams }) => {
      const [remote] = streams;
      if (!remote) return;
      this.audio.srcObject = remote;
      this.audio.autoplay = true;
      void this.audio.play().catch(() => undefined);
    };
    this.pc.onconnectionstatechange = () => {
      const state = this.pc.connectionState;
      if (state === 'connected') {
        if (!this.told) {
          this.told = true;
          void this.route().then((route) =>
            matchApi.connected(this.callId, route).catch(() => undefined),
          );
        }
        this.onState('connected');
      } else if (state === 'failed') {
        this.onState('failed');
      }
    };
  }

  /** Which way the audio went: straight across, or through the relay. */
  private async route(): Promise<'direct' | 'relay'> {
    try {
      const stats = await this.pc.getStats();
      let pairId = '';
      stats.forEach((report) => {
        if (report.type === 'transport' && report.selectedCandidatePairId) {
          pairId = report.selectedCandidatePairId as string;
        }
      });
      let relayed = false;
      stats.forEach((report) => {
        const chosen = pairId
          ? report.id === pairId
          : report.type === 'candidate-pair' && report.state === 'succeeded' && report.nominated;
        if (!chosen || report.type !== 'candidate-pair') return;
        for (const side of [report.localCandidateId, report.remoteCandidateId]) {
          if (stats.get(side as string)?.candidateType === 'relay') relayed = true;
        }
      });
      return relayed ? 'relay' : 'direct';
    } catch {
      return 'direct';
    }
  }

  /**
   * Both sides' loudness from the connection's statistics: what is arriving
   * (inbound) and what the microphone is giving (media source). A browser
   * without the second gets a meter on a cloned microphone track instead.
   */
  private async measure() {
    try {
      const stats = await this.pc.getStats();
      let mine: number | undefined;
      let theirs: number | undefined;
      stats.forEach((report) => {
        if (report.kind !== 'audio' || typeof report.audioLevel !== 'number') return;
        if (report.type === 'inbound-rtp') theirs = report.audioLevel;
        if (report.type === 'media-source') mine = report.audioLevel;
      });
      if (mine === undefined) mine = this.meterLevel();
      /* audioLevel is linear and quiet for speech; lifted to read like the old meter. */
      this.level = {
        mine: Math.min(1, Math.sqrt(mine) * 1.4),
        theirs: Math.min(1, Math.sqrt(theirs ?? 0) * 1.4),
      };
    } catch {
      /* Closed between ticks. */
    }
  }

  private meterLevel(): number {
    if (!this.localMeter) {
      const track = this.mic.getAudioTracks()[0];
      if (!track || this.context.state === 'closed') return 0;
      this.meterTrack = track.clone();
      this.localMeter = this.context.createAnalyser();
      this.localMeter.fftSize = 512;
      this.context
        .createMediaStreamSource(new MediaStream([this.meterTrack]))
        .connect(this.localMeter);
    }
    this.localMeter.getByteTimeDomainData(this.samples);
    let sum = 0;
    for (const value of this.samples) sum += ((value - 128) / 128) ** 2;
    /* As a level, so it is lifted the same way as the statistics. */
    return Math.min(1, Math.sqrt(sum / this.samples.length) * 4) ** 2 / 2;
  }

  /** The caller makes the offer; the other side waits for it. */
  async start() {
    if (!this.caller) return;
    await this.pc.setLocalDescription(await this.pc.createOffer());
    await matchApi.signal(this.callId, { sdp: this.pc.localDescription!.toJSON() });
  }

  /** Set-up from the other browser, passed on by Deck. */
  handle(data: { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }) {
    this.chain = this.chain.then(() => this.apply(data)).catch(() => undefined);
  }

  private async apply(data: { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }) {
    if (data.sdp) {
      await this.pc.setRemoteDescription(data.sdp);
      if (data.sdp.type === 'offer') {
        await this.pc.setLocalDescription(await this.pc.createAnswer());
        await matchApi.signal(this.callId, { sdp: this.pc.localDescription!.toJSON() });
      }
      for (const candidate of this.pending.splice(0)) {
        await this.pc.addIceCandidate(candidate).catch(() => undefined);
      }
    } else if (data.candidate) {
      if (this.pc.remoteDescription)
        await this.pc.addIceCandidate(data.candidate).catch(() => undefined);
      else this.pending.push(data.candidate);
    }
  }

  setMuted(muted: boolean) {
    for (const track of this.mic.getAudioTracks()) track.enabled = !muted;
  }

  /**
   * How the call sounded from this side, read just before it closes: which
   * way the audio went, how much of it was lost or patched over (concealed —
   * what garbled or "static" audio looks like in the numbers), jitter and
   * round trip. Never the audio itself.
   */
  async quality(): Promise<CallQuality> {
    const route = this.told ? await this.route() : 'none';
    const out: CallQuality = { connected: this.told, route };
    try {
      const stats = await this.pc.getStats();
      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.kind === 'audio') {
          const received = Number(report.packetsReceived ?? 0);
          const lost = Math.max(0, Number(report.packetsLost ?? 0));
          if (received + lost > 0) out.lossPct = round((lost / (received + lost)) * 100);
          if (typeof report.jitter === 'number') out.jitterMs = round(report.jitter * 1000);
          const samples = Number(report.totalSamplesReceived ?? 0);
          if (samples > 0) {
            out.concealedPct = round((Number(report.concealedSamples ?? 0) / samples) * 100);
            out.heardSeconds = round(samples / Number(report.clockRate || 48000));
          }
        }
        if (report.type === 'candidate-pair' && report.nominated && report.state === 'succeeded') {
          if (typeof report.currentRoundTripTime === 'number') {
            out.rttMs = round(report.currentRoundTripTime * 1000);
          }
        }
      });
    } catch {
      /* Already closed: what we have is what we send. */
    }
    return out;
  }

  /** How loud each side is right now, 0–1, as of the last tenth of a second. */
  levels(): { mine: number; theirs: number } {
    return this.level;
  }

  close() {
    window.clearInterval(this.poll);
    this.meterTrack?.stop();
    this.pc.onconnectionstatechange = null;
    this.pc.close();
    for (const track of this.mic.getTracks()) track.stop();
    this.audio.pause();
    this.audio.srcObject = null;
  }
}
