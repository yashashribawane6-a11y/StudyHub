let currentChat = [];
let chatHistoryList = JSON.parse(localStorage.getItem('chatHistoryList')) || [];
let library = JSON.parse(localStorage.getItem('library')) || [];
let contacts = JSON.parse(localStorage.getItem('contacts')) || [];
let complaints = JSON.parse(localStorage.getItem('complaints')) || [];

document.addEventListener("DOMContentLoaded", () => {
  renderChat(); renderLibrary(); renderContacts(); renderComplaints(); renderChatHistoryList(); startNewChat();
});

function showSection(id) { 
  document.querySelectorAll('.section').forEach(el => el.classList.remove('active')); 
  document.getElementById(id).classList.add('active'); 
  if (id === 'library') renderLibrary(); 
}

function startNewChat() {
  saveCurrentChatIfNeeded();
  currentChat = [];
  renderChat();
  showSection('chat');
}

function saveCurrentChatIfNeeded() {
  if (currentChat.length === 0) return;
  const firstUser = currentChat.find(m => m.type === 'user');
  if (!firstUser) return;
  const title = firstUser.text.slice(0, 30) + (firstUser.text.length > 30 ? "..." : "");
  const id = Date.now();
  if (chatHistoryList.some(c => c.id === id)) return;
  chatHistoryList.push({ id, title, messages: [...currentChat], date: new Date().toLocaleDateString('en-IN') });
  saveChatHistoryList();
  renderChatHistoryList();
}

function deleteChat(id) { 
  if (!confirm("Delete this chat?")) return; 
  chatHistoryList = chatHistoryList.filter(c => c.id !== id); 
  saveChatHistoryList(); 
  renderChatHistoryList(); 
}

function loadChatFromHistory(id) { 
  const chat = chatHistoryList.find(c => c.id === id); 
  if (!chat) return; 
  currentChat = [...chat.messages]; 
  renderChat(); 
  showSection('chat'); 
}

function renderChatHistoryList() {
  const container = document.getElementById("chatHistoryList");
  container.innerHTML = `<small style="color:#888; padding:0 10px;">Chat History</small>`;
  chatHistoryList.slice().reverse().forEach(chat => {
    const div = document.createElement("div");
    div.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:#252525; margin:3px 0; border-radius:6px; cursor:pointer;`;
    const title = document.createElement("span"); title.textContent = chat.title; title.onclick = () => loadChatFromHistory(chat.id);
    const date = document.createElement("small"); date.textContent = chat.date; date.style.color = "#aaa";
    const delBtn = document.createElement("button"); delBtn.textContent = "Delete"; 
    delBtn.style.cssText = "background:#e74c3c; color:white; border:none; padding:2px 6px; font-size:0.7rem; border-radius:4px; margin-left:5px;";
    delBtn.onclick = (e) => { e.stopPropagation(); deleteChat(chat.id); };
    div.appendChild(title); div.appendChild(date); div.appendChild(delBtn); container.appendChild(div);
  });
}

function saveChatHistoryList() { localStorage.setItem('chatHistoryList', JSON.stringify(chatHistoryList)); }

function sendMessage() {
  const input = document.getElementById("userInput"); 
  const text = input.value.trim(); 
  if (!text) return;
  const userMsg = { type: 'user', text }; 
  currentChat.push(userMsg); 
  renderMessage(userMsg); 
  input.value = "";
  setTimeout(() => {
    const answer = getAIAnswer(text); 
    const botMsg = { type: 'bot', text: answer }; 
    currentChat.push(botMsg); 
    renderMessage(botMsg);
  }, 800);
}

function renderMessage(msg) {
  const div = document.createElement("div"); 
  div.className = `message ${msg.type}`;
  div.innerHTML = msg.text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#4ade80;">$1</strong>').replace(/\n/g, '<br>');
  const chatArea = document.getElementById("chatMessages"); 
  chatArea.appendChild(div); 
  chatArea.scrollTop = chatArea.scrollHeight;
}

function renderChat() { 
  const chatArea = document.getElementById("chatMessages"); 
  chatArea.innerHTML = ""; 
  currentChat.forEach(renderMessage); 
  chatArea.scrollTop = chatArea.scrollHeight; 
}

