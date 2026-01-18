// ====== CONFIG ======
// Change this to your n8n base webhook URL.
// Example: "https://n8n.yourdomain.com/webhook"
const API_BASE = "https://YOUR_N8N_DOMAIN/webhook";

const SUBMIT_URL = `${API_BASE}/wishforge/submit`;
const STATUS_URL = (id) => `${API_BASE}/wishforge/status/${encodeURIComponent(id)}`;

// ====== Elements ======
const form = document.getElementById("wishForm");
const wishText = document.getElementById("wishText");
const count = document.getElementById("count");
const result = document.getElementById("result");
const imgOut = document.getElementById("imgOut");
const caption = document.getElementById("caption");
const thanks = document.getElementById("thanks");
const developing = document.getElementById("developing");
const download = document.getElementById("download");
const again = document.getElementById("again");
const quietToggle = document.getElementById("quietToggle");

// ====== UX: count chars ======
wishText.addEventListener("input", () => {
  count.textContent = String(wishText.value.length);
});

// ====== Quiet mode ======
let quietOn = false;

function setQuiet(on){
  quietOn = on;
  document.body.classList.toggle("writing", on);
  quietToggle.setAttribute("aria-pressed", on ? "true" : "false");
  quietToggle.textContent = on ? "מצב כתיבה שקט ✓" : "מצב כתיבה שקט";
}

quietToggle.addEventListener("click", () => setQuiet(!quietOn));
wishText.addEventListener("focus", () => setQuiet(true));
wishText.addEventListener("blur", () => { /* keep if user toggled manually */ });

// ====== Again ======
again.addEventListener("click", () => {
  result.classList.add("hidden");
  imgOut.style.display = "none";
  developing.style.display = "block";
  caption.textContent = "קיבלנו! רגע… מכינים לכם תמונה 🙂";
  thanks.textContent = "";
  form.reset();
  count.textContent = "0";
  window.scrollTo({top:0, behavior:"smooth"});
});

// ====== Submit ======
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(form).entries());
  data.text = (data.text || "").trim();
  data.fromName = (data.fromName || "").trim();

  if(!data.fromName){
    alert("רק שם קצר כדי שנדע ממי זה 🙂");
    return;
  }
  if(data.text.length < 3){
    alert("תוסיפו עוד מילה-שתיים 🙂");
    return;
  }

  // Show result area immediately (fast feedback)
  result.classList.remove("hidden");
  caption.textContent = "קיבלנו! רגע… מכינים לכם תמונה 🙂";
  thanks.textContent = "תודה! אנחנו ממש מתרגשים לקרוא את זה 🤍";
  imgOut.style.display = "none";
  developing.style.display = "block";
  download.removeAttribute("href");
  window.scrollTo({top: document.body.scrollHeight, behavior:"smooth"});

  try{
    const res = await fetch(SUBMIT_URL, {
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(data)
    });

    const payload = await res.json();
    if(!res.ok) throw new Error(payload?.error || "Submit failed");

    const jobId = payload.jobId;
    caption.textContent = "מפתחים תמונה… (עוד רגע)";
    thanks.textContent = "זה נכנס למצגת ולספר שלנו. תודה ענקית!";

    await poll(jobId);

  }catch(err){
    caption.textContent = "אופס… משהו השתבש 😅";
    thanks.textContent = "נסו שוב בעוד רגע. ואם זה חוזר — תגידו לזוג.";
    console.error(err);
  }
});

async function poll(jobId){
  const start = Date.now();
  const timeoutMs = 150000; // 2.5 minutes

  while(true){
    if(Date.now() - start > timeoutMs){
      caption.textContent = "זה לוקח קצת יותר מהרגיל…";
      thanks.textContent = "התמונה תופיע במצגת גם אם המסך לא הספיק להציג. תודה!";
      return;
    }

    const res = await fetch(STATUS_URL(jobId), { cache:"no-store" });
    const s = await res.json();

    if(s.status === "done" && s.imageUrl){
      developing.style.display = "none";
      imgOut.src = s.imageUrl;
      imgOut.onload = () => {
        imgOut.style.display = "block";
        caption.textContent = s.caption || "איזה כיף. תודה! 🤍";
        thanks.textContent = "הברכה נשמרה אצלנו — אתם אלופים 🙂";
        download.href = s.imageUrl;
      };
      return;
    }

    if(s.status === "error"){
      caption.textContent = "התמונה לא נוצרה הפעם 😅";
      thanks.textContent = "אבל הברכה נשמרה, וזה הכי חשוב. תודה ענקית!";
      return;
    }

    await sleep(1500);
  }
}

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

// ====== Lightweight particles ======
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
let W,H,stars=[];

function resize(){
  const dpr = Math.min(devicePixelRatio || 1, 2);
  W = canvas.width = Math.floor(window.innerWidth * dpr);
  H = canvas.height = Math.floor(window.innerHeight * dpr);

  const n = Math.floor((window.innerWidth * window.innerHeight) / 18000); // adaptive
  stars = Array.from({length: Math.max(40, Math.min(120, n))}, () => ({
    x: Math.random()*W,
    y: Math.random()*H,
    r: (Math.random()*1.5 + 0.4),
    v: (Math.random()*0.25 + 0.08),
    a: (Math.random()*0.35 + 0.12)
  }));
  ctx.fillStyle = "#ffffff";
}
window.addEventListener("resize", resize);
resize();

function tick(){
  ctx.clearRect(0,0,W,H);
  for(const s of stars){
    s.y += s.v;
    if(s.y > H){ s.y = 0; s.x = Math.random()*W; }
    ctx.globalAlpha = s.a;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    ctx.fill();
  }
  requestAnimationFrame(tick);
}
tick();
