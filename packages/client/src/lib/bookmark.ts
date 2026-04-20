// SPDX-FileCopyrightText: Copyright (c) 2025 Cisco Systems
// SPDX-License-Identifier: BSD-2-Clause

/**
 * @fileoverview URL-bookmark encode/decode for bookmarkable store state.
 *
 * Encodes only fields that differ from `DEFAULT_SETTINGS`, so a bookmark URL
 * is short when the user has tweaked a few settings. Decoding is lenient:
 * unknown keys and unparseable values are skipped with a warning.
 */

import { DEFAULT_SETTINGS, type BookmarkableSettings } from './bookmark-defaults';

export const BOOKMARKABLE_FIELDS = Object.keys(DEFAULT_SETTINGS) as Array<keyof BookmarkableSettings>;
const KNOWN_FIELDS: ReadonlySet<string> = new Set(BOOKMARKABLE_FIELDS as string[]);

type FieldKey = keyof BookmarkableSettings;

function serialize(key: FieldKey, value: BookmarkableSettings[FieldKey]): string | null {
  const def = DEFAULT_SETTINGS[key];
  switch (typeof def) {
    case 'boolean':
      return (value as boolean) ? '1' : '0';
    case 'number':
      return String(value as number);
    case 'string':
      return String(value as string);
    default:
      return null;
  }
}

function deserialize(key: FieldKey, raw: string): BookmarkableSettings[FieldKey] | undefined {
  const def = DEFAULT_SETTINGS[key];
  switch (typeof def) {
    case 'boolean': {
      if (raw === '1' || raw === 'true') return true as BookmarkableSettings[FieldKey];
      if (raw === '0' || raw === 'false') return false as BookmarkableSettings[FieldKey];
      return undefined;
    }
    case 'number': {
      const n = Number(raw);
      return Number.isFinite(n) ? (n as BookmarkableSettings[FieldKey]) : undefined;
    }
    case 'string':
      return raw as BookmarkableSettings[FieldKey];
    default:
      return undefined;
  }
}

export function encodeBookmark(state: BookmarkableSettings): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of BOOKMARKABLE_FIELDS) {
    const current = state[key];
    if (current === DEFAULT_SETTINGS[key]) continue;
    const encoded = serialize(key, current);
    if (encoded !== null) params.set(key, encoded);
  }
  return params;
}

export function decodeBookmark(params: URLSearchParams): Partial<BookmarkableSettings> {
  const out: Partial<BookmarkableSettings> = {};
  for (const [key, raw] of params.entries()) {
    if (!KNOWN_FIELDS.has(key)) continue;
    const parsed = deserialize(key as FieldKey, raw);
    if (parsed === undefined) {
      console.warn(`[bookmark] skipping unparseable value for "${key}": ${raw}`);
      continue;
    }
    (out as Record<string, unknown>)[key] = parsed;
  }
  return out;
}

/**
 * Merge a fresh bookmark query string into the current URL, preserving any
 * pre-existing params the bookmark doesn't know about (e.g. `?debug=1`).
 */
export function mergeBookmarkIntoLocation(
  currentSearch: string,
  bookmarkParams: URLSearchParams
): string {
  const existing = new URLSearchParams(currentSearch);
  // Drop every known-bookmarkable key from existing (they'll be re-added only
  // when non-default), so the bookmark reflects the current store exactly.
  for (const key of Array.from(existing.keys())) {
    if (KNOWN_FIELDS.has(key)) existing.delete(key);
  }
  for (const [key, value] of bookmarkParams.entries()) {
    existing.set(key, value);
  }
  const qs = existing.toString();
  return qs ? `?${qs}` : '';
}