function getAIAnswer(q) {
  const lowerQ = q.toLowerCase().trim();
  if (["hi", "hello"].includes(lowerQ)) return "Hi! How can I help you? Ask a question or upload a file.";
  let best = null; let score = 0;
  for (let item of library) {
    const content = item.text.toLowerCase();
    if (content.includes(lowerQ)) {
      const start = Math.max(0, content.indexOf(lowerQ) - 120);
      const context = content.slice(start, start + 450);
      return `**Answer from ${item.type.toUpperCase()}** (${item.date}):\n\n> _"${q}"_\n\n${context}...\n\n[Open full in Library]`;
    }
    const qWords = lowerQ.split(" ").filter(w => w.length > 2);
    const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 15);
    for (let s of sentences) {
      const sWords = s.split(" ").filter(w => w.length > 2);
      let overlap = qWords.filter(w => sWords.some(sw => sw.includes(w) || w.includes(sw))).length;
      if (overlap > 0) {
        let total = overlap * 15;
        if (total > score) { 
          score = total; 
          const start = Math.max(0, content.indexOf(s) - 100); 
          best = { context: content.slice(start, start + 400), date: item.date, type: item.type }; 
        }
      }
    }
  }
  if (best) return `**Answer from ${best.type.toUpperCase()}** (${best.date}):\n\n${best.context}...\n\n[Open full in Library]`;
  return "Not found in Library. Upload a file to get answers!";
}

async function uploadFile() {
  const fileInput = document.getElementById("fileUpload"); 
  const uploadBtn = document.getElementById("uploadBtn"); 
  const status = document.getElementById("uploadStatus"); 
  const file = fileInput.files[0];
  if (!file) { alert("Please select a file first!"); return; }
  uploadBtn.disabled = true; uploadBtn.textContent = "Uploading..."; 
  status.style.display = "block"; status.style.color = "#4ade80"; 
  status.textContent = `Reading ${file.name}...`;
  const ext = file.name.split('.').pop().toLowerCase(); let text = "";
  try {
    if (ext === 'pdf') { 
      status.textContent = "Extracting PDF..."; 
      const arrayBuffer = await file.arrayBuffer(); 
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise; 
      for (let i = 1; i <= pdf.numPages; i++) { 
        const page = await pdf.getPage(i); 
        const content = await page.getTextContent(); 
        text += content.items.map(item => item.str).join(' ') + '\n'; 
      } 
    }
    else if (ext === 'docx') { 
      status.textContent = "Reading DOCX..."; 
      const arrayBuffer = await file.arrayBuffer(); 
      const result = await mammoth.extractRawText({ arrayBuffer }); 
      text = result.value; 
    }
    else if (ext === 'txt') { 
      status.textContent = "Reading TXT..."; 
      text = await file.text(); 
    }
    else if (['jpg', 'jpeg', 'png'].includes(ext)) { 
      status.textContent = "Running OCR..."; 
      const worker = await Tesseract.createWorker(); 
      await worker.load(); 
      await worker.loadLanguage('eng'); 
      await worker.initialize('eng'); 
      const { data: { text: ocrText } } = await worker.recognize(file); 
      text = ocrText; 
      await worker.terminate(); 
    }
    const id = Date.now(); 
    library.push({ id, text, date: new Date().toLocaleString('en-IN'), type: ext, name: file.name }); 
    saveToStorage(); 
    renderLibrary(); 
    fileInput.value = ""; 
    status.style.color = "#4ade80"; 
    status.textContent = `${file.name} uploaded!`; 
    setTimeout(() => { status.style.display = "none"; }, 3000);
  } catch (e) { 
    console.error(e); 
    status.style.color = "#e74c3c"; 
    status.textContent = `Error: ${e.message}`; 
    setTimeout(() => { status.style.display = "none"; }, 5000); 
  } finally { 
    uploadBtn.disabled = false; 
    uploadBtn.textContent = "Upload File"; 
  }
}

function openFile(id) { 
  const item = library.find(i => i.id === id); 
  if (!item) return; 
  document.getElementById("modalTitle").textContent = item.name; 
  document.getElementById("modalBody").textContent = item.text; 
  document.getElementById("fileModal").style.display = "block"; 
}
function closeModal() { document.getElementById("fileModal").style.display = "none"; }
function deleteLibraryItem(id) { 
  if (confirm("Delete this file?")) { 
    library