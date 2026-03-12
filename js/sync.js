(() => {
  const App = (window.MonitorApp = window.MonitorApp || {});
  const CHANNEL_NAME = 'monitor-hospitalario-sync';

  function createSync({ pageType, onStateReceived, onStatusChange }) {
    if (!('BroadcastChannel' in window)) {
      onStatusChange?.({ connected: false, message: 'BroadcastChannel unavailable' });
      return {
        broadcastState() {},
        dispose() {},
        requestState() {}
      };
    }

    const channel = new BroadcastChannel(CHANNEL_NAME);
    const id = `${pageType}-${Math.random().toString(36).slice(2, 10)}`;

    function post(message) {
      channel.postMessage({
        ...message,
        pageType,
        senderId: id,
        sentAt: Date.now()
      });
    }

    function setStatus(message, connected) {
      onStatusChange?.({ connected, message });
    }

    channel.onmessage = event => {
      const message = event.data || {};
      if (message.senderId === id) {
        return;
      }

      if (message.type === 'hello') {
        setStatus(pageType === 'monitor' ? 'Control detected' : 'Monitor detected', true);
        if (pageType === 'control') {
          post({ type: 'state:full', targetId: message.senderId, payload: App.state.getSerializableState() });
        }
        return;
      }

      if (message.type === 'state:request') {
        if (pageType === 'control') {
          post({ type: 'state:full', targetId: message.senderId, payload: App.state.getSerializableState() });
        }
        return;
      }

      if ((message.type === 'state:update' || message.type === 'state:full') && (!message.targetId || message.targetId === id)) {
        setStatus(pageType === 'monitor' ? 'Synchronized with control' : 'State synchronized', true);
        onStateReceived?.(message.payload || {});
      }
    };

    function broadcastState(mode = 'update') {
      post({
        type: mode === 'full' ? 'state:full' : 'state:update',
        payload: App.state.getSerializableState()
      });
      setStatus(pageType === 'control' ? 'Changes sent to monitor' : 'Local state sent', true);
    }

    function requestState() {
      post({ type: 'hello' });
      post({ type: 'state:request' });
    }

    requestState();

    return {
      broadcastState,
      dispose() {
        channel.close();
      },
      requestState
    };
  }

  App.sync = {
    createSync
  };
})();
