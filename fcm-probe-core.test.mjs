import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCapabilityRows,
  getFinalVerdict,
  getNotificationPermissionLabel,
} from './fcm-probe-core.mjs';

test('marks Web FCM probe as possible when every required capability exists', () => {
  const rows = buildCapabilityRows({
    isSecureContext: true,
    hasServiceWorker: true,
    hasPushManager: true,
    hasNotification: true,
    hasIndexedDB: true,
    hasFetch: true,
    userAgent: 'Android WebView probe',
    notificationPermission: 'default',
  });

  const verdict = getFinalVerdict(rows, {
    serviceWorkerRegistration: 'success',
    notificationPermission: 'default',
  });

  assert.equal(verdict.level, 'possible');
  assert.match(verdict.title, /can attempt/i);
});

test('reports Web FCM as blocked when PushManager is missing', () => {
  const rows = buildCapabilityRows({
    isSecureContext: true,
    hasServiceWorker: true,
    hasPushManager: false,
    hasNotification: true,
    hasIndexedDB: true,
    hasFetch: true,
    userAgent: 'Android WebView probe',
    notificationPermission: 'default',
  });

  const verdict = getFinalVerdict(rows, {
    serviceWorkerRegistration: 'success',
    notificationPermission: 'default',
  });

  assert.equal(verdict.level, 'blocked');
  assert.match(verdict.title, /PushManager/i);
});

test('reports Service Worker registration failure separately from API presence', () => {
  const rows = buildCapabilityRows({
    isSecureContext: true,
    hasServiceWorker: true,
    hasPushManager: true,
    hasNotification: true,
    hasIndexedDB: true,
    hasFetch: true,
    userAgent: 'Android WebView probe',
    notificationPermission: 'granted',
  });

  const verdict = getFinalVerdict(rows, {
    serviceWorkerRegistration: 'failed',
    notificationPermission: 'granted',
  });

  assert.equal(verdict.level, 'blocked');
  assert.match(verdict.title, /registration failed/i);
});

test('reports Firebase Messaging support failure when the SDK check returns false', () => {
  const rows = buildCapabilityRows({
    isSecureContext: true,
    hasServiceWorker: true,
    hasPushManager: true,
    hasNotification: true,
    hasIndexedDB: true,
    hasFetch: true,
    userAgent: 'Android WebView probe',
    notificationPermission: 'default',
  });

  const verdict = getFinalVerdict(rows, {
    serviceWorkerRegistration: 'success',
    notificationPermission: 'default',
    firebaseMessagingSupported: false,
  });

  assert.equal(verdict.level, 'blocked');
  assert.match(verdict.title, /Firebase Messaging/i);
});

test('normalizes Notification permission labels for display', () => {
  assert.equal(getNotificationPermissionLabel('granted'), 'granted');
  assert.equal(getNotificationPermissionLabel('denied'), 'denied');
  assert.equal(getNotificationPermissionLabel('default'), 'not requested');
  assert.equal(getNotificationPermissionLabel(undefined), 'unavailable');
});
