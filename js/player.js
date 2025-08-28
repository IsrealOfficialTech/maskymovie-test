import { initClient, showToast } from "./ui.js";

const modalEl = document.getElementById("trailerModal");
const titleEl = document.getElementById("trailerTitle");
const frameEl = document.getElementById("trailerFrame");
const providersEl = document.getElementById("providers");
const modal = modalEl ? new bootstrap.Modal(modalEl) : null;

function setTrailer(src){
  frameEl.setAttribute("src", src || "");
}
function clearTrailer(){
  setTrailer("");
  providersEl.innerHTML = "";
}

export async function openTrailer(movieId){
  try{
    const tmdb = await initClient();
    clearTrailer();

    const [details, vids, prov] = await Promise.all([
      tmdb.details(movieId),
      tmdb.videos(movieId),
      tmdb.providers(movieId)
    ]);

    titleEl.textContent = details.title || "Trailer";

    // Pick best trailer (YouTube preferred)
    const candidates = (vids.results || []).filter(v => v.type === "Trailer");
    const yt = candidates.find(v => v.site === "YouTube") || (vids.results || [])[0];
    if(yt && yt.site === "YouTube"){
      setTrailer(`https://www.youtube.com/embed/${yt.key}?rel=0&modestbranding=1&autoplay=1`);
    }else if(yt && yt.site && yt.key){
      // fallback for non-YouTube
      setTrailer(`https://www.youtube.com/embed/${yt.key}`);
    }else{
      setTrailer("");
      showToast("No official trailer available.");
    }

    // Providers (country fallback: NG → US → any)
    const data = prov.results || {};
    const country = data.NG || data.US || Object.values(data)[0];
    if(country && country.link){
      const link = document.createElement("a");
      link.href = country.link;
      link.target = "_blank";
      link.rel = "noopener";
      link.className = "btn btn-success btn-sm";
      link.textContent = "Watch Providers";
      providersEl.appendChild(link);
    }
    (country?.flatrate || country?.rent || country?.buy || []).slice(0,6).forEach(p=>{
      const b = document.createElement("span");
      b.className = "badge text-bg-light";
      b.textContent = p.provider_name;
      providersEl.appendChild(b);
    });

    modal?.show();
  }catch(err){
    console.error(err);
    showToast("Unable to load trailer/providers.");
  }
}

// stop video when modal closes
modalEl?.addEventListener("hidden.bs.modal", () => clearTrailer());