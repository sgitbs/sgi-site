
(function(){"use strict";
const WEB_APP_URL = window.SGI_WEB_APP_URL || "https://script.google.com/macros/s/AKfycbyauvvLHcFRRtGz1O9d-I4HkNjheiAEv5mryEy5HCIslN1HzX4RMe48fnGFXuqOfxvG/exec";
const EMAIL = "sales@sgitbs.com";
let pageLoadTS = Date.now();

// Carousel controls
const track = document.querySelector(".carousel .track");
const prevBtn = document.querySelector(".carousel .prev");
const nextBtn = document.querySelector(".carousel .next");
if (track && prevBtn && nextBtn) {
  prevBtn.addEventListener("click", ()=> track.scrollBy({ left: -340, behavior: "smooth" }));
  nextBtn.addEventListener("click", ()=> track.scrollBy({ left: 340, behavior: "smooth" }));
}

// Scroll to quote form when "Check ZIP" clicked (Option B)
const zipForm = document.getElementById("zip-form");
if (zipForm) {
  zipForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const zip = document.getElementById("zip").value.trim();
    const leadZip = document.querySelector("#lead-form input[name='zip']");
    if (leadZip && zip) leadZip.value = zip;
    document.querySelector("#contact").scrollIntoView({ behavior: "smooth" });
  });
}

// Lead form submission → Apps Script with validation + spam protection
async function postJSON(url, payload) {
  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (e) {
    console.error("POST failed:", e);
    return false;
  }
}

function showError(input, msg) {
  input.classList.add("error");
  let helper = input.nextElementSibling;
  if (!helper || !helper.classList || !helper.classList.contains("error-text")) {
    helper = document.createElement("div");
    helper.className = "error-text";
    input.parentNode.insertBefore(helper, input.nextSibling);
  }
  helper.textContent = msg;
}
function clearError(input) {
  input.classList.remove("error");
  const helper = input.nextElementSibling;
  if (helper && helper.classList.contains("error-text")) helper.remove();
}

const leadForm = document.getElementById("lead-form");
const leadMsg = document.getElementById("lead-msg");
if (leadForm) {
  leadForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    leadMsg.textContent = "";

    const data = new FormData(leadForm);
    const name = (data.get("name")||"").trim();
    const email = (data.get("email")||"").trim();
    const company = (data.get("company")||"").trim();
    const phone = (data.get("phone")||"").trim();
    const hp = (data.get("website")||"").trim(); // honeypot
    const dwellOK = (Date.now() - pageLoadTS) > 5000; // 5s min

    const nameEl = leadForm.querySelector("input[name='name']");
    const emailEl = leadForm.querySelector("input[name='email']");
    const companyEl = leadForm.querySelector("input[name='company']");
    const phoneEl = leadForm.querySelector("input[name='phone']");

    // Clear old errors
    [nameEl,emailEl,companyEl,phoneEl].forEach(clearError);

    // Validate
    let bad = false;
    if (!name) { showError(nameEl, "Please enter your full name."); bad = true; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) { showError(emailEl, "Enter a valid email address."); bad = true; }
    if (!company) { showError(companyEl, "Company is required."); bad = true; }
    const phoneRe = /^[0-9\-\+\(\)\s\.](7,)$/;
    if (!phoneRe.test(phone)) { showError(phoneEl, "Enter a valid phone number."); bad = true; }

    if (!dwellOK) { leadMsg.textContent = "Please take a few seconds to complete the form."; return; }
    if (hp) { leadMsg.textContent = "Submission blocked."; return; }

    if (bad) return;

    const services = ["fiber","dia","coax","pots","wifi","cell","security","sdwan"]
      .filter(k => data.get(k)==="on").map(s => s.toUpperCase()).join(", ");

    const payload = {
      type:"lead",
      name, email, company, phone,
      address:data.get("address")||"",
      city:data.get("city")||"",
      zip:data.get("zip")||"",
      services,
      message:data.get("message")||"",
      source:"sgi-futuristic-v4"
    };

    const ok = await postJSON(WEB_APP_URL, payload);
    leadMsg.textContent = ok
      ? `Submitted! We'll reach out from sales@sgitbs.com shortly.`
      : "Could not submit right now. Please try again.";
    if (ok) leadForm.reset();
  });
}
})();
