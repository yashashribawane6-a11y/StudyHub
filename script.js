const ADMIN_PASS = "yashashri123";  // ← change kar sakti ho

let currentChat = [];
let library = JSON.parse(localStorage.getItem("library")) || [];
let contacts = JSON.parse(localStorage.getItem("contacts")) || [];
let complaints = JSON.parse(localStorage.getItem("complaints")) || [];

// Hamburger menu toggle
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
  document.getElementById("overlay").classList.toggle("active");
}

// Admin login
function adminLogin() {
  let pass = prompt("Admin Password:");
  if (pass === ADMIN_PASS) {
    document.getElementById("adminControls").style.display = "block";
    localStorage.setItem("isAdmin", "true");
    alert("Admin mode ON!");
  }
}
if (localStorage.getItem("isAdmin") === "true") {
  document.getElementById("adminControls").style.display = "block";
}

// Add Contact (only admin)
function addContactPrompt() {
  let name = prompt("Contact Name:");
  let phone = prompt("Phone Number (with country code):");
  if (name && phone) {
    contacts.push({ name, phone });
    localStorage.setItem("contacts", JSON.stringify(contacts));
    renderContacts();
  }
}

// Send SMS (real message jaayega)
function sendSMS(phone, name) {
  let msg = prompt(`Message to ${name}:`, "Hi!");
  if (msg) {
    window.location.href = `sms:${phone}?body=${encodeURIComponent(msg)}`;
  }
}

// Render Contacts
function renderContacts() {
  let html = "";
  contacts.forEach(c => {
    html += `
      <div class="contact-item">
        <div>
          <strong>${c.name}</strong><br>
          <small>${c.phone}</small>
        </div>
        <button class="msg-btn" onclick="sendSMS('${c.phone}','${c.name}')">Message</button>
      </div>
    `;
  });
  document.getElementById("contactList").innerHTML = html || "<p>No contacts yet</p>";
}

// Chat & other functions (shortened for space - baaki sab same rahega)
function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  if (id === "contacts") renderContacts();
}
function startNewChat() { currentChat = []; document.getElementById("chatMessages").innerHTML = ""; showSection("chat"); }
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
    bot.textContent = "Hi! Demo chal raha hai 😊";
    document.getElementById("chatMessages").appendChild(bot);
  }, 800);
}

// Load on start
showSection("chat");
renderContacts();
