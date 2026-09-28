'use client';
import { useState } from 'react';
import { browserClient } from '../../lib/browser';
export default function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(mode) {
    setBusy(true); setMessage('');
    try {
      const sb = browserClient();
      if (mode === 'register') {
        const { data, error } = await sb.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        setMessage(data.session ? 'Conta criada e conectada.' : 'Conta criada. Confirme seu e-mail antes de entrar.');
      } else {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        window.location.assign('/admin');
      }
    } catch (e) { setMessage(e.message); } finally { setBusy(false); }
  }
  return <div className="panel"><h1>Minha conta</h1><label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} /></label><label>Senha<input type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} /></label><p><button disabled={busy || !email || !password} onClick={()=>submit('login')}>Entrar</button> <button disabled={busy || !email || !password} onClick={()=>submit('register')}>Criar conta</button></p><p role="status">{message}</p></div>;
}
