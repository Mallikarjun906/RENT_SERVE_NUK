import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, clearSession, readUser, unwrapItems } from '../services/api';

export function Dashboard() {
  const currentUser = readUser();
  const [user, setUser] = useState(currentUser || {});
  const [data, setData] = useState([]);
  const [propertyBookings, setPropertyBookings] = useState([]);
  const [transportBookings, setTransportBookings] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    let active = true;
    Promise.allSettled([api('users/me'), api('enquiries/my'), api('bookings/mine'), api('transport-bookings/mine')])
      .then((results) => {
        if (results[0].status === 'fulfilled' && active) {
          const nextUser = { ...(currentUser || {}), ...results[0].value };
          sessionStorage.setItem('nuk_user', JSON.stringify(nextUser));
          setUser(nextUser);
        }
        if (results[1].status === 'fulfilled' && active) setData(unwrapItems(results[1].value));
        if (results[2].status === 'fulfilled' && active) setPropertyBookings(unwrapItems(results[2].value));
        if (results[3].status === 'fulfilled' && active) setTransportBookings(unwrapItems(results[3].value));
        const fail = results.find((result) => result.status === 'rejected');
        if (fail && active) setError(fail.reason?.message || 'Some account data could not be loaded.');
      })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [currentUser]);

  const handleInput = (event) => {
    const { name, value } = event.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNotice('Please choose an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setNotice('Please choose an image smaller than 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setUser((prev) => ({ ...prev, photoUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true); setNotice('');
    try {
      const payload = {
        name: String(user.name || '').trim(),
        phone: String(user.phone || '').trim(),
        location: String(user.location || '').trim(),
        photoUrl: String(user.photoUrl || '').trim()
      };
      if (!payload.name || payload.name.length < 2) throw new Error('Full name is required.');
      if (!payload.location || payload.location.length < 2) throw new Error('Location is required.');
      const updated = await api('users/me', { method: 'PATCH', body: payload });
      const nextUser = { ...(currentUser || {}), ...updated, photoUrl: updated.photoUrl || payload.photoUrl || currentUser?.photoUrl || '' };
      sessionStorage.setItem('nuk_user', JSON.stringify(nextUser));
      setUser(nextUser);
      setNotice('Profile updated successfully.');
    } catch (err) {
      setNotice(err.message || 'Unable to save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const avatar = user?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=B91C2C&color=fff`;
  const totalBookings = propertyBookings.length + transportBookings.length;
  const closedEnquiries = data.filter((item) => ['closed', 'accepted'].includes(String(item.contactStatus || '').toLowerCase())).length;

  return (
    <section className="account-shell wrap section">
      <aside className="account-sidebar">
        <div className="account-profile-card">
          <img src={avatar} alt={user?.name || 'User'} className="account-avatar" />
          <div>
            <span className="eyebrow">CUSTOMER</span>
            <h2>{user?.name || 'Your profile'}</h2>
            <p>{user?.email || 'Signed in account'}</p>
          </div>
        </div>

        <nav className="account-nav" aria-label="Account navigation">
          <a href="#overview">Overview</a>
          <a href="#profile">Edit profile</a>
          <a href="#bookings">Bookings</a>
          <a href="#support">Support</a>
        </nav>

        <button type="button" className="btn btn-outline btn-full" onClick={() => { clearSession(); nav('/login'); }}>
          Logout
        </button>
      </aside>

      <div className="account-main" id="overview">
        <header className="account-header">
          <div>
            <span className="eyebrow">YOUR ACCOUNT</span>
            <h1>Hello, {user?.name || 'there'}.</h1>
          </div>
          <Link className="btn btn-outline" to="/rentals">Browse rentals</Link>
        </header>

        {notice && <div className="notice" role="status">{notice}</div>}
        {error && <div className="notice error">{error}</div>}

        <div className="account-metric-grid">
          <article className="account-metric-card">
            <span className="eyebrow">MY BOOKINGS</span>
            <strong>{totalBookings}</strong>
            <small>Rental and transport requests</small>
          </article>
          <article className="account-metric-card">
            <span className="eyebrow">SAVED RENTALS</span>
            <strong>Browse</strong>
            <small>Keep homes you like</small>
          </article>
          <article className="account-metric-card">
            <span className="eyebrow">REVIEWS</span>
            <strong>{closedEnquiries}</strong>
            <small>Resolved enquiries</small>
          </article>
          <article className="account-metric-card">
            <span className="eyebrow">NOTIFICATIONS</span>
            <strong>{Math.max(0, data.length)}</strong>
            <small>Updates in your activity</small>
          </article>
        </div>

        <div className="account-content-grid">
          <article className="account-panel" id="profile">
            <div className="panel-header">
              <div>
                <span className="eyebrow">PROFILE</span>
                <h2>Edit details</h2>
              </div>
            </div>

            <form className="form-stack profile-form" onSubmit={saveProfile}>
              <div className="profile-avatar-block">
                <img src={avatar} alt={user?.name || 'User'} className="profile-avatar" />
                <label className="btn btn-outline btn-small profile-photo-label">
                  Change photo
                  <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                </label>
              </div>

              <div className="field-row">
                <label>Full name<input name="name" value={user.name || ''} onChange={handleInput} required /></label>
                <label>Phone<input name="phone" value={user.phone || ''} onChange={handleInput} /></label>
              </div>
              <div className="field-row">
                <label>Location<input name="location" value={user.location || ''} onChange={handleInput} required /></label>
                <label>Profile photo URL<input name="photoUrl" value={user.photoUrl || ''} onChange={handleInput} placeholder="https://example.com/profile.jpg" /></label>
              </div>
              <div className="action-row">
                <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
                <button className="btn btn-outline" type="button" onClick={() => { clearSession(); nav('/login'); }}>Log out</button>
              </div>
            </form>
          </article>

          <article className="account-panel" id="bookings">
            <div className="panel-header">
              <div>
                <span className="eyebrow">BOOKING HISTORY</span>
                <h2>Recent activity</h2>
              </div>
              <Link className="text-link" to="/enquiries">Open all →</Link>
            </div>

            <div className="booking-list">
              {propertyBookings.length || transportBookings.length ? (
                <>
                  {propertyBookings.slice(0, 3).map((booking) => (
                    <div className="booking-item" key={booking._id || booking.id}>
                      <div>
                        <span className="eyebrow">PROPERTY</span>
                        <h3>{booking.propertyId?.title || 'Property request'}</h3>
                      </div>
                      <p>{booking.message || 'Property enquiry in progress.'}</p>
                      <small>{booking.status || 'pending'} · {booking.requestedMoveInDate ? new Date(booking.requestedMoveInDate).toLocaleDateString() : 'No date set'}</small>
                    </div>
                  ))}
                  {transportBookings.slice(0, 3).map((booking) => (
                    <div className="booking-item" key={booking._id || booking.id}>
                      <div>
                        <span className="eyebrow">TRANSPORT</span>
                        <h3>{booking.pickup} → {booking.destination}</h3>
                      </div>
                      <p>{booking.details || 'Transport booking request is active.'}</p>
                      <small>{booking.status || 'pending'} · {booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleString() : 'Schedule pending'}</small>
                    </div>
                  ))}
                </>
              ) : (
                <div className="empty-state"><span>✦</span><h3>No bookings yet</h3><p>Your property and transport requests will show up here once submitted.</p></div>
              )}
            </div>
          </article>
        </div>

        <div className="account-mini-links" id="support">
          <Link className="btn btn-outline" to="/rentals">Saved rentals</Link>
          <Link className="btn btn-outline" to="/enquiries">My reviews</Link>
          <Link className="btn btn-outline" to="/contact">Privacy & security</Link>
          <Link className="btn btn-outline" to="/contact">Help & support</Link>
        </div>
      </div>
    </section>
  );
}

export function Enquiries(){const [items,setItems]=useState([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true);useEffect(()=>{api('enquiries/my').then(d=>setItems(unwrapItems(d))).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);return <section className="wrap section"><span className="eyebrow">YOUR REQUESTS</span><h1>Enquiries & work chat</h1><p className="muted">Keep messages connected to the work they belong to.</p>{loading?<p>Loading enquiries…</p>:error?<div className="notice error">{error}</div>:items.length?<div className="enquiry-list">{items.map(i=><article className="enquiry-card" key={i._id||i.id}><div><span className="eyebrow">{i.listingType||'ENQUIRY'} · {i.contactStatus||'pending'}</span><h3>{i.listingTitle||i.title||'Enquiry'}</h3><p>{i.message}</p><small>Created {i.createdAt?new Date(i.createdAt).toLocaleString():'recently'}</small></div></article>)}</div>:<div className="empty-state"><span>✉</span><h3>No enquiries yet</h3><p>When you submit a request, it will appear here.</p><Link className="btn" to="/transport">Find transport</Link></div>}</section>}
export function Admin(){
 const [applications,setApplications]=useState([]); const [tickets,setTickets]=useState([]); const [users,setUsers]=useState([]); const [stats,setStats]=useState(null); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [notice,setNotice]=useState(''); const [busyId,setBusyId]=useState('');
 async function load(){setLoading(true);setError('');const results=await Promise.allSettled([api('admin/provider-applications'),api('support'),api('admin/stats'),api('admin/users',{query:{limit:50}})]);if(results[0].status==='fulfilled')setApplications(unwrapItems(results[0].value));if(results[1].status==='fulfilled')setTickets(unwrapItems(results[1].value));if(results[2].status==='fulfilled')setStats(results[2].value);if(results[3].status==='fulfilled')setUsers(unwrapItems(results[3].value?.users || results[3].value));const failure=results.find(r=>r.status==='rejected');if(failure)setError(failure.reason?.message||'Some admin data could not be loaded.');setLoading(false);}
 useEffect(()=>{load();},[]);
 async function decide(id,decision){setBusyId(id);setNotice('');try{await api(`admin/provider-applications/${id}`,{method:'PATCH',body:{decision,note:''}});setNotice(`Provider application ${decision==='approve'?'approved':decision==='reject'?'rejected':'updated'}.`);await load();}catch(e){setNotice(e.message);}finally{setBusyId('');}}
 async function identityReview(item,status){const note=status==='match'?'Identity details reviewed and matched by admin.':status==='possible_mismatch'?'Identity details require clarification.':'Manual review required.';try{await api(`admin/provider-applications/${item.id}/identity-review`,{method:'PATCH',body:{status,aadhaarName:item.aadhaarName||item.name,note}});setNotice('Identity review status saved.');await load();}catch(e){setNotice(e.message);}}
 async function updateTicket(id,status){try{await api(`support/${id}/status`,{method:'PATCH',body:{status}});setNotice('Support request updated.');await load();}catch(e){setNotice(e.message);}}
 async function setUserActive(id,isActive){try{await api(`admin/users/${id}/status`,{method:'PATCH',body:{isActive}});setNotice('User status updated.');await load();}catch(e){setNotice(e.message);}}
 return <section className="wrap section"><span className="eyebrow">ADMINISTRATION</span><h1>Admin dashboard</h1><p className="muted">Live data from the connected backend. Only authorized administrator accounts can access these records.</p>{error&&<div className="notice error">{error}</div>}{notice&&<div className="notice" role="status">{notice}</div>}{loading?<p>Loading admin data…</p>:<>
 <div className="dashboard-grid"><div className="dashboard-card"><span className="eyebrow">USERS</span><h2>{stats?.users??'—'}</h2></div><div className="dashboard-card"><span className="eyebrow">SERVICE LISTINGS</span><h2>{stats?.services??'—'}</h2></div><div className="dashboard-card"><span className="eyebrow">PROPERTY LISTINGS</span><h2>{stats?.properties??'—'}</h2></div></div>
 <div className="section-head"><div><span className="eyebrow">USER MANAGEMENT</span><h2>Users ({users.length})</h2><p className="muted">Recent user accounts from the database.</p></div></div>
 {users.length?<div className="enquiry-list">{users.map(u=><article className="enquiry-card" key={u._id||u.id}><div><span className="eyebrow">{u.role} · {u.isActive===false?'inactive':'active'}</span><h3>{u.name}</h3><p>{u.email}</p><small>{u.phone||'No phone'} · {u.location||'No location'}</small></div><button className="btn btn-outline" disabled={u._id===readUser()?.id||u.id===readUser()?.id} onClick={()=>setUserActive(u._id||u.id,u.isActive===false)}>{u.isActive===false?'Reactivate':'Deactivate'}</button></article>)}</div>:<div className="empty-state"><p>No user records returned by the API.</p></div>}
 <div className="section-head"><div><span className="eyebrow">PROVIDER ONBOARDING</span><h2>Provider applications ({applications.length})</h2><p className="muted">Approve or reject applications after reviewing submitted details and any identity documents.</p></div><button className="btn btn-outline" onClick={load}>Refresh</button></div>
 {applications.length?<div className="enquiry-list">{applications.map(item=><article className="enquiry-card" key={item.id}><div><span className="eyebrow">{item.category} · {item.status}</span><h3>{item.name}</h3><p>{item.description}</p><small>{item.email} · {item.phone} · {item.city}, {item.taluk}, {item.district}</small><p>Identity document: {item.aadhaarDocumentAvailable?'uploaded':'not supplied'} · review: {item.identityReviewStatus||'not_checked'}</p>{item.reviewNote&&<p>Review note: {item.reviewNote}</p>}{item.aadhaarDocumentAvailable&&<div className="provider-actions"><label>Identity review<select defaultValue={item.identityReviewStatus||'not_checked'} onChange={e=>identityReview(item,e.target.value)}><option value="not_checked">Not checked</option><option value="match">Reviewed and matched</option><option value="possible_mismatch">Possible mismatch</option><option value="manual_review_required">Manual review required</option></select></label></div>}</div><div className="provider-actions"><button className="btn" disabled={busyId===item.id||item.status==='approved'} onClick={()=>decide(item.id,'approve')}>{busyId===item.id?'Saving…':'Approve'}</button><button className="btn btn-outline" disabled={busyId===item.id||item.status==='rejected'} onClick={()=>decide(item.id,'reject')}>Reject</button><button className="btn btn-outline" disabled={busyId===item.id} onClick={()=>decide(item.id,'info')}>Request info</button></div></article>)}</div>:<div className="empty-state"><h3>No pending provider applications</h3><p>New provider registrations will appear here when submitted to the backend.</p></div>}
 <div className="section-head" style={{marginTop:'48px'}}><div><span className="eyebrow">PROVIDER HELP DESK</span><h2>Support requests ({tickets.length})</h2></div></div>
 {tickets.length?<div className="enquiry-list">{tickets.map(t=><article className="enquiry-card" key={t._id}><div><span className="eyebrow">{t.category} · {t.status}</span><h3>{t.subject}</h3><p>{t.message}</p><small>{t.userId?.name||'User'} · {t.userId?.email||''}</small></div><div className="provider-actions"><select aria-label="Support ticket status" value={t.status} onChange={e=>updateTicket(t._id,e.target.value)}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></div></article>)}</div>:<div className="empty-state"><p>No support requests have been submitted.</p></div>}
 </>}</section>
}
