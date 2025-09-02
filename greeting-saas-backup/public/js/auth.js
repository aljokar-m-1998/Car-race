const API = {
  token: localStorage.getItem('token') || '',
  setToken(t) { this.token = t; localStorage.setItem('token', t); },
  headers() { return this.token ? { 'Content-Type':'application/json', 'Authorization':'Bearer '+this.token } : { 'Content-Type':'application/json' }; }
};

async function register(email, password) {
  const r = await fetch('/api/auth/register', { method:'POST', headers: API.headers(), body: JSON.stringify({ email, password })});
  const j = await r.json();
  if (j.token) API.setToken(j.token);
  return j;
}
async function login(email, password) {
  const r = await fetch('/api/auth/login', { method:'POST', headers: API.headers(), body: JSON.stringify({ email, password })});
  const j = await r.json();
  if (j.token) API.setToken(j.token);
  return j;
}
function logout(){ API.setToken(''); }
