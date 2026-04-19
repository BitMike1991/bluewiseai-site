// pages/hub/[[...slug]].js
// Unified PÜR Hub landing + tool routes. Migrated from the old
// hub.purconstruction.com repo on 2026-04-19 (chain P11).
//
// Single catchall handles every /hub/* URL (except /hub/commande/* which
// remains pinned to the Batch BC tool at pages/hub/commande/*).
//
// Auth: client-side probe to /api/hub-check. If 401/403, redirect to
// the platform login page with a return URL so the user lands back here.

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ClipboardList, Home, Package, AppWindow, DoorOpen, Layers, Tag, FileText, Receipt } from 'lucide-react';
import HubSidebar from '@/components/hub/HubSidebar';
import HubTabBar from '@/components/hub/HubTabBar';
import CommandePage from '@/components/hub/commande/CommandePage';
import ToiturePage from '@/components/hub/toiture/ToiturePage';
import DevisPage from '@/components/hub/devis/DevisPage';
import CatalogEmbed from '@/components/hub/catalogs/CatalogEmbed';
import CatalogChooser from '@/components/hub/catalogs/CatalogChooser';
import FichesChooser from '@/components/hub/fiches/FichesChooser';
import s from '@/styles/hub.module.css';

function EmbedFenetres()   { return <CatalogEmbed src="/catalog-fenetres/index.html"   title="Catalogue Fenêtres" />; }
function EmbedPatio()      { return <CatalogEmbed src="/catalog-patio/index.html"      title="Catalogue Patio" />; }
function EmbedRevetement() { return <CatalogEmbed src="/catalog-revetement/index.html" title="Catalogue Revêtement" />; }
function EmbedPromo()      { return <CatalogEmbed src="/catalog-promo/index.html"      title="Catalogue Promo" />; }
function EmbedFull()       { return <CatalogEmbed src="/catalog-full/index.html"       title="Catalogue Complet" />; }
function EmbedFiches()     { return <CatalogEmbed src="/fiches-tech/index.html"        title="Fiches Techniques" />; }

const TOOLS = {
  '':                    { title: 'Commande',            icon: <ClipboardList size={48} aria-hidden="true" />, component: CommandePage },
  'toiture':             { title: 'Calculateur Toiture', icon: <Home         size={48} aria-hidden="true" />, component: ToiturePage },
  'devis':               { title: 'Générateur de devis', icon: <Receipt      size={48} aria-hidden="true" />, component: DevisPage },
  'catalogues':          { title: 'Catalogues',          icon: <Package      size={48} aria-hidden="true" />, component: CatalogChooser },
  'catalogues/fenetres': { title: 'Catalogue Fenêtres',  icon: <AppWindow    size={48} aria-hidden="true" />, component: EmbedFenetres },
  'catalogues/patio':    { title: 'Catalogue Patio',     icon: <DoorOpen     size={48} aria-hidden="true" />, component: EmbedPatio },
  'catalogues/revetement':{ title: 'Catalogue Revêtement',icon:<Layers       size={48} aria-hidden="true" />, component: EmbedRevetement },
  'catalogues/promo':    { title: 'Catalogue Promo',     icon: <Tag          size={48} aria-hidden="true" />, component: EmbedPromo },
  'catalogues/complet':  { title: 'Catalogue Complet',   icon: <Package      size={48} aria-hidden="true" />, component: EmbedFull },
  'fiches':              { title: 'Fiches Techniques',   icon: <FileText     size={48} aria-hidden="true" />, component: FichesChooser },
};

export default function HubPage() {
  const router = useRouter();
  const [isAuthed, setIsAuthed]             = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const slugArray = router.query.slug || [];
  const activeTool = slugArray.join('/');

  useEffect(() => {
    fetch('/api/hub-check', { credentials: 'same-origin' })
      .then((res) => {
        if (res.ok) {
          setIsAuthed(true);
        } else {
          setIsAuthed(false);
          router.replace(`/platform/login?next=${encodeURIComponent(router.asPath)}`);
        }
      })
      .catch(() => {
        setIsAuthed(false);
        router.replace('/platform/login');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = useCallback((slug) => {
    const path = slug ? `/hub/${slug}` : '/hub';
    router.push(path, undefined, { shallow: true });
  }, [router]);

  const tool = TOOLS[activeTool] || TOOLS[''];
  const ToolComponent = tool.component;

  return (
    <>
      <Head>
        <title>{`${tool.title} — PÜR Hub`}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="theme-color" content="#1C1E25" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className={s.shell}>
        <HubSidebar
          activeTool={activeTool}
          onNavigate={navigate}
          expanded={sidebarExpanded}
          onToggle={() => setSidebarExpanded(!sidebarExpanded)}
        />

        <main className={s.content}>
          <div className={s.contentInner}>
            {isAuthed === null && (
              <div className={s.mainLoading}>Chargement…</div>
            )}
            {isAuthed === false && (
              <div className={s.mainLoading}>Redirection…</div>
            )}
            {isAuthed === true && (
              <ToolComponent tool={tool} />
            )}
          </div>
        </main>

        <HubTabBar activeTool={activeTool} onNavigate={navigate} />
      </div>
    </>
  );
}
