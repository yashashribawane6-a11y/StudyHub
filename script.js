const ADMIN_PASS = "yashashri123";

let library = JSON.parse(localStorage.getItem("library") || "[]");
let contacts = JSON.parse(localStorage.getItem("contacts") || "[]");
let complaints = JSON.parse(localStorage.getItem("complaints") || "[]");

// Admin Login
function adminLogin() {
  let p = prompt("Admin Password:");
  if (p === ADMIN_PASS) {
    localStorage.setItem("isAdmin", "true");
    document.getElementById("adminUpload").style.display = "block";
    renderLibrary();
  }
}
if (localStorage.getItem("isAdmin") === "true") {
  document.getElementById("adminUpload").style.display = "block";
}

// Sidebar Toggle
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
  document.getElementById("overlay").classList.toggle("active");
}

// Show Section
function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  if (id === "library") renderLibrary();
  if (id === "contacts") renderContacts();
}

// Chat
function sendMessage() {
  let input = document.getElementById("userInput");
  let text = input.value.trim();
  if (!text) return;
  let div = document.createElement("div");
  div.className = "message user";
  div.textContent = text;
  document.getElementById("chatMessages").appendChild(div);
  input.value = "";
  setTimeout(() => {
    let bot = document.createElement("div");
    bot.className = "message bot";
    bot.textContent = "Demo answer from AskMe!";
    document.getElementById("chatMessages").appendChild(bot);
  }, 600);
}
function startNewChat() {
  document.getElementById("chatMessages").innerHTML = "";
  showSection("chat");
}

// === NEW UPLOAD FUNCTION - SAB FILES SUPPORT ===
function uploadFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const url = e.target.result;
    let preview = "";

    if (file.type.startsWith('image/')) {
      preview = `<img src="${url}" style="max-width:100%; border-radius:10px; margin:10px 0;">`;
    } else if (file.type === 'application/pdf') {
      preview = `<iframe src="${url}#toolbar=0" style="width:100%; height:600px; border:none;"></iframe>`;
    } else if (file.type.startsWith('video/')) {
      preview = `<video controls style="max-width:100%; border-radius:10px;"><source src="${url}"></video>`;
    } else {
      preview = `<pre style="background:#222; padding:15px; border-radius:8px; overflow:auto; max-height:400px;">${e.target.result}</pre>`;
    }

    library.unshift({
      id: Date.now(),
      name: file.name,
      type: file.type,
      url: url,
      preview: preview,
      date: new Date().toLocaleDateString("en-IN")
    });

    localStorage.setItem("library", JSON.stringify(library));
    renderLibrary();
    alert(file.name + " uploaded!");
  };

  if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.type.startsWith('video/')) {
    reader.readAsDataURL(file);
  } else {
    reader.readAsText(file);
  }
}

// === NEW RENDER LIBRARY ===
function renderLibrary() {
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  document.getElementById("adminUpload").style.display = isAdmin ? "block" : "none";

  let html = "";
  library.forEach(item => {
    const delBtn = isAdmin
      ? `<button onclick="deleteItem(${item.id})" style="background:#e74c3c; color:white; padding:8px 16px; border:none; border-radius:8px; margin-top:10px;">Delete</button>`
      : `<button onclick="deleteItem(${item.id})" style="background:#666; padding:8px 16px; border:none; border-radius:8px; margin-top:10px;">Delete (Me only)</button>`;

    html += `
      <div class="library-item">
        <strong>${item.name}</strong> <small>${item.date}</small><br>
        ${item.preview}
        <div>${delBtn}</div>
      </div>
      <hr style="border:0.5px solid #333; margin:20px 0;">
    `;
  });
  document.getElementById("libraryItems").innerHTML = html || "<p style='color:#888; text-align:center;'>Library empty hai</p>";
}

// Delete Item
function deleteItem(id) {
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  if (isAdmin) {
    if (confirm("OK = Delete for everyone\nCancel = Delete for me only")) {
      library = library.filter(x => x.id !== id);
      localStorage.setItem("library", JSON.stringify(library));
      alert("Deleted for everyone!");
    } else {
      alert("Deleted for me only");
    }
  } else {
    alert("Deleted for me only");
  }
  renderLibrary();
}

// Contacts, Complaints – same as before (koi change nahi)
function renderContacts() { /* same */ }
function openComplaintForm() { document.getElementById("complaintModal").style.display = "block"; }
function closeComplaintForm() { document.getElementById("complaintModal").style.display = "none"; }
function submitComplaintForm() { /* same */ }

// Start
showSection("chat");
renderLibrary();
