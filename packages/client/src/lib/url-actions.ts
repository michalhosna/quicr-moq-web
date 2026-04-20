// SPDX-FileCopyrightText: Copyright (c) 2025 Cisco Systems
// SPDX-License-Identifier: BSD-2-Clause

/**
 * @fileoverview URL-driven one-shot actions that extend the bookmark system.
 *
 * Unlike `bookmark.ts` (which round-trips persistent settings), these params
 * describe *actions* — connect on load, pre-fill track rows. They are parsed
 * exactly once from `window.location.search` on first access and held in
 * module-local state. Not persisted to the store, not to localStorage.
 *
 * URL format:
 *   ?autoConnect=1
 *   &autoSubscribe=1
 *   &publishTrack=video:conference/room-1/media:alice-video
 *   &publishTrack=audio:conference/room-1/media:alice-audio
 *   &subscribeTrack=video:conference/room-1/media:bob-video
 *
 * Inside a spec the first two `:` split mediaType / namespace / trackName, so
 * trackNames containing `:` are fine. `:` in namespaces must be URL-encoded.
 */

export type PendingMediaType = 'video' | 'audio';

export interface PendingTrack {
  mediaType: PendingMediaType;
  namespace: string;
  trackName: string;
}

interface UrlActions {
  autoConnect: boolean;
  autoSubscribe: boolean;
  publishTracks: PendingTrack[];
  subscribeTracks: PendingTrack[];
}

function parseTrackSpec(spec: string): PendingTrack | null {
  const first = spec.indexOf(':');
  if (first < 0) return null;
  const second = spec.indexOf(':', first + 1);
  if (second < 0) return null;
  const mediaType = spec.slice(0, first);
  const namespace = spec.slice(first + 1, second);
  const trackName = spec.slice(second + 1);
  if (mediaType !== 'video' && mediaType !== 'audio') return null;
  if (!namespace || !trackName) return null;
  return { mediaType, namespace, trackName };
}

function parseTrackList(params: URLSearchParams, key: string): PendingTrack[] {
  const out: PendingTrack[] = [];
  for (const raw of params.getAll(key)) {
    const parsed = parseTrackSpec(raw);
    if (parsed) out.push(parsed);
    else console.warn(`[url-actions] skipping unparseable ${key}: ${raw}`);
  }
  return out;
}

function parseBoolFlag(params: URLSearchParams, key: string): boolean {
  const raw = params.get(key);
  return raw === '1' || raw === 'true';
}

function parseFromLocation(): UrlActions {
  if (typeof window === 'undefined') {
    return { autoConnect: false, autoSubscribe: false, publishTracks: [], subscribeTracks: [] };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    autoConnect: parseBoolFlag(params, 'autoConnect'),
    autoSubscribe: parseBoolFlag(params, 'autoSubscribe'),
    publishTracks: parseTrackList(params, 'publishTrack'),
    subscribeTracks: parseTrackList(params, 'subscribeTrack'),
  };
}

let cached: UrlActions | null = null;
function ensure(): UrlActions {
  if (cached === null) cached = parseFromLocation();
  return cached;
}

export function consumePendingPublishTracks(): PendingTrack[] {
  const c = ensure();
  const v = c.publishTracks;
  c.publishTracks = [];
  return v;
}

export function consumePendingSubscribeTracks(): PendingTrack[] {
  const c = ensure();
  const v = c.subscribeTracks;
  c.subscribeTracks = [];
  return v;
}

export function consumeAutoConnect(): boolean {
  const c = ensure();
  const v = c.autoConnect;
  c.autoConnect = false;
  return v;
}

export function consumeAutoSubscribe(): boolean {
  const c = ensure();
  const v = c.autoSubscribe;
  c.autoSubscribe = false;
  return v;
}

/**
 * Non-consuming peek used by `App` to pick the initial active tab.
 * Returns 'subscribe' when the URL supplies subscribeTrack(s) but no
 * publishTrack; otherwise 'publish' (the historical default).
 */
export function getInitialActiveTab(): 'publish' | 'subscribe' {
  const c = ensure();
  if (c.subscribeTracks.length > 0 && c.publishTracks.length === 0) return 'subscribe';
  return 'publish';
}
