const ADMIN_PASS = "yashashri123";

let library = JSON.parse(localStorage.getItem("library") || "[]");
let contacts = JSON.parse(localStorage.getItem("contacts") || "[]");
let complaints = JSON.parse(localStorage.getItem("complaints") || "[]");

// Admin login
function adminLogin() {
  let p = prompt("Admin Password:");
  if (p === ADMIN_PASS) {
    localStorage.setItem("isAdmin","true");
    document.getElementById("adminControls").style.display = "block";
    renderLibrary(); renderContacts();
  }
}
if (localStorage.getItem("isAdmin")==="true") document.getElementById("adminControls").style.display = "block";

// Hamburger
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
  document.getElementById("overlay").classList.toggle("active");
}

// Chat
function sendMessage() {
  let input = document.getElementById("userInput");
  let text = input.value.trim();
  if (!text) return;
  let div = document.createElement("div");
  div.className = "message user"; div.textContent = text;
  document.getElementById("chatMessages").appendChild(div);
  input.value = "";
  setTimeout(() => {
    let bot = document.createElement("div");
    bot.className = "message bot"; bot.textContent = "Demo answer!";
    document.getElementById("chatMessages").appendChild(bot);
  }, 600);
}
function startNewChat() {
  document.getElementById("chatMessages").innerHTML = "";
  showSection("chat");
}
function showSection(id) {
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  if(id==="library") renderLibrary();
  if(id==="contacts") renderContacts();
}

// Quick Note
function addQuickNote() {
  let title = prompt("Title:");
  let text = prompt("Note:");
  if(title && text){
    library.unshift({id:Date.now(), name:"Quick: "+title, text, date:new Date().toLocaleDateString("en-IN")});
    localStorage.setItem("library", JSON.stringify(library));
    renderLibrary();
  }
}

// Upload File
function uploadFile(file) {
  if(!file) return;
  let reader = new FileReader();
  reader.onload = function(e) {
    library.unshift({id:Date.now(), name:file.name, text:e.target.result.substr(0,500)+"...", date:new Date().toLocaleDateString("en-IN")});
    localStorage.setItem("library", JSON.stringify(library));
    renderLibrary();
  };
  reader.readAsText(file);
}

// Delete with options
function deleteItem(id) {
  const isAdmin = localStorage.getItem("isAdmin")==="true";
  if(isAdmin){
    if(confirm("OK = Delete for everyone\nCancel = Delete for me")){
      library = library.filter(x=>x.id!==id);
      localStorage.setItem("library", JSON.stringify(library));
      alert("Deleted for everyone!");
    }else{
      alert("Deleted for me only");
    }
  }else{
    alert("Deleted for me only");
  }
  renderLibrary();
}

// Render Library
function renderLibrary() {
  const isAdmin = localStorage.getItem("isAdmin")==="true";
  let html = "";
  library.forEach(item => {
    const delBtn = isAdmin 
      ? `<button onclick="deleteItem(${item.id})" class="delete-everyone">Delete</button>`
      : `<button onclick="deleteItem(${item.id})">Delete</button>`;
    html += `<div class="library-item"><strong>${item.name}</strong><br><small>${item.date}</small><p>${item.text}</p>${delBtn}</div>`;
  });
  document.getElementById("libraryItems").innerHTML = html || "<p>No files yet</p>";
}

// Contacts (same delete logic)
function addContactPrompt() {
  let name = prompt("Name:");
  let phone = prompt("Phone:");
  if(name && phone){
    contacts.unshift({id:Date.now(), name, phone});
    localStorage.setItem("contacts", JSON.stringify(contacts));
    renderContacts();
  }
}
function sendSMS(phone, name) {
  let msg = prompt("Message to "+name+":");
  if(msg) window.location.href = `sms:${phone}?body=${encodeURIComponent(msg)}`;
}
function renderContacts() {
  let html = "";
  contacts.forEach(c => {
    html += `<div class="contact-item"><div><strong>${c.name}</strong><br>${c.phone}</div>
      <button onclick="sendSMS('${c.phone}','${c.name}')">Message</button></div>`;
  });
  document.getElementById("contactList").innerHTML = html || "<p>No contacts</p>";
}

// Complaints
function openComplaintForm(){document.getElementById("complaintModal").style.display="block";}
function closeComplaintForm(){document.getElementById("complaintModal").style.display="none";}
function submitComplaintForm(){
  let sub = document.getElementById("complaintSubject").value.trim();
  let desc = document.getElementById("complaintDesc").value.trim();
  if(sub && desc){
    complaints.push({subject:sub, desc, date:new Date().toLocaleDateString("en-IN")});
    localStorage.setItem("complaints", JSON.stringify(complaints));
    closeComplaintForm(); renderComplaints();
  }
}
function renderComplaints(){
  document.getElementById("complaintList").innerHTML = complaints.map(c=>`<div class="complaint-item"><strong>${c.subject}</strong><p>${c.desc}</p><small>${c.date}</small></div>`).join("") || "<p>No complaints</p>";
}

// Start
showSection("chat");
renderLibrary();
renderContacts();
renderComplaints();
