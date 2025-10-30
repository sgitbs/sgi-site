
(function(){"use strict";
const WEB_APP_URL = window.SGI_WEB_APP_URL || "https://script.google.com/macros/s/AKfycbyauvvLHcFRRtGz1O9d-I4HkNjheiAEv5mryEy5HCIslN1HzX4RMe48fnGFXuqOfxvG/exec";

async function postJSON(url, payload) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return true;
  } catch (e) {
    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      return true;
    } catch (e2) {
      console.error("POST failed:", e2);
      return false;
    }
  }
}

function byId(id){ return document.getElementById(id); }

// ZIP form
const zipInput = byId("zip");
const zipMsg = byId("zip-msg");
const zipFormEl = document.querySelector("#availability form") || document.getElementById("zip-form");
if (zipFormEl) {
  zipFormEl.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const zip = (zipInput.value||"").trim(); if(!zip) return;
    const ok = await postJSON(WEB_APP_URL, { type:"zip_check", zip, source:"sgi-futuristic" });
    zipMsg.textContent = ok ? "Thanks! We'll check providers for " + zip + " and email you from sales@sgitbs.com." : "Could not submit right now. Please try again.";
    if (ok) zipInput.value = "";
  });
}

// Lead form
const leadForm = document.getElementById("lead-form");
const leadMsg = document.getElementById("lead-msg");
if (leadForm) {
  leadForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const data = new FormData(leadForm);
    const services = ["fiber","dia","coax","pots","wifi","cell","security","sdwan"]
      .filter(k => data.get(k)==="on").map(s => s.toUpperCase()).join(", ");
    const payload = {
      type:"lead",
      name:data.get("name")||"",
      email:data.get("email")||"",
      company:data.get("company")||"",
      address:data.get("address")||"",
      city:data.get("city")||"",
      zip:data.get("zip")||"",
      services,
      message:data.get("message")||"",
      source:"sgi-futuristic"
    };
    const ok = await postJSON(WEB_APP_URL, payload);
    leadMsg.textContent = ok ? "Submitted! We'll reach out from sales@sgitbs.com shortly." : "Could not submit right now. Please try again.";
    if (ok) leadForm.reset();
  });
}
})();
