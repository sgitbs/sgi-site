
(function(){
  "use strict";
  const WEB_APP_URL = (window.SGI_WEB_APP_URL || "").trim();
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

  // ZIP field feeds lead form and scrolls
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

  // Lead form
  const leadForm = document.getElementById("lead-form");
  const leadMsg = document.getElementById("lead-msg");

  function runSubmitFlow() {
    const data = new FormData(leadForm);
    const name = (data.get("name")||"").trim();
    const email = (data.get("email")||"").trim();
    const company = (data.get("company")||"").trim();
    const phone = (data.get("phone")||"").trim();
    const hp = (data.get("website")||"").trim(); // honeypot
    const dwellOK = (Date.now() - pageLoadTS) > 5000; // >=5s

    const nameEl = leadForm.querySelector("input[name='name']");
    const emailEl = leadForm.querySelector("input[name='email']");
    const companyEl = leadForm.querySelector("input[name='company']");
    const phoneEl = leadForm.querySelector("input[name='phone']");

    [nameEl,emailEl,companyEl,phoneEl].forEach(clearError);

    let bad = false;
    if (!name) { showError(nameEl,"Please enter your full name."); bad = true; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) { showError(emailEl,"Enter a valid email address."); bad = true; }
    if (!company) { showError(companyEl,"Company is required."); bad = true; }
    const phoneRe = /^[0-9\-\+\(\)\s\.]{7,}$/;
    if (!phoneRe.test(phone)) { showError(phoneEl,"Enter a valid phone number."); bad = true; }

    if (!dwellOK){ leadMsg.textContent = "Please take a few seconds to complete the form."; return; }
    if (hp){ leadMsg.textContent = "Submission blocked."; return; }
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
      // Turnstile adds a token to the page; use getResponse if present
      turnstile_token: (window.turnstile ? (window.turnstile.getResponse && window.turnstile.getResponse()) : "") || "",
      source:"sgi-futuristic-v7"
    };

    postJSON(WEB_APP_URL, payload).then(ok=>{
      leadMsg.textContent = ok
        ? `Submitted! We'll reach out from ${EMAIL} shortly.`
        : "Could not submit right now. Please try again.";
      if (ok) {
        leadForm.reset();
        if (window.turnstile && typeof window.turnstile.reset === "function") {
          window.turnstile.reset();
        }
      }
    });
  }

  if (leadForm) {
    leadForm.addEventListener("submit", (e)=>{
      e.preventDefault();
      leadMsg.textContent = "";
      const widget = document.querySelector(".cf-turnstile");
      if (widget && window.turnstile && typeof window.turnstile.execute === "function") {
        window.turnstile.execute(widget);
        setTimeout(runSubmitFlow, 250);
      } else {
        runSubmitFlow();
      }
    });
  }
})();