import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, readUser, unwrapItems } from '../services/api';

const statusLabel = (value) => ({ pending: 'Pending review', info: 'More information requested', approved: 'Approved', verified: 'Approved', rejected: 'Rejected' }[value] || value || 'Not available');

export default function ProviderDashboard() {
  const user = readUser();
  const [profile, setProfile] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [transport, setTransport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const results = await Promise.allSettled([
      api('providers/me'),
      api('enquiries/received'),
      api('transport-bookings/available')
    ]);
    if (results[0].status === 'fulfilled') setProfile(results[0].value);
    else if (!String(results[0].reason?.message || '').includes('Provider profile not found')) setError(results[0].reason?.message || 'Could not load provider profile.');
    if (results[1].status === 'fulfilled') setEnquiries(unwrapItems(results[1].value));
    if (results[2].status === 'fulfilled') setTransport(unwrapItems(results[2].value));
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length === 3) setError(failures[0].reason?.message || 'Could not load dashboard data.');
    setLoading(false);
  }, []);

  useEffect(() => { load(); const timer = window.setInterval(load, 30000); return () => window.clearInterval(timer); }, [load, refreshKey]);
  if (user?.role !== 'provider') return <Navigate to="/dashboard" replace />;

  async function respond(id, status) {
    setActionId(id); setNotice('');
    try {
      await api(`transport-bookings/${id}/status`, { method: 'PATCH', body: { status } });
      setNotice(status === 'accepted' ? 'Request accepted. The customer request is now assigned to you.' : 'Request declined. It remains available to other eligible providers.');
      setRefreshKey((n) => n + 1);
    } catch (e) { setNotice(e.message); }
    finally { setActionId(''); }
  }

  const appStatus = profile?.verificationStatus || profile?.status || 'pending';
  return <section className="wrap section provider-dashboard">
    <div className="page-title"><span className="eyebrow">PROVIDER WORKSPACE</span><h1>Welcome, {profile?.displayName || user?.name || 'Provider'}.</h1><p>Your provider area contains only the dashboard and contact support.</p></div>
    <div className="provider-status-panel"><div><span className="eyebrow">APPLICATION STATUS</span><h2>{statusLabel(appStatus)}</h2><p>{profile?.reviewNote || (['approved','verified'].includes(appStatus) ? 'Your provider account is approved.' : appStatus === 'rejected' ? 'Please contact support if you need clarification.' : 'Your application is awaiting review. Some provider functions are available only after approval.')}</p></div><span className={`status-pill status-${appStatus}`}>{statusLabel(appStatus)}</span></div>
    {error && <div className="notice error" role="alert">{error}</div>}
    {notice && <div className="notice" role="status">{notice}</div>}
    {loading ? <div className="empty-state">Loading your dashboard…</div> : <>
      <div className="dashboard-grid provider-metrics">
        <article className="dashboard-card"><span className="eyebrow">ACCOUNT</span><h2>{user?.name || 'Provider'}</h2><p>{user?.email}</p><small>{profile?.bio || 'Provider profile details are shown when available.'}</small></article>
        <article className="dashboard-card"><span className="eyebrow">CUSTOMER ENQUIRIES</span><h2>{enquiries.length}</h2><p>Requests connected to listings you own.</p></article>
        <article className="dashboard-card"><span className="eyebrow">MATCHING TRANSPORT REQUESTS</span><h2>{transport.length}</h2><p>Requests matching your approved transport category.</p></article>
      </div>
      <div className="section-head"><div><span className="eyebrow">CUSTOMER CONTACT</span><h2>Your enquiries</h2></div><button className="btn btn-outline" onClick={() => setRefreshKey((n) => n + 1)}>Refresh</button></div>
      {enquiries.length ? <div className="enquiry-list">{enquiries.map((item) => <article className="enquiry-card" key={item._id || item.id}><div><span className="eyebrow">{item.listingType} · {item.contactStatus || 'pending'}</span><h3>{item.listingId?.title || item.listingTitle || 'Listing enquiry'}</h3><p>{item.message}</p><small>Customer: {item.customerId?.name || 'Customer'} {item.customerId?.phone ? `· ${item.customerId.phone}` : ''}</small></div><div className="provider-actions"><select aria-label="Enquiry status" defaultValue={item.contactStatus || 'pending'} onChange={async (e) => { try { await api(`enquiries/${item._id}/status`, { method: 'PATCH', body: { contactStatus: e.target.value } }); setRefreshKey((n) => n + 1); } catch (err) { setNotice(err.message); } }}><option value="pending">Pending</option><option value="contacted">Contacted</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option><option value="closed">Closed</option></select></div></article>)}</div> : <div className="empty-state"><span>✉</span><h3>No enquiries yet</h3><p>Customer enquiries related to your existing listings will appear here.</p></div>}
      <div className="section-head provider-transport-heading"><div><span className="eyebrow">PROVIDER REQUESTS</span><h2>Matching transport requests</h2><p className="muted">Requests are refreshed when you use Refresh. Only approved providers in the matching category can accept.</p></div></div>
      {transport.length ? <div className="enquiry-list">{transport.map((item) => <article className="enquiry-card" key={item._id}><div><span className="eyebrow">{item.vehicleType} · pending</span><h3>{item.pickup} → {item.destination}</h3><p>{new Date(item.scheduledAt).toLocaleString()} · {item.details || 'No additional details'}</p><small>Requested by {item.customerId?.name || 'Customer'}{item.customerId?.phone ? ` · ${item.customerId.phone}` : ''}</small></div><div className="provider-actions"><button className="btn" disabled={actionId === item._id} onClick={() => respond(item._id, 'accepted')}>{actionId === item._id ? 'Saving…' : 'Accept request'}</button><button className="btn btn-outline" disabled={actionId === item._id} onClick={() => respond(item._id, 'rejected')}>Decline</button></div></article>)}</div> : <div className="empty-state"><span>↗</span><h3>No matching requests</h3><p>When customers submit transport requests matching your approved category, they will appear here.</p></div>}
    </>}
    <div className="provider-support-cta"><div><h2>Need help with your account?</h2><p>Contact support for application reviews, account access or customer request issues.</p></div><Link className="btn" to="/provider/contact-support">Contact Support →</Link></div>
  </section>;
}
