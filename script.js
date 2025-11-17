let currentChat = [];
let chatHistoryList = JSON.parse(localStorage.getItem('chatHistoryList')) || [];
let library = JSON.parse(localStorage.getItem('library')) || [];
let contacts = JSON.parse(localStorage.getItem('contacts')) || [];
let complaints = JSON.parse(localStorage.getItem('complaints')) || [];

document.addEventListener("DOMContentLoaded", () => {
  renderChat();
  renderLibrary();
  renderContacts();
  renderComplaints();
  renderChatHistoryList();
  startNewChat();
});

function showSection(id) {
  document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'library') renderLibrary();
  if (id === 'complaints') renderComplaints();
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
    const delBtn = document.createElement("button"); delBtn.textContent = "Delete"; delBtn.style.cssText = "background:#e74c3c; color:white; border:none; padding:2px 6px; font-size:0.7rem; border-radius:4px; margin-left:5px;";
    delBtn.onclick = (e) => { e.stopPropagation(); deleteChat(chat.id); };
    div.appendChild(title); div.appendChild(date); div.appendChild(delBtn); container.appendChild(div);
  });
}

function saveChatHistoryList() {
  localStorage.setItem('chatHistoryList', JSON.stringify(chatHistoryList));
}

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
  if (!file) return alert("Please select a file!");
  uploadBtn.disabled = true;
  uploadBtn.textContent = "Uploading...";
  status.style.display = "block";
  status.style.color = "#4ade80";
  status.textContent = `Reading ${file.name}...`;
  const ext = file.name.split('.').pop().toLowerCase();
  let text = "";
  try {
    if (ext === 'txt') {
      text = await file.text();
    } else {
      const reader = new FileReader();
      reader.onload = function(e) {
        text = e.target.result;
        library.push({ id: Date.now(), text, date: new Date().toLocaleString('en-IN'), type: ext, name: file.name });
        saveToStorage();
        renderLibrary();
        fileInput.value = "";
        status.textContent = `${file.name} uploaded!`;
        setTimeout(() => status.style.display = "none", 3000);
        uploadBtn.disabled = false;
        uploadBtn.textContent = "Upload File";
      };
      reader.readAsText(file);
      return;
    }
    library.push({ id: Date.now(), text, date: new Date().toLocaleString('en-IN'), type: ext, name: file.name });
    saveToStorage();
    renderLibrary();
    fileInput.value = "";
    status.textContent = `${file.name} uploaded!`;
    setTimeout(() => status.style.display = "none", 3000);
  } catch (e) {
    status.style.color = "#e74c3c";
    status.textContent = `Error: ${e.message}`;
    setTimeout(() => status.style.display = "none", 3000);
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

function closeModal() {
  document.getElementById("fileModal").style.display = "none";
}

function deleteLibraryItem(id) {
  if (confirm("Delete this file?")) {
    library = library.filter(item => item.id !== id);
    saveToStorage();
    renderLibrary();
  }
}

function renderLibrary() {
  const div = document.getElementById("libraryItems");
  div.innerHTML = "";
  library.forEach(item => {
    const el = document.createElement("div");
    el.className = "library-item";
    const preview = item.text.length > 150 ? item.text.slice(0, 150) + "..." : item.text;
    const icon = { pdf: 'PDF', docx: 'DOCX', txt: 'TXT', jpg: 'IMG', jpeg: 'IMG', png: 'IMG' }[item.type] || 'FILE';
    el.innerHTML = `
      <span class="icon">${icon}</span> <strong>#${library.indexOf(item)+1}</strong> - ${item.name}
      <div class="date">${item.date}</div>
      <p>${preview}</p>
      <div class="actions">
        <button class="open" onclick="openFile(${item.id})">Open</button>
        <button class="delete" onclick="deleteLibraryItem(${item.id})">Delete</button>
      </div>
    `;
    div.appendChild(el);
  });
}

function addContact() {
  const name = document.getElementById("newContactName").value.trim();
  const phone = document.getElementById("newContactPhone").value.trim();
  if (!name) return alert("Name enter karo!");
  contacts.push({ id: Date.now(), name, phone });
  saveToStorage();
  renderContacts();
  document.getElementById("newContactName").value = "";
  document.getElementById("newContactPhone").value = "";
}

function deleteContact(id) {
  if (confirm("Delete this contact?")) {
    contacts = contacts.filter(c => c.id !== id);
    saveToStorage();
    renderContacts();
  }
}

function sendMessageToContact(phone, name) {
  if (!phone) return alert("No phone number!");
  const message = prompt(`Message to ${name}:`, "Hi!");
  if (message) {
    const url = `sms:${phone}?body=${encodeURIComponent(message)}`;
    window.location.href = url;
  }
}

function renderContacts() {
  const div = document.getElementById("contactList");
  div.innerHTML = "";
  contacts.forEach(c => {
    const el = document.createElement("div");
    el.className = "contact-item";
    el.innerHTML = `
      <div>
        <strong>${c.name}</strong><br>
        <small>${c.phone || 'No number'}</small>
      </div>
      <div>
        <button onclick="sendMessageToContact('${c.phone}', '${c.name}')">Send Message</button>
        <button class="delete" onclick="deleteContact(${c.id})">Delete</button>
      </div>
    `;
    div.appendChild(el);
  });
}

function openComplaintForm() {
  document.getElementById("complaintModal").style.display = "block";
  document.getElementById("complaintSubject").value = "";
  document.getElementById("complaintDesc").value = "";
}

function closeComplaintForm() {
  document.getElementById("complaintModal").style.display = "none";
}

function submitComplaintForm(e) {
  e.preventDefault();
  const subject = document.getElementById("complaintSubject").value.trim();
  const desc = document.getElementById("complaintDesc").value.trim();
  if (!subject || !desc) return alert("Subject and Description fill karo!");
  complaints.push({ id: Date.now(), subject, desc, date: new Date().toLocaleString('en-IN'), status: "Pending" });
  saveToStorage();
  renderComplaints();
  closeComplaintForm();
  alert("Complaint added!");
}

function deleteComplaint(id) {
  if (confirm("Delete this complaint?")) {
    complaints = complaints.filter(c => c.id !== id);
    saveToStorage();
    renderComplaints();
  }
}

function renderComplaints() {
  const div = document.getElementById("complaintList");
  div.innerHTML = "";
  if (complaints.length === 0) {
    div.innerHTML = "<p style='color:#888; text-align:center;'>No complaints yet.</p>";
    return;
  }
  complaints.forEach(c => {
    const el = document.createElement("div");
    el.className = "library-item";
    el.style.borderLeft = "4px solid #e67e22";
    el.innerHTML = `
      <strong>${c.subject}</strong>
      <div class="date">${c.date}</div>
      <p style="margin:8px 0; font-size:0.88rem; color:#ccc;">${c.desc}</p>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
        <span style="background:${c.status==='Pending'?'#e67e22':'#27ae60'}; color:#000; padding:4px 10px; border-radius:20px; font-size:0.75rem; font-weight:bold;">
          ${c.status}
        </span>
        <button class="delete" onclick="deleteComplaint(${c.id})" style="font-size:0.7rem;">Delete</button>
      </div>
    `;
    div.appendChild(el);
  });
}

function saveToStorage() {
  localStorage.setItem('library', JSON.stringify(library));
  localStorage.setItem('contacts', JSON.stringify(contacts));
  localStorage.setItem('complaints', JSON.stringify(complaints));
  localStorage.setItem('chatHistoryList', JSON.stringify(chatHistoryList));
}

// Global functions
window.showSection = showSection;
window.startNewChat = startNewChat;
window.sendMessage = sendMessage;
window.uploadFile = uploadFile;
window.openFile = openFile;
window.closeModal = closeModal;
window.deleteLibraryItem = deleteLibraryItem;
window.addContact = addContact;
window.deleteContact = deleteContact;
window.sendMessageToContact = sendMessageToContact;
window.openComplaintForm = openComplaintForm;
window.closeComplaintForm = closeComplaintForm;
window.submitComplaintForm = submitComplaintForm;
window.deleteComplaint = deleteComplaint;
