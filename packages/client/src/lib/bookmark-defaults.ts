// SPDX-FileCopyrightText: Copyright (c) 2025 Cisco Systems
// SPDX-License-Identifier: BSD-2-Clause

/**
 * @fileoverview Single source of truth for bookmarkable state shape + defaults.
 *
 * Lives outside the store so it can be imported by pure modules (bookmark
 * encoder, tests) without pulling in Zustand, localStorage, or MOQ transport.
 */

import { VarIntType } from '@web-moq/core';
import type { VADProvider, ExperienceProfileName } from '@web-moq/media';
import { LogLevel } from '../types';

export interface BookmarkableSettings {
  serverUrl: string;
  displayName: string;
  theme: 'light' | 'dark' | 'system';
  logLevel: LogLevel;
  videoBitrate: number;
  audioBitrate: number;
  videoResolution: '720p' | '1080p' | '480p';
  keyframeInterval: number;
  deliveryMode: 'stream' | 'datagram';
  localDevelopment: boolean;
  useWorkers: boolean;
  useAnnounceFlow: boolean;
  connectionTimeout: number;
  enableStats: boolean;
  jitterBufferDelay: number;
  varIntType: VarIntType;
  vadEnabled: boolean;
  vadProvider: VADProvider;
  vadVisualizationEnabled: boolean;
  audioDeliveryMode: 'datagram' | 'stream';
  experienceProfile: ExperienceProfileName;
  useGroupArbiter: boolean;
  maxLatency: number;
  estimatedGopDuration: number;
  skipToLatestGroup: boolean;
  skipGraceFrames: number;
  enableCatchUp: boolean;
  catchUpThreshold: number;
  useLatencyDeadline: boolean;
  arbiterDebug: boolean;
  secureObjectsEnabled: boolean;
  secureObjectsCipherSuite: string;
  secureObjectsBaseKey: string;
  quicrInteropEnabled: boolean;
  quicrParticipantId: number;
  defaultPublishNamespace: string;
  defaultPublishTrackName: string;
  defaultSubscribeNamespace: string;
  defaultSubscribeTrackName: string;
  defaultSubscribeNamespacePrefix: string;
}

export const DEFAULT_SETTINGS: BookmarkableSettings = {
  serverUrl: 'https://localhost:4443/moq',
  displayName: 'Anonymous',
  theme: 'system',
  logLevel: LogLevel.ERROR,
  videoBitrate: 2_000_000,
  audioBitrate: 128_000,
  videoResolution: '720p',
  keyframeInterval: 1,
  deliveryMode: 'stream',
  localDevelopment: true,
  useWorkers: true,
  useAnnounceFlow: false,
  connectionTimeout: 300_000,
  enableStats: false,
  jitterBufferDelay: 100,
  varIntType: VarIntType.QUIC,
  vadEnabled: false,
  vadProvider: 'libfvad',
  vadVisualizationEnabled: false,
  audioDeliveryMode: 'datagram',
  experienceProfile: 'interactive',
  useGroupArbiter: false,
  maxLatency: 500,
  estimatedGopDuration: 1000,
  skipToLatestGroup: false,
  skipGraceFrames: 3,
  enableCatchUp: true,
  catchUpThreshold: 5,
  useLatencyDeadline: true,
  arbiterDebug: false,
  secureObjectsEnabled: false,
  secureObjectsCipherSuite: '0x0004',
  secureObjectsBaseKey: '',
  quicrInteropEnabled: false,
  quicrParticipantId: 0,
  defaultPublishNamespace: 'conference/room-1/media',
  defaultPublishTrackName: '',
  defaultSubscribeNamespace: 'conference/room-1/media',
  defaultSubscribeTrackName: '',
  defaultSubscribeNamespacePrefix: 'conference/room-1',
};
