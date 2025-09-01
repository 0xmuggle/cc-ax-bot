console.log('Axiom Content Script running directly in MAIN world.');

// Using an IIFE to avoid polluting the global scope of the page
(() => {
    const originalParse = JSON.parse;

    JSON.parse = new Proxy(originalParse, {
        apply: (target, thisArg, argumentsList) => {
            const data = target.apply(thisArg, argumentsList);

            if (data && data.room) {
                const room = data.room;
                if (room === 'surge-updates' || room === 'sol_price') {
                    // This script runs in the page's context, so it can communicate
                    // directly with the window that opened it.
                    if (window.opener) {
                        window.opener.postMessage({
                            type: "FROM_AXIOM_EXTENSION",
                            payload: data
                        }, "*");
                    }
                }
            }

            return data;
        }
    });
})();