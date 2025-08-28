import { initClient, renderGenres, renderMovies, renderPagination, status, clearStatus, showToast } from "./ui.js";
import { openTrailer } from "./player.js";

let state = {
  page: 1,
  mode: "popular", // popular | top_rated | upcoming | search | genre
  query: "",
  genreId: null,
  genres: [],
  genresById: {}
};

function mapGenres(genres){
  const map = {};
  genres.forEach(g => map[g.id] = g.name);
  return map;
}

async function loadGenres(){
  const tmdb = await initClient();
  try{
    const { genres } = await tmdb.genres();
    state.genres = genres;
    state.genresById = mapGenres(genres);
    renderGenres(genres, (e)=>{
      const id = e.currentTarget.dataset.genreId || null;
      state.mode = id ? "genre" : "popular";
      state.genreId = id ? Number(id) : null;
      state.page = 1;
      hydrate();
    });
  }catch{
    // fallback to static file if API fails
    try{
      const res = await fetch("assets/genres.json");
      const data = await res.json();
      state.genres = data.genres || [];
      state.genresById = mapGenres(state.genres);
      renderGenres(state.genres, (e)=>{
        const id = e.currentTarget.dataset.genreId || null;
        state.mode = id ? "genre" : "popular";
        state.genreId = id ? Number(id) : null;
        state.page = 1;
        hydrate();
      });
    }catch(err){
      console.error(err);
      showToast("Could not load genres.");
    }
  }
}

async function fetchPage(){
  const tmdb = await initClient();
  const { page } = state;
  status("Loading…", "info");
  try{
    let data;
    if(state.mode === "popular") data = await tmdb.popular(page);
    else if(state.mode === "top_rated") data = await tmdb.topRated(page);
    else if(state.mode === "upcoming") data = await tmdb.upcoming(page);
    else if(state.mode === "search") data = await tmdb.search(state.query, page);
    else if(state.mode === "genre") data = await tmdb._get("/discover/movie", { with_genres: state.genreId, page });
    else data = await tmdb.popular(page);

    renderMovies(data, state.genresById, (id)=> openTrailer(id));
    renderPagination(data.page, Math.min(500, data.total_pages || 1), (target)=>{
      state.page = target;
      fetchPage();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }catch(err){
    console.error(err);
    showToast("Failed to load movies.");
  }finally{
    clearStatus();
  }
}

function wireTopBar(){
  document.getElementById("year")?.textContent = new Date().getFullYear();
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");

  searchForm?.addEventListener("submit", (e)=>{
    e.preventDefault();
    const q = (searchInput.value || "").trim();
    if(!q) return;
    state.mode = "search";
    state.query = q;
    state.page = 1;
    fetchPage();
  });

  document.getElementById("sortPopular")?.addEventListener("click", ()=>{
    state.mode = "popular"; state.page = 1; fetchPage();
  });
  document.getElementById("sortTopRated")?.addEventListener("click", ()=>{
    state.mode = "top_rated"; state.page = 1; fetchPage();
  });
  document.getElementById("sortUpcoming")?.addEventListener("click", ()=>{
    state.mode = "upcoming"; state.page = 1; fetchPage();
  });
}

async function hydrate(){
  await fetchPage();
}

(async function main(){
  try{
    await loadGenres();
    wireTopBar