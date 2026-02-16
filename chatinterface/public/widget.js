(function () {
    const WIDGET_URL = window.location.origin; // Assuming widget is served from the same domain for now

    const style = `
        #chatbot-widget-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        #chatbot-widget-button {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: #000;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: transform 0.3s ease;
        }
        #chatbot-widget-button:hover {
            transform: scale(1.1);
        }
        #chatbot-widget-window {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 350px;
            height: 500px;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            display: none;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid #eee;
        }
        #chatbot-widget-header {
            padding: 15px;
            background: #000;
            color: #fff;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #chatbot-widget-messages {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            background: #f9f9f9;
        }
        #chatbot-widget-input-container {
            padding: 15px;
            border-top: 1px solid #eee;
            display: flex;
            gap: 10px;
        }
        #chatbot-widget-input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            outline: none;
        }
        #chatbot-widget-send {
            padding: 8px 15px;
            background: #000;
            color: #fff;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }
        .cb-message {
            margin-bottom: 10px;
            max-width: 80%;
            padding: 8px 12px;
            border-radius: 12px;
            font-size: 14px;
            line-height: 1.4;
        }
        .cb-user {
            align-self: flex-end;
            background: #000;
            color: #fff;
            margin-left: auto;
        }
        .cb-bot {
            align-self: flex-start;
            background: #eee;
            color: #333;
        }
    `;

    const widgetHtml = `
        <div id="chatbot-widget-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
        </div>
        <div id="chatbot-widget-window">
            <div id="chatbot-widget-header">
                Chat Support
                <span id="chatbot-widget-close" style="cursor:pointer">&times;</span>
            </div>
            <div id="chatbot-widget-messages"></div>
            <div id="chatbot-widget-input-container">
                <input type="text" id="chatbot-widget-input" placeholder="Type a message...">
                <button id="chatbot-widget-send">Send</button>
            </div>
        </div>
    `;

    window.ChatbotWidget = {
        init: function (config) {
            console.log("[Chatbot Widget] Initializing with config:", config);
            this.config = config;
            this.apiUrl = config.apiUrl || `${WIDGET_URL}/api`;
            console.log("[Chatbot Widget] API URL:", this.apiUrl);

            const container = document.createElement('div');
            container.id = 'chatbot-widget-container';
            container.innerHTML = widgetHtml;
            document.body.appendChild(container);

            const styleTag = document.createElement('style');
            styleTag.innerHTML = style;
            document.head.appendChild(styleTag);

            this.setupEvents();
        },

        setupEvents: function () {
            const btn = document.getElementById('chatbot-widget-button');
            const win = document.getElementById('chatbot-widget-window');
            const close = document.getElementById('chatbot-widget-close');
            const input = document.getElementById('chatbot-widget-input');
            const sendBtn = document.getElementById('chatbot-widget-send');

            btn.onclick = () => {
                win.style.display = win.style.display === 'flex' ? 'none' : 'flex';
            };

            close.onclick = () => {
                win.style.display = 'none';
            };

            const sendMessage = async () => {
                const text = input.value.trim();
                if (!text) return;

                this.addMessage(text, 'user');
                input.value = '';

                try {
                    const response = await fetch(`${this.apiUrl}/chatbots/${this.config.chatbotId}/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: text })
                    });
                    const data = await response.json();
                    console.log("[Chatbot Widget] Response Data:", data);
                    this.addMessage(data.response || "No response from AI", 'bot');
                } catch (error) {
                    console.error("[Chatbot Widget] Connection Error:", error);
                    this.addMessage("Sorry, I'm having trouble connecting.", 'bot');
                }
            };

            sendBtn.onclick = sendMessage;
            input.onkeypress = (e) => {
                if (e.key === 'Enter') sendMessage();
            };
        },

        addMessage: function (text, role) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `cb-message cb-${role}`;
            msgDiv.innerText = text;
            const messages = document.getElementById('chatbot-widget-messages');
            messages.appendChild(msgDiv);
            messages.scrollTop = messages.scrollHeight;
        }
    };
})();
