// SPDX-FileCopyrightText: Copyright (c) 2025 Cisco Systems
// SPDX-License-Identifier: BSD-2-Clause

/**
 * @fileoverview One-shot hook that applies bookmark URL state to the store on mount.
 */

import { useEffect } from 'react';
import { useStore } from '../store';
import { decodeBookmark } from '../lib/bookmark';

export function useBookmarkHydration(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.size === 0) return;
    const partial = decodeBookmark(params);
    if (Object.keys(partial).length === 0) return;
    useStore.getState().applyBookmarkState(partial);
  }, []);
}
