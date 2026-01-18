// ====== CONFIG ======
const API_BASE = "https://YOUR_N8N_DOMAIN/webhook"; // שנה לכתובת שלך
const SUBMIT_URL = `${API_BASE}/wishforge/submit`;
const STATUS_URL = (id) => `${API_BASE}/wishforge/status/${encodeURIComponent(id)}`;

// ====== UI ======
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

wishText.addEventListener("input", () => count.textContent = wishText.value.length);

again.addEventListener("click", () => {
  result.classList.add("hidden");
  imgOut.style.display = "none";
  developing.style.display = "block";
  form.reset();
  count.textContent = "0";
  window.scrollTo({top:0, behavior:"smooth"});
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(form).entries());
  data.text = (data.text || "").trim();
  data.fromName = (data.fromName || "").trim();

  // UX: show result block immediately
  result.classList.remove("hidden");
  caption.textContent = "מכינים קסם…";
  thanks.textContent = "";
  imgOut.style.display = "none";
  developing.style.display = "block";
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
    await poll(jobId);

  }catch(err){
    caption.textContent = "אופס… משהו השתבש 😅";
    thanks.textContent = "נסו שוב בעוד רגע. אם זה חוזר — תגידו לזוג.";
    console.error(err);
  }
});

async function poll(jobId){
  const start = Date.now();
  const timeoutMs = 150000; // 2.5 דקות

  while(true){
    if(Date.now() - start > timeoutMs){
      caption.textContent = "זה לוקח קצת יותר מהרגיל…";
      thanks.textContent = "התמונה תופיע במצגת גם אם המסך לא הספיק להציג. תודה!";
      return;
    }

    const res = await fetch(STATUS_URL(jobId));
    const s = await res.json();

    if(s.status === "done" && s.imageUrl){
      developing.style.display = "none";
      imgOut.src = s.imageUrl;
      imgOut.onload = () => {
        imgOut.style.display = "block";
        caption.textContent = s.caption || "תודה! הברכה נכנסה לספר 💛";
        thanks.textContent = "איזה כיף. זכיתם בדף בספר שלנו 🙂";
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

// ====== Particles (simple) ======
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
let W,H,stars=[];
function resize(){
  W=canvas.width=window.innerWidth*devicePixelRatio;
  H=canvas.height=window.innerHeight*devicePixelRatio;
  stars = Array.from({length:120}, ()=>({
    x:Math.random()*W, y:Math.random()*H,
    r:(Math.random()*1.8+0.4)*devicePixelRatio,
    v:(Math.random()*0.4+0.15)*devicePixelRatio,
    a:Math.random()*0.6+0.2
  }));
}
window.addEventListener("resize", resize); resize();

function tick(){
  ctx.clearRect(0,0,W,H);
  for(const s of stars){
    s.y += s.v;
    if(s.y>H){ s.y=0; s.x=Math.random()*W; }
    ctx.globalAlpha = s.a;
    ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
  }
  requestAnimationFrame(tick);
}
ctx.fillStyle="#fff"; tick();
