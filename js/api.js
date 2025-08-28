// Simple TMDB client
class TMDB {
  constructor(apiKey){
    this.apiKey = apiKey;
    this.base = "https://api.themoviedb.org/3";
    this.img = "https://image.tmdb.org/t/p";
  }

  async _get(path, params = {}){
    const url = new URL(`${this.base}${path}`);
    url.searchParams.set("api_key", this.apiKey);
    url.searchParams.set("language", "en-US");
    Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    if(!res.ok) throw new Error(`TMDB error: ${res.status}`);
    return res.json();
  }

  imgUrl(path, size = "w500"){
    if(!path) return null;
    return `${this.img}/${size}${path}`;
  }

  // Endpoints
  genres(){ return this._get("/genre/movie/list"); }
  popular(page=1){ return this._get("/movie/popular", { page }); }
  topRated(page=1){ return this._get("/movie/top_rated", { page }); }
  upcoming(page=1){ return this._get("/movie/upcoming", { page }); }
  search(query, page=1){ return this._get("/search/movie", { query, page, include_adult: "false" }); }
  details(id){ return this._get(`/movie/${id}`); }
  videos(id){ return this._get(`/movie/${id}/videos`); }
  providers(id){ return this._get(`/movie/${id}/watch/providers`); }
}

export async function loadConfig(){
  const res = await fetch("assets/config.json");
  if(!res.ok) throw new Error("Missing assets/config.json. Copy config.sample.json and add your TMDB key.");
  return res.json();
}

export async function createClient(){
  const { tmdbApiKey } = await loadConfig();
  if(!tmdbApiKey || tmdbApiKey === "YOUR_TMDB_API_KEY_HERE"){
    throw new Error("Please put your real TMDB key in assets/config.json");
  }
  return new TMDB(tmdbApiKey);
}