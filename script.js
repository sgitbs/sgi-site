
(function(){
  "use strict";
  const WEB_APP_URL = (window.SGI_WEB_APP_URL || "").trim();
  const EMAIL = "sales@sgitbs.com";
  let pageLoadTS = Date.now();

  // Helpers
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

  function runSubmitFlow() {
    const data = new FormData(leadForm);
    const name = (data.get("name")||"").trim();
    const email = (data.get("email")||"").trim();
    const company = (data.get("company")||"").trim();
    const phone = (data.get("phone")||"").trim();
    const hp = (data.get("website")||"").trim();
    const dwellOK = (Date.now() - pageLoadTS) > 4000;

    const nameEl = leadForm.querySelector("input[name='name']");
    const emailEl = leadForm.querySelector("input[name='email']");
    const companyEl = leadForm.querySelector("input[name='company']");
    const phoneEl = leadForm.querySelector("input[name='phone']");
    [nameEl,emailEl,companyEl,phoneEl].forEach(clearError);

    let bad = false;
    if (!name) { showError(nameEl,"Enter your full name."); bad = true; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) { showError(emailEl,"Enter a valid email."); bad = true; }
    if (!company) { showError(companyEl,"Company is required."); bad = true; }
    const phoneRe = /^[0-9\-\+\(\)\s\.]{7,}$/;
    if (!phoneRe.test(phone)) { showError(phoneEl,"Enter a valid phone."); bad = true; }

    if (!dwellOK){ leadMsg.textContent = "One moment…"; return; }
    if (hp){ leadMsg.textContent = "Submission blocked."; return; }
    if (bad) return;

    // Get Turnstile token (visible)
    let token = "";
    try {
      token = (window.turnstile && typeof window.turnstile.getResponse === "function")
        ? window.turnstile.getResponse()
        : "";
    } catch(_) {}
    if (!token) { leadMsg.textContent = "Please complete the CAPTCHA and try again."; return; }

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
      turnstile_token: token,
      source:"sgi-site-v9"
    };

    postJSON(WEB_APP_URL, payload).then(ok=>{
      leadMsg.textContent = ok
        ? `Submitted! We'll reach out from ${EMAIL} shortly.`
        : "Could not submit right now. Please try again.";
      if (ok && window.turnstile && typeof window.turnstile.reset === "function") {
        window.turnstile.reset();
        leadForm.reset();
      }
    });
  }

  if (leadForm) {
    leadForm.addEventListener("submit", (e)=>{
      e.preventDefault();
      leadMsg.textContent = "";
      runSubmitFlow();
    });
  }
})();