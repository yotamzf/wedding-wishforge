// ====== CONFIG ======
const API_BASE = "https://yotamzf.app.n8n.cloud/webhook-test" // change me
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
const again = document.getElementById("again");

// count chars
wishText.addEventListener("input", () => {
  count.textContent = String(wishText.value.length);
});

// reset
again.addEventListener("click", () => {
  result.classList.add("hidden");
  imgOut.style.display = "none";
  caption.textContent = "קיבלנו! רגע… מכינים לכם תמונה 🙂";
  thanks.textContent = "";
  form.reset();
  count.textContent = "0";
  window.scrollTo({top:0, behavior:"smooth"});
});

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

  // show result
  result.classList.remove("hidden");
  caption.textContent = "קיבלנו! רגע… מכינים לכם תמונה 🙂";
  thanks.textContent = "תודה! זה נכנס למצגת ולספר שלנו 🤍";
  imgOut.style.display = "none";
  window.scrollTo({top: document.body.scrollHeight, behavior:"smooth"});

  try{
    const res = await fetch(SUBMIT_URL, {
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(data)
    });

    let payloadText = await res.text(); // לא json בינתיים
    caption.textContent = "נשלח בהצלחה ✅";
    thanks.textContent = "התקבל ב־n8n. תודה! 🤍";
    console.log("Response:", res.status, payloadText);
    return;


    } catch (err) {
    alert("ERROR: " + (err?.message || err)); // <-- הוסף
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
      thanks.textContent = "הברכה נשמרה. תודה ענקית! 🤍";
      return;
    }

    const res = await fetch(STATUS_URL(jobId), { cache:"no-store" });
    const s = await res.json();

    if(s.status === "done" && s.imageUrl){
      imgOut.src = s.imageUrl;
      imgOut.onload = () => {
        imgOut.style.display = "block";
        caption.textContent = s.caption || "איזה כיף! תודה 🤍";
        thanks.textContent = "הברכה נשמרה אצלנו — אתם אלופים 🙂";
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
