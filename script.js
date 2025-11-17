const ADMIN_PASS = "yashashri123";  // ← ye change kar sakti ho

let currentChat = [];
let library = JSON.parse(localStorage.getItem("library")) || [];
let contacts = JSON.parse(localStorage.getItem("contacts")) || [];
let complaints = JSON.parse(localStorage.getItem("complaints")) || [];

function adminLogin() {
  let pass = prompt("Admin Password daalo:");
  if (pass === ADMIN_PASS) {
    document.getElementById("adminControls").style.display = "block";
    localStorage.setItem("admin", "true");
    alert("Admin mode ON! Ab tum add kar sakti ho");
  } else alert("Galat password!");
}

// Page load pe check
if (localStorage.getItem("admin") === "true") {
  document.getElementById("adminControls").style.display = "block";
}

function showSection(sec) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(sec).classList.add("active");
  if (sec === "library") renderLibrary();
  if (sec === "complaints") renderComplaints();
}

function startNewChat() {
  currentChat = [];
  document.getElementById("chatMessages").innerHTML = "";
  showSection("chat");
}

function sendMessage() {
  let input = document.getElementById("userInput");
  let msg = input.value.trim();
  if (!msg) return;
  addMessage(msg, "user");
  input.value = "";
  setTimeout(() => addMessage("Demo answer hai! Full version jaldi aa raha hai 😊", "bot"), 800);
}

function addMessage(text, type) {
  let div = document.createElement("div");
  div.className = "message " + type;
  div.textContent = text;
  document.getElementById("chatMessages").appendChild(div);
  div.scrollIntoView();
}

// Quick Note add
function addQuickNote() {
  let title = prompt("Quick Note Title (jaise 'Holiday'):");
  let text = prompt("Message:");
  if (title && text) {
    library.unshift({ name: "Quick: " + title, text: text, date: new Date().toLocaleDateString("en-IN") });
    saveLibrary();
    renderLibrary();
    alert("Quick note add ho gaya! Sabko dikhega");
  }
}

// File upload
function uploadFile(file) {
  if (!file) return;
  let reader = new FileReader();
  reader.onload = function(e) {
    library.unshift({ name: file.name, text: e.target.result.substr(0,500)+"...", date: new Date().toLocaleDateString("en-IN") });
    saveLibrary();
    renderLibrary();
    alert(file.name + " add ho gaya!");
  };
  reader.readAsText(file);
}

function renderLibrary() {
  let list = document.getElementById("libraryItems");
  list.innerHTML = library.map(item => `
    <div class="library-item">
      <strong>${item.name}</strong><br>
      <small>${item.date}</small>
      <p>${item.text}</p>
    </div>
  `).join("");
}

function saveLibrary() {
  localStorage.setItem("library", JSON.stringify(library));
}

// Complaints
function openComplaintForm() { document.getElementById("complaintModal").style.display = "block"; }
function closeComplaintForm() { document.getElementById("complaintModal").style.display = "none"; }
function submitComplaintForm() {
  let sub = document.getElementById("complaintSubject").value.trim();
  let desc = document.getElementById("complaintDesc").value.trim();
  if (sub && desc) {
    complaints.push({ subject: sub, desc: desc, date: new Date().toLocaleDateString("en-IN") });
    localStorage.setItem("complaints", JSON.stringify(complaints));
    renderComplaints();
    closeComplaintForm();
  }
}

function renderComplaints() {
  document.getElementById("complaintList").innerHTML = complaints.map(c => `
    <div class="complaint-item">
      <strong>${c.subject}</strong> <small>${c.date}</small>
      <p>${c.desc}</p>
    </div>
  `).join("");
}

// Start
showSection("chat");
renderLibrary();
renderComplaints();
