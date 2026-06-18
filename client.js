const BROKER_URL = "wss://charon.jayme53100.workers.dev";

let broker = null;
let peerConnection = null;
let selectedFerryman = null;

async function connectBroker() {

    if (broker && broker.readyState === WebSocket.OPEN) {
        return;
    }

    const status = document.getElementById("status");
    status.textContent = "Connecting...";

    broker = new WebSocket(BROKER_URL);

    broker.onopen = () => {

        console.log("[Charon] Broker connected");

        broker.send(JSON.stringify({
            type: "register",
            role: "client"
        }));

    };

    broker.onmessage = (event) => {

        const msg = JSON.parse(event.data);

        console.log("[Charon]", msg);

        if (msg.type === "registered") {

            const ferrymen = msg.ferrymen || [];

            selectedFerryman = ferrymen[0] || null;

            status.textContent =
                `${ferrymen.length} Ferryman${ferrymen.length !== 1 ? "s" : ""} Available`;

            console.log("Ferrymen:", ferrymen);

            const output = document.getElementById("output");

            output.innerHTML = "";

            ferrymen.forEach(node => {

                const div = document.createElement("div");

                div.className = "node";

                div.textContent =
                    `${node.speedMbps} Mbps • ${node.maxSlots} Slots`;

                output.appendChild(div);

            });
        }

    };

    broker.onerror = () => {

        status.textContent = "Broker Error";

    };

    broker.onclose = () => {

        console.log("[Charon] Broker disconnected");

        status.textContent = "Disconnected";

    };
}

async function connectToFerryman() {

    if (!selectedFerryman) {
        console.log("No ferryman available");
        return;
    }

    console.log(
        "Connecting to ferryman:",
        selectedFerryman.id
    );

    peerConnection =
        new RTCPeerConnection({
            iceServers: [
                {
                    urls:
                        "stun:stun.l.google.com:19302"
                }
            ]
        });

    peerConnection.onicecandidate =
        (event) => {

            if (!event.candidate) return;

            broker.send(JSON.stringify({
                type: "ice",
                peerId: selectedFerryman.id,
                data: event.candidate
            }));

        };

    const offer =
        await peerConnection.createOffer();

    await peerConnection.setLocalDescription(
        offer
    );

    broker.send(JSON.stringify({
        type: "offer",
        peerId: selectedFerryman.id,
        data: offer
    }));

    console.log("Offer sent");
}

window.addEventListener(
    "DOMContentLoaded",
    () => {

        const button =
            document.getElementById("connect");

        if (!button) return;

        button.addEventListener(
            "click",
            async () => {

                await connectBroker();

                setTimeout(
                    connectToFerryman,
                    1000
                );

            }
        );

    }
);
