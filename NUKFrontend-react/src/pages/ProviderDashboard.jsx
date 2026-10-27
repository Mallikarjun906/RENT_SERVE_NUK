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
    setLoading(true);
    setError('');
    const results = await Promise.allSettled([
      api('providers/me'),
      api('enquiries/received'),
      api('transport-bookings/available')
    ]);

    if (results[0].status === 'fulfilled') setProfile(results[0].value);
    else if (!String(results[0].reason?.message || '').includes('Provider profile not found')) {
      setError(results[0].reason?.message || 'Could not load provider profile.');
    }
    if (results[1].status === 'fulfilled') setEnquiries(unwrapItems(results[1].value));
    if (results[2].status === 'fulfilled') setTransport(unwrapItems(results[2].value));

    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length === 3 && !error) {
      setError(failures[0].reason?.message || 'Could not load dashboard data.');
    }
    setLoading(false);
  }, [error]);

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
  const providerName = profile?.displayName || profile?.businessName || profile?.name || user?.name || 'Provider';
  const avatar = profile?.photoUrl || user?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(providerName)}&background=173B35&color=ffffff`;
  const openRequests = transport.filter((item) => !['accepted', 'rejected', 'completed', 'closed', 'cancelled'].includes(String(item.status || 'pending').toLowerCase()));
  const activeJobs = transport.filter((item) => ['accepted', 'confirmed', 'in_progress', 'assigned'].includes(String(item.status || '').toLowerCase()));
  const finishedJobs = transport.filter((item) => ['completed', 'closed'].includes(String(item.status || '').toLowerCase()));
  const completedCount = finishedJobs.length + enquiries.filter((item) => ['accepted', 'closed'].includes(String(item.contactStatus || '').toLowerCase())).length;

  return (
    <section className="provider-workspace wrap section">
      <aside className="provider-sidebar">
        <div className="provider-profile-card">
          <img src={avatar} alt={providerName} className="provider-avatar" />
          <div>
            <span className="eyebrow">SERVICE PROVIDER</span>
            <h2>{providerName}</h2>
            <p>{user?.email || 'Professional account'}</p>
          </div>
        </div>

        <nav className="provider-sidebar-nav" aria-label="Provider navigation">
          <a href="#overview">Overview</a>
          <a href="#requests">New Requests</a>
          <a href="#active-jobs">Active Jobs</a>
          <a href="#completed">Completed</a>
          <a href="#support">Support</a>
        </nav>

        <div className="provider-sidebar-box">
          <span className="eyebrow">ACCOUNT STATUS</span>
          <div className="sidebar-status-line">
            <span className={`status-pill status-${appStatus}`}>{statusLabel(appStatus)}</span>
          </div>
          <p>{profile?.reviewNote || (['approved', 'verified'].includes(appStatus) ? 'Your account is approved and ready for new bookings.' : appStatus === 'rejected' ? 'Please contact support to resolve the review outcome.' : 'Your application is pending review. Some features unlock after approval.')}</p>
        </div>
      </aside>

      <div className="provider-main" id="overview">
        <header className="provider-topbar">
          <div className="provider-greeting">
            <div>
              <span className="eyebrow">PROVIDER WORKSPACE</span>
              <h1>Welcome back, {providerName}.</h1>
            </div>
          </div>
          <div className="provider-header-actions">
            <button type="button" className="btn btn-outline">Availability: online</button>
            <Link className="btn" to="/provider/contact-support">Profile & settings</Link>
          </div>
        </header>

        {error && <div className="notice error" role="alert">{error}</div>}
        {notice && <div className="notice" role="status">{notice}</div>}

        <div className="provider-metric-grid">
          <article className="provider-metric-card">
            <span className="eyebrow">NEW REQUESTS</span>
            <strong>{openRequests.length}</strong>
            <small>Awaiting your response</small>
          </article>
          <article className="provider-metric-card">
            <span className="eyebrow">ACTIVE JOBS</span>
            <strong>{activeJobs.length}</strong>
            <small>In progress right now</small>
          </article>
          <article className="provider-metric-card">
            <span className="eyebrow">COMPLETED</span>
            <strong>{completedCount}</strong>
            <small>Jobs closed successfully</small>
          </article>
          <article className="provider-metric-card accent">
            <span className="eyebrow">ACCOUNT</span>
            <strong>{statusLabel(appStatus)}</strong>
            <small>{profile?.serviceArea || 'Service area updates from profile'}</small>
          </article>
        </div>

        <div className="provider-board" id="requests">
          <section className="provider-panel">
            <div className="provider-panel-header">
              <div>
                <span className="eyebrow">NEW REQUESTS</span>
                <h2>Respond to customer enquiries</h2>
              </div>
              <button type="button" className="btn btn-outline btn-small" onClick={() => setRefreshKey((n) => n + 1)}>Refresh</button>
            </div>

            {loading ? <div className="empty-state">Loading requests…</div> : openRequests.length ? (
              <div className="request-list">
                {openRequests.map((item) => {
                  const customerName = item.customerId?.name || 'Customer';
                  const requestTime = item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : 'Timing to be confirmed';
                  const status = String(item.status || 'pending');
                  return (
                    <article className="request-card" key={item._id || item.id}>
                      <div className="request-card-top">
                        <span className={`status-pill status-${status === 'pending' ? 'info' : status.toLowerCase()}`}>{status === 'pending' ? 'Awaiting response' : status}</span>
                        <time>{requestTime}</time>
                      </div>
                      <h3>{item.pickup ? `${item.pickup} → ${item.destination}` : (item.title || item.vehicleType || 'Service request')}</h3>
                      <p>{item.details || 'No additional notes provided yet.'}</p>
                      <div className="request-meta">
                        <span><b>Customer</b>{customerName}</span>
                        <span><b>Location</b>{item.pickup || item.location || 'Not specified'}</span>
                        <span><b>Service</b>{item.vehicleType || item.service || 'Transport request'}</span>
                      </div>
                      <div className="request-actions">
                        <button type="button" className="btn btn-small" disabled={actionId === item._id} onClick={() => respond(item._id, 'accepted')}>{actionId === item._id ? 'Saving…' : 'Accept'}</button>
                        <button type="button" className="btn btn-outline btn-small" disabled={actionId === item._id} onClick={() => respond(item._id, 'rejected')}>Reject</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state"><span>✦</span><h3>No new requests</h3><p>When customers send jobs or transport requests, they appear here for review.</p></div>
            )}
          </section>

          <section className="provider-panel" id="active-jobs">
            <div className="provider-panel-header">
              <div>
                <span className="eyebrow">ACTIVE</span>
                <h2>Current jobs</h2>
              </div>
            </div>
            {activeJobs.length ? (
              <div className="request-list compact">
                {activeJobs.map((item) => (
                  <article className="request-card compact" key={item._id || item.id}>
                    <div className="request-card-top"><span className="status-pill status-approved">Active</span><time>{item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : 'Scheduled'}</time></div>
                    <h3>{item.pickup ? `${item.pickup} → ${item.destination}` : (item.title || item.vehicleType || 'Live request')}</h3>
                    <p>{item.details || 'No additional details'}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state"><span>✓</span><h3>No live jobs</h3><p>Accepted requests move here once you confirm the booking.</p></div>
            )}
          </section>

          <section className="provider-panel" id="completed">
            <div className="provider-panel-header">
              <div>
                <span className="eyebrow">COMPLETED</span>
                <h2>Recent outcomes</h2>
              </div>
            </div>
            {finishedJobs.length || enquiries.filter((item) => ['accepted', 'closed'].includes(String(item.contactStatus || '').toLowerCase())).length ? (
              <div className="request-list compact">
                {finishedJobs.map((item) => (
                  <article className="request-card compact" key={item._id || item.id}>
                    <div className="request-card-top"><span className="status-pill status-verified">Completed</span><time>{item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : 'Reviewed'}</time></div>
                    <h3>{item.pickup ? `${item.pickup} → ${item.destination}` : (item.title || item.vehicleType || 'Completed job')}</h3>
                    <p>{item.details || 'Marked complete by the provider.'}</p>
                  </article>
                ))}
                {enquiries.filter((item) => ['accepted', 'closed'].includes(String(item.contactStatus || '').toLowerCase())).map((item) => (
                  <article className="request-card compact" key={`enq-${item._id || item.id}`}>
                    <div className="request-card-top"><span className="status-pill status-verified">Closed</span><time>{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'Recent'}</time></div>
                    <h3>{item.listingTitle || item.listingId?.title || 'Completed enquiry'}</h3>
                    <p>{item.message || 'Customer request closed.'}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state"><span>◎</span><h3>No completed jobs yet</h3><p>Once a customer closes a booking or leaves a resolved enquiry, it appears here.</p></div>
            )}
          </section>
        </div>

        <div className="provider-support-cta" id="support">
          <div>
            <span className="eyebrow">SUPPORT</span>
            <h2>Need help with your account?</h2>
            <p>Reach support for application reviews, compliance questions, or customer request issues.</p>
          </div>
          <Link className="btn" to="/provider/contact-support">Contact support →</Link>
        </div>
      </div>
    </section>
  );
}
