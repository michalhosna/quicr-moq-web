// SPDX-FileCopyrightText: Copyright (c) 2025 Cisco Systems
// SPDX-License-Identifier: BSD-2-Clause

/**
 * @fileoverview One-shot hook that applies bookmark URL state to the store on mount.
 *
 * Settings live in the store; URL-only one-shot actions (autoConnect,
 * publishTrack, subscribeTrack) are parsed from the URL in `lib/url-actions`
 * and consumed directly by the panels — never written to the store.
 */

import { useEffect } from 'react';
import { useStore } from '../store';
import { decodeBookmark } from '../lib/bookmark';
import { consumeAutoConnect } from '../lib/url-actions';

export function useBookmarkHydration(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.size > 0) {
      const partial = decodeBookmark(params);
      if (Object.keys(partial).length > 0) {
        useStore.getState().applyBookmarkState(partial);
      }
    }

    if (consumeAutoConnect()) {
      const { connect, serverUrl, state } = useStore.getState();
      if (state === 'disconnected' && serverUrl) {
        void connect(serverUrl).catch(() => {
          // Error surfaces via store.error; swallow so the hook doesn't throw.
        });
      }
    }
  }, []);
}
