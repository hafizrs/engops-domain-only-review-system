export type AuthUser = { id:string; email:string; name:string; role:'admin'|'manager' };
export function setSession(data:{accessToken:string;user:AuthUser}){ localStorage.setItem('token',data.accessToken); localStorage.setItem('user',JSON.stringify(data.user)); }
export function getUser():AuthUser|null{ const raw=localStorage.getItem('user'); return raw?JSON.parse(raw):null; }
export function logout(){ localStorage.clear(); location.href='/login'; }
