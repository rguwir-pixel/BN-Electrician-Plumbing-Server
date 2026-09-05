let jobs = JSON.parse(localStorage.getItem("bn_jobs") || "[]");

let profile = JSON.parse(
  localStorage.getItem("bn_profile") || "{}"
);

// PAGE CHANGE
function showPage(page) {
  document.querySelectorAll(".page").forEach(function(el) {
    el.classList.remove("active");
  });
  const target = document.getElementById(page);
  if (target) {
    target.classList.add("active");
  }
  if (page === "jobs") {
    displayJobs();
  }
}

// ==========================================
// LOGIN SYSTEM (To connect to the server)
// ==========================================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async function(e) {
    e.preventDefault(); 

    // Match these IDs with your HTML (email, name, role)
    const email = document.getElementById("email").value;
    const name = document.getElementById("name").value;
    const role = document.getElementById("role").value; 

    // Your Render Server URL
    const serverUrl = "https://bn-electrician-plumbing-server-1.onrender.com/login"; 

    try {
      // Send request to the server
      const response = await fetch(serverUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email, name: name, role: role })
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ Login successful!");
        
        // Save profile
        profile = { name: name, role: role, email: email };
        localStorage.setItem("bn_profile", JSON.stringify(profile));
        
        // Show jobs page after login
        showPage("jobs"); 
        
      } else {
        alert("❌ Login failed: " + (data.message || "Server error"));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Cannot connect to the server. Please check your internet connection or server status.");
    }
  });
}

// JOB POST
const jobForm = document.getElementById("jobForm");
if (jobForm) {
  jobForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const job = {
      id: Date.now(),
      type: document.getElementById("jobType").value,
      description: document.getElementById("description").value,
      place: document.getElementById("place").value,
      phone: document.getElementById("phone").value,
      price: document.getElementById("price").value,
      date: new Date().toLocaleString("en-IN")
    };

    jobs.unshift(job);
    localStorage.setItem("bn_jobs", JSON.stringify(jobs));
    alert("✅ Job posted successfully");
    this.reset();
    showPage("jobs");
  });
}

// SHOW JOBS
function displayJobs() {
  const list = document.getElementById("jobList");
  if (!list) return;

  if (jobs.length === 0) {
    list.innerHTML = "<p>No jobs available right now.</p>";
    return;
  }

  list.innerHTML = "";
  jobs.forEach(function(job) {
    const card = document.createElement("div");
    card.className = "job-card";
    card.innerHTML = `
      <h3>${escapeHTML(job.type)}</h3>
      <p>📝 ${escapeHTML(job.description)}</p>
      <p>📍 ${escapeHTML(job.place)}</p>
      <p>💰 ₹${escapeHTML(job.price || "Negotiable")}</p>
      <p>🕐 ${escapeHTML(job.date)}</p>
      <button class="take-job" onclick="takeJob(${job.id})">Take Job</button>
      <button class="call" onclick="callUser('${job.phone}')">📞 Call</button>
      <button class="whatsapp" onclick="openWhatsApp('${job.phone}')">🟢 WhatsApp</button>
      <button class="chat" onclick="openChat('${job.phone}')">💬 Chat</button>
    `;
    list.appendChild(card);
  });
}

// TAKE JOB
function takeJob(id) {
  const job = jobs.find(function(j) { return j.id === id; });
  if (!job) return;
  alert("✅ You have sent a request to take this job.\n\nJob: " + job.type);
}

// CALL
function callUser(phone) {
  if (!phone) {
    alert("Mobile number is not available");
    return;
  }
  window.location.href = "tel:" + phone;
}

// WHATSAPP
function openWhatsApp(phone) {
  if (!phone) {
    alert("Mobile number is not available");
    return;
  }
  let number = phone.replace(/\D/g, "");
  if (number.length === 10) { number = "91" + number; }
  window.open("https://wa.me/" + number, "_blank");
}

// CHAT DEMO
function openChat(phone) {
  alert("💬 Chat System\n\nUser: " + phone + "\n\nA backend server is required to enable real-time online chat.");
}

// LOCATION
function getLocation() {
  const text = document.getElementById("locationText");
  if (!text) return;

  if (!navigator.geolocation) {
    text.innerText = "Location is not available on this device";
    return;
  }

  text.innerText = "📍 Fetching location...";
  navigator.geolocation.getCurrentPosition(
    function(position) {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      text.innerHTML = `Latitude: ${lat}<br>Longitude: ${lon}<br><a target="_blank" href="https://www.google.com/maps?q=${lat},${lon}">🗺️ View in Google Maps</a>`;
    },
    function() { text.innerText = "Location permission denied."; }
  );
}

// LIVE LOCATION
let liveWatch = null;
function startLiveLocation() {
  if (!navigator.geolocation) {
    alert("Location is not available");
    return;
  }

  if (liveWatch !== null) {
    navigator.geolocation.clearWatch(liveWatch);
    liveWatch = null;
    alert("🔴 Live location turned off");
    return;
  }

  liveWatch = navigator.geolocation.watchPosition(
    function(position) {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const locText = document.getElementById("locationText");
      if (locText) {
        locText.innerHTML = `🔴 Live Location Active<br>${lat}, ${lon}<br><a target="_blank" href="https://www.google.com/maps?q=${lat},${lon}">🗺️ View in Maps</a>`;
      }
    },
    function() { alert("Location permission denied."); }
  );
  alert("🔴 Live location turned on");
}

// STATUS
function addStatus() {
  const textElem = document.getElementById("statusText");
  const fileElem = document.getElementById("photoInput");
  if (!textElem || !fileElem) return;

  const text = textElem.value;
  const file = fileElem.files[0];

  if (!text && !file) {
    alert("Please add a photo or status text");
    return;
  }

  const reader = new FileReader();
  reader.onload = function() {
    const div = document.createElement("div");
    div.className = "status-card";
    div.innerHTML = `<b>👤 BN User</b><p>${escapeHTML(text)}</p>${file ? `<img src="${reader.result}">` : ""}`;
    const statusList = document.getElementById("statusList");
    if (statusList) statusList.prepend(div);
  };

  if (file) {
    reader.readAsDataURL(file);
  } else {
    reader.onload();
  }

  textElem.value = "";
  fileElem.value = "";
}

// PROFILE
function saveProfile() {
  const nameElem = document.getElementById("userName");
  const roleElem = document.getElementById("userRole");
  const cityElem = document.getElementById("userCity");
  const expElem = document.getElementById("experience");
  
  if (nameElem && roleElem && cityElem && expElem) {
    profile = {
      name: nameElem.value,
      role: roleElem.value,
      city: cityElem.value,
      experience: expElem.value
    };
    localStorage.setItem("bn_profile", JSON.stringify(profile));
    alert("✅ Profile saved successfully");
  }
}

// SUBSCRIPTION
function subscription(amount) {
  const statusElem = document.getElementById("subscriptionStatus");
  if (statusElem) {
    statusElem.innerText = `You have selected the ₹${amount} per month plan.\nA payment gateway/backend is required to add real UPI AutoPay.`;
  }
}

// SECURITY
function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// LOAD PROFILE
function loadProfile() {
  if (!profile) return;
  const uName = document.getElementById("userName");
  const uRole = document.getElementById("userRole");
  const uCity = document.getElementById("userCity");
  const uExp = document.getElementById("experience");
  
  if(uName) uName.value = profile.name || "";
  if(uRole) uRole.value = profile.role || "Customer";
  if(uCity) uCity.value = profile.city || "";
  if(uExp) uExp.value = profile.experience || "";
}

loadProfile();
displayJobs();
        
