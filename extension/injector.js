console.log('Axiom Stealth Injector Script running in Main World context.');

const OriginalWebSocket = window.WebSocket;

// We can't use a Proxy on the constructor directly in all browsers in a way that lets us modify the instance.
// Instead, we overwrite the constructor and use Object.defineProperty on the instance.
window.WebSocket = function(url, protocols) {
    const wsInstance = protocols ? new OriginalWebSocket(url, protocols) : new OriginalWebSocket(url);

    let originalOnMessage = null;

    Object.defineProperty(wsInstance, 'onmessage', {
        get: function() {
            return originalOnMessage;
        },
        set: function(listener) {
            if (originalOnMessage) {
                wsInstance.removeEventListener('message', originalOnMessage);
            }
            
            originalOnMessage = listener;

            wsInstance.addEventListener('message', (event) => {
                // First, let's check the data and send it to our extension if it matches
                try {
                    const data = JSON.parse(event.data);
                    if (data && data.data && data.data.room) {
                        const room = data.data.room;
                        if (room === 'surge-updates' || room === 'sol_price') {
                            window.postMessage({
                                type: "FROM_INJECTOR",
                                payload: data
                            }, "*");
                        }
                    }
                } catch (e) {
                    // Not a JSON message, or malformed, ignore
                }

                // Now, call the original listener so the page works as expected
                if (originalOnMessage) {
                    originalOnMessage.call(wsInstance, event);
                }
            });
        },
        configurable: true
    });

    return wsInstance;
};

// Copy static properties from the original to our new constructor
Object.assign(window.WebSocket, OriginalWebSocket);