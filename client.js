const BROKER_URL = "wss://charon.jayme53100.workers.dev";

let broker = null;


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

    broker.onerror = (e) => {

    console.error("[Charon] Broker error", e);

    status.textContent = "Broker Error";
};

  broker.onclose = (event) => {

    console.log(
        "[Charon] Broker disconnected",
        "code=", event.code,
        "reason=", event.reason
    );

    status.textContent = "Disconnected";
};
}

window.addEventListener("DOMContentLoaded", () => {

    const button = document.getElementById("connect");

    if (button) {
        button.addEventListener("click", connectBroker);
    }

});
