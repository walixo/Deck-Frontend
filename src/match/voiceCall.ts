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
 * It also measures how loud each side is, for the voice rings on screen.
 */

/** Direct-only, for when the server's list couldn't be fetched. */
const DIRECT_ONLY: RTCIceServer[] = [
  { urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] },
];

export type CallState = 'connecting' | 'connected' | 'failed';

export class VoiceCall {
  private pc: RTCPeerConnection;
  private audio = new Audio();
  private pending: RTCIceCandidateInit[] = [];
  private told = false;
  private localMeter: AnalyserNode;
  private remoteMeter: AnalyserNode | null = null;
  private samples = new Uint8Array(512);
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
    this.localMeter = this.meter(mic);

    this.pc.onicecandidate = ({ candidate }) => {
      if (candidate) void matchApi.signal(this.callId, { candidate: candidate.toJSON() });
    };
    this.pc.ontrack = ({ streams }) => {
      const [remote] = streams;
      if (!remote) return;
      this.audio.srcObject = remote;
      this.audio.autoplay = true;
      void this.audio.play().catch(() => undefined);
      this.remoteMeter = this.meter(remote);
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

  private meter(stream: MediaStream): AnalyserNode {
    const analyser = this.context.createAnalyser();
    analyser.fftSize = 512;
    this.context.createMediaStreamSource(stream).connect(analyser);
    return analyser;
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

  /** How loud each side is right now, 0–1. */
  levels(): { mine: number; theirs: number } {
    const read = (analyser: AnalyserNode | null) => {
      if (!analyser) return 0;
      analyser.getByteTimeDomainData(this.samples);
      let sum = 0;
      for (const value of this.samples) sum += ((value - 128) / 128) ** 2;
      return Math.min(1, Math.sqrt(sum / this.samples.length) * 4);
    };
    return { mine: read(this.localMeter), theirs: read(this.remoteMeter) };
  }

  close() {
    this.pc.onconnectionstatechange = null;
    this.pc.close();
    for (const track of this.mic.getTracks()) track.stop();
    this.audio.pause();
    this.audio.srcObject = null;
  }
}
