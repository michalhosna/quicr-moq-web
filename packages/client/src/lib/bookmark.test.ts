// SPDX-FileCopyrightText: Copyright (c) 2025 Cisco Systems
// SPDX-License-Identifier: BSD-2-Clause

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DEFAULT_SETTINGS, type BookmarkableSettings } from './bookmark-defaults';
import {
  encodeBookmark,
  decodeBookmark,
  mergeBookmarkIntoLocation,
  BOOKMARKABLE_FIELDS,
} from './bookmark';

function withState(overrides: Partial<BookmarkableSettings>): BookmarkableSettings {
  return { ...DEFAULT_SETTINGS, ...overrides };
}

describe('bookmark encode/decode', () => {
  it('emits no params when state equals defaults', () => {
    const params = encodeBookmark(DEFAULT_SETTINGS);
    expect([...params.keys()]).toEqual([]);
  });

  it('round-trips a single boolean field', () => {
    const state = withState({ enableStats: true });
    const params = encodeBookmark(state);
    expect(params.get('enableStats')).toBe('1');
    const decoded = decodeBookmark(params);
    expect(decoded).toEqual({ enableStats: true });
  });

  it('round-trips a single number field', () => {
    const state = withState({ videoBitrate: 3_000_000 });
    const params = encodeBookmark(state);
    expect(params.get('videoBitrate')).toBe('3000000');
    const decoded = decodeBookmark(params);
    expect(decoded).toEqual({ videoBitrate: 3_000_000 });
  });

  it('round-trips a single string field', () => {
    const state = withState({ displayName: 'Alice Smith' });
    const params = encodeBookmark(state);
    expect(params.get('displayName')).toBe('Alice Smith');
    const decoded = decodeBookmark(params);
    expect(decoded).toEqual({ displayName: 'Alice Smith' });
  });

  it('round-trips a union-typed string field', () => {
    const state = withState({ theme: 'dark' });
    const params = encodeBookmark(state);
    const decoded = decodeBookmark(params);
    expect(decoded).toEqual({ theme: 'dark' });
  });

  it('round-trips an enum (number-backed) field', () => {
    // logLevel is a numeric enum; TRACE=0 is different from default ERROR=4.
    const state = withState({ logLevel: 0 as BookmarkableSettings['logLevel'] });
    const params = encodeBookmark(state);
    expect(params.get('logLevel')).toBe('0');
    const decoded = decodeBookmark(params);
    expect(decoded).toEqual({ logLevel: 0 });
  });

  it('encodes only fields that differ from default', () => {
    const state = withState({
      theme: 'dark',
      videoBitrate: 4_000_000,
      defaultPublishTrackName: 'alice/video',
    });
    const params = encodeBookmark(state);
    expect([...params.keys()].sort()).toEqual(
      ['defaultPublishTrackName', 'theme', 'videoBitrate'].sort()
    );
  });

  it('round-trips namespace path strings with slashes', () => {
    const state = withState({ defaultPublishNamespace: 'room-42/alice/media' });
    const url = `?${encodeBookmark(state).toString()}`;
    // Fresh URLSearchParams from the encoded string, simulating page-load path.
    const decoded = decodeBookmark(new URLSearchParams(url));
    expect(decoded).toEqual({ defaultPublishNamespace: 'room-42/alice/media' });
  });

  it('round-trips an empty string when it differs from default', () => {
    // defaultPublishTrackName default is '' — setting to a non-empty and back
    // verifies we handle the diff, not just absence.
    const state = withState({ displayName: '' });
    const params = encodeBookmark(state);
    expect(params.get('displayName')).toBe('');
    const decoded = decodeBookmark(params);
    expect(decoded).toEqual({ displayName: '' });
  });
});

describe('bookmark decode tolerance', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
  });

  it('ignores unknown keys', () => {
    const params = new URLSearchParams('theme=dark&unknownKey=whatever&debug=1');
    const decoded = decodeBookmark(params);
    expect(decoded).toEqual({ theme: 'dark' });
  });

  it('skips unparseable numeric values and logs a warning', () => {
    const params = new URLSearchParams('videoBitrate=garbage&theme=dark');
    const decoded = decodeBookmark(params);
    expect(decoded).toEqual({ theme: 'dark' });
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('accepts both 1/0 and true/false for booleans', () => {
    expect(decodeBookmark(new URLSearchParams('enableStats=1'))).toEqual({ enableStats: true });
    expect(decodeBookmark(new URLSearchParams('enableStats=0'))).toEqual({ enableStats: false });
    expect(decodeBookmark(new URLSearchParams('enableStats=true'))).toEqual({ enableStats: true });
    expect(decodeBookmark(new URLSearchParams('enableStats=false'))).toEqual({ enableStats: false });
  });

  it('skips unparseable boolean values', () => {
    const params = new URLSearchParams('enableStats=maybe');
    const decoded = decodeBookmark(params);
    expect(decoded).toEqual({});
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('mergeBookmarkIntoLocation', () => {
  it('preserves unknown existing params like ?debug=1', () => {
    const bookmark = encodeBookmark(withState({ theme: 'dark' }));
    const result = mergeBookmarkIntoLocation('?debug=1', bookmark);
    const params = new URLSearchParams(result);
    expect(params.get('debug')).toBe('1');
    expect(params.get('theme')).toBe('dark');
  });

  it('drops stale bookmarkable params that are no longer non-default', () => {
    // Existing URL has theme=light (non-default). New bookmark has no theme
    // override (state is default). Result must NOT keep the stale theme.
    const bookmark = encodeBookmark(DEFAULT_SETTINGS);
    const result = mergeBookmarkIntoLocation('?theme=light&debug=1', bookmark);
    const params = new URLSearchParams(result);
    expect(params.get('theme')).toBeNull();
    expect(params.get('debug')).toBe('1');
  });

  it('returns empty string when no params remain', () => {
    const bookmark = encodeBookmark(DEFAULT_SETTINGS);
    expect(mergeBookmarkIntoLocation('', bookmark)).toBe('');
  });
});

describe('BOOKMARKABLE_FIELDS', () => {
  it('matches the keys of DEFAULT_SETTINGS', () => {
    expect(BOOKMARKABLE_FIELDS.sort()).toEqual(Object.keys(DEFAULT_SETTINGS).sort());
  });
});
