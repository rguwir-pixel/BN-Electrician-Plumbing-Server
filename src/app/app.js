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


// JOB POST

document.getElementById("jobForm").addEventListener("submit", function(e) {

  e.preventDefault();

  const job = {

    id: Date.now(),

    type: document.getElementById("jobType").value,

    description:
      document.getElementById("description").value,

    place:
      document.getElementById("place").value,

    phone:
      document.getElementById("phone").value,

    price:
      document.getElementById("price").value,

    date:
      new Date().toLocaleString("hi-IN")

  };

  jobs.unshift(job);

  localStorage.setItem(
    "bn_jobs",
    JSON.stringify(jobs)
  );

  alert("✅ काम सफलतापूर्वक पोस्ट हो गया");

  this.reset();

  showPage("jobs");
});


// SHOW JOBS

function displayJobs() {

  const list = document.getElementById("jobList");

  if (jobs.length === 0) {

    list.innerHTML =
      "<p>अभी कोई काम उपलब्ध नहीं है।</p>";

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

      <p>💰 ₹${escapeHTML(job.price || "बातचीत से")}</p>

      <p>🕐 ${escapeHTML(job.date)}</p>

      <button class="take-job"
        onclick="takeJob(${job.id})">
        काम लेना है
      </button>

      <button class="call"
        onclick="callUser('${job.phone}')">
        📞 कॉल
      </button>

      <button class="whatsapp"
        onclick="openWhatsApp('${job.phone}')">
        🟢 WhatsApp
      </button>

      <button class="chat"
        onclick="openChat('${job.phone}')">
        💬 चैट
      </button>

    `;

    list.appendChild(card);
  });
}


// TAKE JOB

function takeJob(id) {

  const job = jobs.find(function(j) {
    return j.id === id;
  });

  if (!job) return;

  alert(
    "✅ आपने काम लेने का अनुरोध भेज दिया है।\n\n" +
    "काम: " + job.type
  );
}


// CALL

function callUser(phone) {

  if (!phone) {
    alert("मोबाइल नंबर उपलब्ध नहीं है");
    return;
  }

  window.location.href = "tel:" + phone;
}


// WHATSAPP

function openWhatsApp(phone) {

  if (!phone) {
    alert("मोबाइल नंबर उपलब्ध नहीं है");
    return;
  }

  let number = phone.replace(/\D/g, "");

  if (number.length === 10) {
    number = "91" + number;
  }

  window.open(
    "https://wa.me/" + number,
    "_blank"
  );
}


// CHAT DEMO

function openChat(phone) {

  alert(
    "💬 चैट सिस्टम\n\n" +
    "यूजर: " + phone +
    "\n\nअसली ऑनलाइन चैट के लिए सर्वर जोड़ना होगा।"
  );
}


// LOCATION

function getLocation() {

  const text =
    document.getElementById("locationText");

  if (!navigator.geolocation) {

    text.innerText =
      "इस फोन में लोकेशन उपलब्ध नहीं है";

    return;
  }

  text.innerText =
    "📍 लोकेशन प्राप्त की जा रही है...";

  navigator.geolocation.getCurrentPosition(

    function(position) {

      const lat =
        position.coords.latitude;

      const lon =
        position.coords.longitude;

      text.innerHTML =
        `Latitude: ${lat}<br>
         Longitude: ${lon}<br>
         <a target="_blank"
         href="https://www.google.com/maps?q=${lat},${lon}">
         🗺️ Google Maps में देखें
         </a>`;

    },

    function() {

      text.innerText =
        "लोकेशन की अनुमति नहीं मिली।";

    }
  );
}


// LIVE LOCATION

let liveWatch = null;

function startLiveLocation() {

  if (!navigator.geolocation) {

    alert("लोकेशन उपलब्ध नहीं है");

    return;
  }

  if (liveWatch !== null) {

    navigator.geolocation.clearWatch(liveWatch);

    liveWatch = null;

    alert("🔴 लाइव लोकेशन बंद कर दी गई");

    return;
  }

  liveWatch =
    navigator.geolocation.watchPosition(

      function(position) {

        const lat =
          position.coords.latitude;

        const lon =
          position.coords.longitude;

        document.getElementById(
          "locationText"
        ).innerHTML =

          `🔴 लाइव लोकेशन चालू<br>
           ${lat}, ${lon}<br>
           <a target="_blank"
           href="https://www.google.com/maps?q=${lat},${lon}">
           🗺️ Maps में देखें
           </a>`;
      },

      function() {

        alert(
          "लोकेशन की अनुमति नहीं मिली।"
        );

      }
    );

  alert("🔴 लाइव लोकेशन चालू हो गई");
}


// STATUS

function addStatus() {

  const text =
    document.getElementById("statusText").value;

  const file =
    document.getElementById("photoInput").files[0];

  if (!text && !file) {

    alert(
      "फोटो या स्टेटस जरूर डालें"
    );

    return;
  }

  const reader =
    new FileReader();

  reader.onload = function() {

    const div =
      document.createElement("div");

    div.className = "status-card";

    div.innerHTML = `
      <b>👤 BN User</b>
      <p>${escapeHTML(text)}</p>
      ${
        file
        ? `<img src="${reader.result}">`
        : ""
      }
    `;

    document
      .getElementById("statusList")
      .prepend(div);

  };

  if (file) {

    reader.readAsDataURL(file);

  } else {

    reader.onload();

  }

  document.getElementById(
    "statusText"
  ).value = "";

  document.getElementById(
    "photoInput"
  ).value = "";
}


// PROFILE

function saveProfile() {

  profile = {

    name:
      document.getElementById("userName").value,

    role:
      document.getElementById("userRole").value,

    city:
      document.getElementById("userCity").value,

    experience:
      document.getElementById("experience").value

  };

  localStorage.setItem(
    "bn_profile",
    JSON.stringify(profile)
  );

  alert("✅ प्रोफाइल सेव हो गई");
}


// SUBSCRIPTION

function subscription(amount) {

  document.getElementById(
    "subscriptionStatus"
  ).innerText =

    `आपने ₹${amount} प्रति माह वाला प्लान चुना है।\n` +
    `असली UPI AutoPay जोड़ने के लिए payment gateway/backend जरूरी होगा।`;
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

  document.getElementById("userName").value =
    profile.name || "";

  document.getElementById("userRole").value =
    profile.role || "कस्टमर";

  document.getElementById("userCity").value =
    profile.city || "";

  document.getElementById("experience").value =
    profile.experience || "";
}

loadProfile();
displayJobs();
