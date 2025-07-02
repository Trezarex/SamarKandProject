// === Optimized Chat Bot Logic ===
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

function appendMessage(sender, text, isLoading = false) {
  if (!chatMessages) return null;
  
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
  const message = chatInput.value.trim();
  if (!message) return;
  
  appendMessage('user', message);
  chatInput.value = '';
  
  const loadingDiv = appendMessage('bot', '', true);
  
  fetch('/deepseek_chat_bot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  })
  .then(async res => {
    if (!res.ok) throw new Error('Network error');
    
    const data = await res.json();
    if (!data?.response) throw new Error('Invalid response');
    
    return data.response;
  })
  .then(response => {
    let content;
    
    if (isTableResponse(response)) {
      content = renderTable(response);
    } else {
      content = document.createTextNode(response);
    }
    
    replaceLoadingMessage(loadingDiv, content);
  })
  .catch(() => {
    replaceLoadingMessage(
      loadingDiv,
      'Sorry, there was an error connecting to the AI.'
    );
  });
}

function isTableResponse(text) {
  return (
    text.includes('<table') || 
    (text.includes('|') && text.split('\n').length > 3)
  );
}

function renderTable(content) {
  if (content.includes('<table')) {
    return createTableContainer(content);
  }
  return createTableContainer(markdownTableToHtml(content));
}

function createTableContainer(html) {
  const container = document.createElement('div');
  container.className = 'table-container';
  container.innerHTML = html;
  return container;
}

function replaceLoadingMessage(loadingDiv, content) {
  if (!loadingDiv) return;
  
  loadingDiv.classList.remove('bot-loading');
  loadingDiv.innerHTML = '';
  loadingDiv.appendChild(content);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Improved table conversion
function markdownTableToHtml(md) {
  const lines = md.trim().split('\n').filter(l => l.includes('|'));
  if (lines.length < 2) return md;
  
  // Parse headers and rows
  const headers = parseRow(lines[0]);
  const rows = [];
  
  // Start from 2 to skip header and separator
  for (let i = 2; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    if (row.length === headers.length) {
      rows.push(row);
    }
  }
  
  // Detect numeric columns
  const isNumeric = headers.map((_, colIndex) => {
    return rows.every(row => {
      const val = row[colIndex];
      return !isNaN(parseFloat(val)) && isFinite(val);
    });
  });
  
  // Build table HTML
  let html = '<table class="chatbot-table"><thead><tr>';
  
  headers.forEach(header => {
    html += `<th>${header}</th>`;
  });
  
  html += '</tr></thead><tbody>';
  
  rows.forEach((row, rowIndex) => {
    html += `<tr>`;
    row.forEach((cell, cellIndex) => {
      const numClass = isNumeric[cellIndex] ? 'numeric' : '';
      html += `<td class="${numClass}">${cell}</td>`;
    });
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  return html;
}

function parseRow(line) {
  return line
    .split('|')
    .map(cell => cell.trim().replace(/^[\s:-]+|[\s:-]+$/g, ''))
    .filter(cell => cell !== '');
}

// Initialize
if (chatForm) {
  chatForm.addEventListener('submit', sendMessage);
}