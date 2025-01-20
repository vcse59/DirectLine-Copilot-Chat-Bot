const DIRECT_LINE_SECRET = "DIRECT LINE SECRET";
const DIRECT_LINE_URL = "https://directline.botframework.com/v3/directline";

class Enum {
    constructor() {
        for (let key in arguments) {
            this[arguments[key]] = key;
        }
        Object.freeze(this);
    }
}

const BotConnectionStatus = new Enum(
    'UNINITAILIZED',
    'GENERATING_TOKEN',
    'CONNECTION_INPROGRESS',
    'CONNECTED',
    'DISCONNECTED',
    'FAILED_TO_CONNECT',
    'TOKEN_EXPIRED',
);

class DirectLineClass {
    constructor(){
        this.token = null;
        this.conversationId = null;
        this.streamUrl = null;
        this.BotConnectionStatus = BotConnectionStatus.UNINITAILIZED;
        this.webSocket  = null;
    }

    /**
     * Generate a Direct Line token.
     */
    async generateToken() {
        const response = await fetch(`${DIRECT_LINE_URL}/tokens/generate`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${DIRECT_LINE_SECRET}`
            }
        });
        const data = await response.json();
        this.token = data.token;
    }

    /**
     * Refresh a Direct Line token.
     */
    async refreshToken() {
        if (!this.token){
            console.error("Token is null");
            return;
        }

        const response = await fetch(`${DIRECT_LINE_URL}/tokens/refresh`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.token}`
            }
        });
        const data = await response.json();
        this.token = data.token;
    }

    /**
     * Start a new conversation.
     */
    async startConversation() {
        const response = await fetch(`${DIRECT_LINE_URL}/conversations`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.token}`
            }
        });
        const data = await response.json();
        this.conversationId = data.conversationId;
        this.streamUrl = data.streamUrl;
    }

    /**
     * Reconnect to an existing conversation.
     */
    async reconnectConversation() {
        const response = await fetch(`${DIRECT_LINE_URL}/conversations/${this.conversationId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${this.token}`
            }
        });
        const data = await response.json();
        this.streamUrl = data.streamUrl;
    }

    /**
     * Send an activity to the bot.
     */
    async sendActivity(activity) {
        const response = await fetch(`${DIRECT_LINE_URL}/conversations/${this.conversationId}/activities`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(activity)
        });
        const data = await response.json();
    }

    /**
     * Receive activities from the bot via WebSocket.
     */
    receiveActivities(onActivity) {
        this.socket = new WebSocket(this.streamUrl);

        this.socket.onmessage = (event) => {
            if (!event.data){
                return;
            }
            const data = JSON.parse(event.data);
            if (data.activities && data.activities.length > 0) {
                data.activities.forEach(onActivity);
            }
        };

        this.socket.onerror = (error) => {
            console.error("WebSocket Error:", error);
        }

        this.socket.onclose = () => {
        }
    }

    /**
     * End the conversation by invalidating the token (optional).
     */
    async endConversation() {
        const response = await fetch(`${DIRECT_LINE_URL}/tokens/revoke`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.token}`
            }
        });
        return response.ok;
    }
}

export class directLineInterface {

    constructor() {
        this.directLineObj = null;
    }

    async initializeConversation(onActivity) {
        this.directLineObj  = new DirectLineClass();
        await this.directLineObj.generateToken();
        await this.directLineObj.startConversation();
        await this.directLineObj.receiveActivities(onActivity);
    }

    async endConversation(){
        this.directLineObj.endConversation();
    }

    async sendActivity(activity) {
        this.directLineObj.sendActivity(activity);
    }
}