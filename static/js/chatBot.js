function appendMessage(sender, text, isLoading = false) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = sender === 'user' ? 'user-message' : 'bot-message';
    if (isLoading) {
        msgDiv.innerHTML = '<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>';
        msgDiv.classList.add('bot-loading');
    } else {
        msgDiv.textContent = text;
    }
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgDiv;
}

function sendMessage(event) {
    event.preventDefault();
    const input = document.getElementById('chat-input');
    if (!input) return false;
    const message = input.value.trim();
    if (!message) return false;
    appendMessage('user', message);
    input.value = '';
    // Show loading message and keep reference
    const loadingDiv = appendMessage('bot', '', true);
    fetch('/deepseek_chat_bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    })
        .then(res => res.json())
        .then(data => {
            if (loadingDiv) {
                loadingDiv.classList.remove('bot-loading');
                loadingDiv.innerHTML = '';
                loadingDiv.textContent = data.response;
            } else {
                appendMessage('bot', data.response);
            }
        })
        .catch(() => {
            if (loadingDiv) {
                loadingDiv.classList.remove('bot-loading');
                loadingDiv.innerHTML = '';
                loadingDiv.textContent = 'Sorry, there was an error connecting to the AI.';
            } else {
                appendMessage('bot', 'Sorry, there was an error connecting to the AI.');
            }
        });
    return false;
}

window.addEventListener('DOMContentLoaded', function () {
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        chatForm.onsubmit = sendMessage;
    }
});
