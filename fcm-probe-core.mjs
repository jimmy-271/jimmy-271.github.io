const REQUIRED_CAPABILITIES = [
  'secure-context',
  'service-worker',
  'push-manager',
  'notification',
  'indexed-db',
  'fetch',
];

export function getNotificationPermissionLabel(permission) {
  if (permission === 'default') return 'not requested';
  return permission || 'unavailable';
}

export function buildCapabilityRows(env) {
  return [
    {
      id: 'secure-context',
      name: 'Secure context',
      status: Boolean(env.isSecureContext),
      value: env.isSecureContext ? 'true' : 'false',
      detail: 'Web Push and Service Worker require HTTPS, localhost, or another trusted origin.',
    },
    {
      id: 'service-worker',
      name: 'ServiceWorker API',
      status: Boolean(env.hasServiceWorker),
      value: env.hasServiceWorker ? 'present' : 'missing',
      detail: 'Firebase Web Messaging uses a service worker for background messages.',
    },
    {
      id: 'push-manager',
      name: 'PushManager API',
      status: Boolean(env.hasPushManager),
      value: env.hasPushManager ? 'present' : 'missing',
      detail: 'This is the browser Web Push subscription API. Android WebView commonly lacks it.',
    },
    {
      id: 'notification',
      name: 'Notification API',
      status: Boolean(env.hasNotification),
      value: env.hasNotification
        ? getNotificationPermissionLabel(env.notificationPermission)
        : 'missing',
      detail: 'Web FCM needs browser notification support to surface received pushes.',
    },
    {
      id: 'indexed-db',
      name: 'IndexedDB',
      status: Boolean(env.hasIndexedDB),
      value: env.hasIndexedDB ? 'present' : 'missing',
      detail: 'Firebase Web SDKs use IndexedDB for local state in supported browsers.',
    },
    {
      id: 'fetch',
      name: 'fetch API',
      status: Boolean(env.hasFetch),
      value: env.hasFetch ? 'present' : 'missing',
      detail: 'Modern Firebase Web SDK loading and network requests expect fetch support.',
    },
    {
      id: 'user-agent',
      name: 'User agent',
      status: true,
      value: env.userAgent || 'unavailable',
      detail: 'Useful for confirming the exact WebView or browser engine under test.',
    },
  ];
}

export function getFinalVerdict(rows, runtime) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const missing = REQUIRED_CAPABILITIES.filter((id) => !byId.get(id)?.status);

  if (missing.includes('secure-context')) {
    return {
      level: 'blocked',
      title: 'Blocked: not a secure context',
      message: 'Load this page through HTTPS or localhost before testing Web FCM prerequisites.',
    };
  }

  if (missing.includes('service-worker')) {
    return {
      level: 'blocked',
      title: 'Blocked: ServiceWorker is missing',
      message: 'The page cannot register the worker Firebase Web Messaging requires.',
    };
  }

  if (missing.includes('push-manager')) {
    return {
      level: 'blocked',
      title: 'Blocked: PushManager is missing',
      message: 'Service Worker support alone is not enough. Without PushManager, Web FCM cannot create a Web Push subscription.',
    };
  }

  if (missing.includes('notification')) {
    return {
      level: 'blocked',
      title: 'Blocked: Notification API is missing',
      message: 'The runtime cannot expose browser notifications for Web Push messages.',
    };
  }

  if (missing.length > 0) {
    return {
      level: 'blocked',
      title: 'Blocked: required Web APIs are missing',
      message: `Missing: ${missing.join(', ')}.`,
    };
  }

  if (runtime.serviceWorkerRegistration === 'failed') {
    return {
      level: 'blocked',
      title: 'Blocked: Service Worker registration failed',
      message: 'The API exists, but this origin or WebView configuration rejected the test worker registration.',
    };
  }

  if (runtime.notificationPermission === 'denied') {
    return {
      level: 'warning',
      title: 'Warning: notifications are denied',
      message: 'The Web APIs are present, but browser notification permission is denied for this origin.',
    };
  }

  if (runtime.firebaseMessagingSupported === false) {
    return {
      level: 'blocked',
      title: 'Blocked: Firebase Messaging isSupported() returned false',
      message: 'The browser APIs look present, but Firebase Web Messaging does not consider this runtime supported.',
    };
  }

  if (runtime.firebaseMessagingSupported === 'failed') {
    return {
      level: 'warning',
      title: 'Firebase Messaging support check failed',
      message: 'The Firebase SDK could not be loaded or its support check threw an error. Review the runtime log for details.',
    };
  }

  if (runtime.serviceWorkerRegistration !== 'success') {
    return {
      level: 'warning',
      title: 'Needs runtime check: register the test Service Worker',
      message: 'The static APIs are present. Register the test worker to verify this WebView accepts Service Worker registration.',
    };
  }

  return {
    level: 'possible',
    title: 'Can attempt Web FCM prerequisite flow',
    message: 'All probed Web APIs are present and the test Service Worker registered. This still does not guarantee Android WebView can deliver background Web Push.',
  };
}
