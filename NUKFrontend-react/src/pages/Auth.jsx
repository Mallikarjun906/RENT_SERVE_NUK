import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, saveSession } from '../services/api';
export function Login(){
 const [form,setForm]=useState({identifier:'',password:''});const [error,setError]=useState('');const [busy,setBusy]=useState(false);const nav=useNavigate();const loc=useLocation();
 const finish=useCallback(async(data)=>{const user=saveSession(data);const home={admin:'/admin',provider:'/provider/dashboard',owner:'/owner/dashboard',customer:'/dashboard',driver:'/dashboard'};nav(user.role === 'provider' ? '/provider/dashboard' : user.role === 'admin' ? '/admin' : user.role === 'owner' ? '/owner/dashboard' : (loc.state?.from || home[user.role] || '/dashboard'),{replace:true});},[nav,loc.state]);
 const showError=useCallback((message)=>setError(message),[]);
 async function submit(e){e.preventDefault();setBusy(true);setError('');try{const data=await api('auth/login',{method:'POST',body:{email:form.identifier.trim(),password:form.password}});await finish(data);}catch(err){setError(err.message);}finally{setBusy(false);}}
 return <AuthShell title="Welcome back" subtitle="Sign in to continue to NUK RentServe."><form onSubmit={submit} className="form-stack"><label>Email or phone<input autoComplete="username" required value={form.identifier} onChange={e=>setForm({...form,identifier:e.target.value})}/></label><label>Password<input type="password" autoComplete="current-password" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><div className="form-row"><Link to="/forgot-password">Forgot password?</Link></div>{error&&<div className="notice error" role="alert">{error}</div>}<button className="btn btn-full" disabled={busy}>{busy?'Signing in…':'Log in'}</button><p className="form-note">New to NUK RentServe? <Link to="/register">Create an account</Link></p></form><div className="auth-divider"><span>OR CONTINUE WITH</span></div><GoogleSignIn onSuccess={finish} onError={showError} busy={busy}/></AuthShell>
}
function GoogleSignIn({onSuccess,onError,busy}){
 const host=useRef(null);const [status,setStatus]=useState('');const [configured,setConfigured]=useState(false);
 const clientId=import.meta.env.VITE_GOOGLE_CLIENT_ID;
 useEffect(()=>{
  if(!clientId){setConfigured(false);setStatus('Google sign-in needs your Google Web Client ID configured in the frontend deployment and the matching GOOGLE_CLIENT_ID on the backend.');return;}
  let cancelled=false;let attempts=0;let timer;
  const init=()=>{
   if(cancelled)return;
   if(window.google?.accounts?.id&&host.current){
    try {
     window.google.accounts.id.initialize({client_id:clientId,callback:async response=>{try{onError('');const data=await api('auth/google',{method:'POST',body:{credential:response.credential}});await onSuccess(data);}catch(err){onError(err.message);}},auto_select:false});
     host.current.innerHTML='';window.google.accounts.id.renderButton(host.current,{type:'standard',theme:'outline',size:'large',shape:'rectangular',text:'continue_with',width:Math.min(380,host.current.clientWidth||340),logo_alignment:'left'});setConfigured(true);setStatus('');
    } catch { setConfigured(false);setStatus('Google Sign-In could not initialize. Verify the Web Client ID and authorized frontend origin.'); }
    return;
   }
   attempts++;if(attempts<30)timer=setTimeout(init,200);else {setConfigured(false);setStatus('Google sign-in could not load. Check the network and Google OAuth configuration.');}
  };
  if(!document.querySelector('script[data-google-identity]')){const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.defer=true;script.dataset.googleIdentity='true';script.onload=init;script.onerror=()=>{setConfigured(false);setStatus('Unable to load Google Sign-In. Check your network or content blocker.');};document.head.appendChild(script);}else init();
  return()=>{cancelled=true;if(timer)clearTimeout(timer);};
 },[clientId,onSuccess,onError]);
 return <div className="google-signin-wrap">
   {!configured&&<button type="button" className="google-fallback-btn" disabled={busy} onClick={()=>setStatus(clientId?'Google is still loading. Please wait a moment and try again.':'Google Sign-In is visible, but it cannot authenticate until VITE_GOOGLE_CLIENT_ID is configured in your frontend host and matches GOOGLE_CLIENT_ID on the backend.')}><span className="google-g-mark" aria-hidden="true">G</span><span>Continue with Google</span></button>}
   <div ref={host} className="google-signin-host" aria-label="Continue with Google"/>
   {status&&<p className="google-setup-note" role="status">{status}</p>}{busy&&<p className="muted tiny">Signing in…</p>}
  </div>;
}
export function Register(){
 const [form,setForm]=useState({name:'',email:'',phone:'',password:'',location:'Mysuru',role:'customer'});
 const [error,setError]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const nav=useNavigate();
 function update(key,value){setForm(old=>({...old,[key]:value}));}
 async function submit(e){e.preventDefault();setError('');setMessage('');setBusy(true);try{const data=await api('auth/register',{method:'POST',body:form});saveSession(data);setMessage('Account created successfully. Redirecting to your dashboard…');setTimeout(()=>nav('/dashboard',{replace:true}),500);}catch(err){setError(err.message);}finally{setBusy(false);}}
 return <AuthShell title="Create your account" subtitle="Join the NUK RentServe community.">
  <form onSubmit={submit} className="form-stack">
   <label>Full name<input autoComplete="name" required minLength="2" value={form.name} onChange={e=>update('name',e.target.value)}/></label>
   <div className="form-two"><label>Email<input type="email" autoComplete="email" required value={form.email} onChange={e=>update('email',e.target.value)}/></label><label>Phone<input required inputMode="tel" autoComplete="tel" pattern="[6-9][0-9]{9}" title="Enter a valid 10-digit Indian mobile number" value={form.phone} onChange={e=>update('phone',e.target.value)}/></label></div>
   <label>City or locality<input required value={form.location} onChange={e=>update('location',e.target.value)}/></label>
   <label>Account type<select value={form.role} onChange={e=>update('role',e.target.value)}><option value="customer">Customer</option><option value="owner">Property owner</option></select><small>Service providers must use the separate provider application form.</small></label>
   <label>Password<input type="password" required minLength="8" maxLength="72" autoComplete="new-password" value={form.password} onChange={e=>update('password',e.target.value)}/><small>Use at least 8 characters.</small></label>
   <p className="muted tiny">Create your account without email verification. Provider applications follow the separate provider registration and approval process.</p>
   {error&&<div className="notice error" role="alert">{error}</div>}{message&&<div className="notice success" role="status">{message}</div>}
   <button className="btn btn-full" disabled={busy}>{busy?'Creating account…':'Create account'}</button>
   <p className="form-note">Already registered? <Link to="/login">Log in</Link></p>
  </form>
 </AuthShell>;
}
function AuthShell({title,subtitle,children}){return <section className="auth-wrap"><div className="auth-aside"><div className="auth-aside-inner"><span className="pill">NUK RENTSERVE</span><h2>Find what you need.<br/><em>Connect locally.</em></h2><p>Properties, services and transport — designed around communities across Karnataka.</p></div></div><div className="auth-panel"><span className="eyebrow">YOUR ACCOUNT</span><h1>{title}</h1><p className="muted">{subtitle}</p>{children}</div></section>}
export function ForgotPassword(){const [email,setEmail]=useState('');const [message,setMessage]=useState('');const [error,setError]=useState('');async function submit(e){e.preventDefault();setError('');try{const d=await api('auth/forgot-password',{method:'POST',body:{email}});setMessage(d?.message || 'If an account exists, password reset instructions will be sent.');}catch(err){setError(err.message);}}return <section className="auth-simple"><div className="auth-panel"><h1>Reset your password</h1><p className="muted">Enter your account email to request a reset.</p><form className="form-stack" onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>{error&&<div className="notice error">{error}</div>}{message&&<div className="notice success">{message}</div>}<button className="btn btn-full">Request reset</button><Link to="/login">Back to login</Link></form></div></section>}
