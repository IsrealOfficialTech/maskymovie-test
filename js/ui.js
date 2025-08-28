import { createClient } from "./api.js";

let tmdb = null;
const toastEl = document.getElementById("liveToast");
const toastBody = document.getElementById("toastBody");
const toast = toastEl ? new bootstrap.Toast(toastEl) : null;

export async function initClient(){
  if(!tmdb) tmdb = await createClient();
  return tmdb;
}

export function showToast(msg){
  if(!toast) return;
  toastBody.textContent = msg;
  toast.show();
}

export function status(message, type="success"){
  const bar = document.getElementById("statusBar");
  if(!bar) return;
  bar.classList.remove("d-none","alert-success","alert-danger","alert-warning","alert-info");
  bar.classList.add(`alert-${type}`);
  bar.textContent = message;
}

export function clearStatus(){
  const bar = document.getElementById("statusBar");
  if(bar) bar.classList.add("d-none");
}

export function renderGenres(genres, onClick){
  const host = document.getElementById("genrePills");
  host.innerHTML = "";
  const allBtn = document.createElement("button");
  allBtn.className = "btn btn-sm btn-outline-green";
  allBtn.textContent = "All";
  allBtn.dataset.genreId = "";
  allBtn.addEventListener("click", onClick);
  host.appendChild(allBtn);

  genres.forEach(g => {
    const b = document.createElement("button");
    b.className = "btn btn-sm btn-outline-green";
    b.textContent = g.name;
    b.dataset.genreId = g.id;
    b.addEventListener("click", onClick);
    host.appendChild(b);
  });
}

export function renderMovies({ results = [] }, genresById, onPlay){
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  if(results.length === 0){
    grid.innerHTML = `<div class="col-12"><div class="alert alert-warning mb-0">No movies found.</div></div>`;
    return;
  }

  results.forEach(m => {
    const col = document.createElement("div");
    col.className = "col-6 col-sm-4 col-md-3 col-lg-2";

    const gNames = (m.genre_ids || []).map(id => genresById[id]).filter(Boolean);
    const year = (m.release_date || "").slice(0,4);

    col.innerHTML = `
      <div class="card movie h-100">
        <img class="poster" src="${window.tmdbClient.imgUrl(m.poster_path) || "https://via.placeholder.com/500x750?text=No+Image"}" alt="${m.title}">
        <div class="p-2">
          <div class="d-flex align-items-center justify-content-between">
            <h3 class="h6 mb-1 text-truncate" title="${m.title}">${m.title}</h3>
            <span class="rate" title="Average vote">${(m.vote_average ?? 0).toFixed(1)}</span>
          </div>
          <div class="small text-muted">${year || "—"}</div>
          <div class="mt-2 d-flex flex-wrap gap-1">
            ${gNames.slice(0,3).map(n => `<span class="badge badge-genre">${n}</span>`).join("")}
          </div>
          <div class="mt-2 d-grid">
            <button class="btn btn-outline-green btn-sm play" data-id="${m.id}">Trailer & Providers</button>
          </div>
        </div>
      </div>
    `;

    grid.appendChild(col);
  });

  // wire play buttons
  grid.querySelectorAll(".play").forEach(btn=>{
    btn.addEventListener("click", () => onPlay(btn.dataset.id));
  });
}

export function renderPagination(page, totalPages, onGo){
  const host = document.getElementById("pagination");
  host.innerHTML = "";
  const makeBtn = (label, target, disabled=false) => {
    const b = document.createElement("button");
    b.className = "btn btn-outline-green";
    b.textContent = label;
    if(disabled){ b.disabled = true; }
    b.addEventListener("click", ()=> onGo(target));
    return b;
  };
  host.append(
    makeBtn("« First", 1, page<=1),
    makeBtn("‹ Prev", Math.max(1, page-1), page<=1),
    makeBtn(`Page ${page} / ${Math.min(totalPages, 500)}`, page, true),
    makeBtn("Next ›", Math.min(totalPages, page+1), page>=totalPages),
    makeBtn("Last »", Math.min(totalPages, 500), page>=totalPages)
  );
}

// expose client for ui helpers
window.tmdbClient = {
  imgUrl: (path, size) => path ? `https://image.tmdb.org/t/p/${size||"w500"}${path}` : null
};