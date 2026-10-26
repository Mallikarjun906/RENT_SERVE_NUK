import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import RequireAuth, { PublicPage } from './components/RequireAuth.jsx';
import Home from './pages/Home.jsx';
import { Login, Register, ForgotPassword } from './pages/Auth.jsx';
import { Directory, Detail } from './pages/Directory.jsx';
import Transport from './pages/Transport.jsx';
import { Dashboard, Enquiries, Admin } from './pages/Account.jsx';
import Contact from './pages/Contact.jsx';
import ProviderRegister from './pages/ProviderRegister.jsx';
import ProviderDashboard from './pages/ProviderDashboard.jsx';
import ProviderContactSupport from './pages/ProviderContactSupport.jsx';
import OwnerDashboard from './pages/OwnerDashboard.jsx';
import { readUser } from './services/api';
function RoleDashboard(){const user=readUser(); if(user?.role==='provider') return <Navigate to='/provider/dashboard' replace/>; if(user?.role==='admin') return <Navigate to='/admin' replace/>; if(user?.role==='owner') return <Navigate to='/owner/dashboard' replace/>; return <Dashboard/>;}
export default function App(){return <Layout><Routes><Route path="/" element={<PublicPage><Home/></PublicPage>}/><Route path="/contact" element={<PublicPage><Contact/></PublicPage>}/><Route path="/login" element={<PublicPage><Login/></PublicPage>}/><Route path="/register" element={<PublicPage><Register/></PublicPage>}/><Route path="/provider/register" element={<PublicPage><ProviderRegister/></PublicPage>}/><Route path="/forgot-password" element={<PublicPage><ForgotPassword/></PublicPage>}/><Route path="/rentals" element={<PublicPage><Directory kind="property"/></PublicPage>}/><Route path="/rentals/:id" element={<PublicPage><Detail kind="property"/></PublicPage>}/><Route path="/services" element={<PublicPage><Directory kind="service"/></PublicPage>}/><Route path="/services/:id" element={<PublicPage><Detail kind="service"/></PublicPage>}/><Route path="/transport" element={<PublicPage><Transport/></PublicPage>}/><Route path="/transport/:id" element={<PublicPage><Detail kind="transport"/></PublicPage>}/><Route path="/dashboard" element={<RequireAuth><RoleDashboard/></RequireAuth>}/><Route path="/provider/dashboard" element={<RequireAuth roles={['provider']}><ProviderDashboard/></RequireAuth>}/><Route path="/provider/contact-support" element={<RequireAuth roles={['provider']}><ProviderContactSupport/></RequireAuth>}/><Route path="/owner/dashboard" element={<RequireAuth roles={['owner']}><OwnerDashboard/></RequireAuth>}/><Route path="/enquiries" element={<RequireAuth roles={['customer','owner','admin']}><Enquiries/></RequireAuth>}/><Route path="/admin" element={<RequireAuth roles={['admin']}><Admin/></RequireAuth>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Layout>}
