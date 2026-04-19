// pages/hub/[[...slug]].js
// Unified PÜR Hub landing + tool routes. Migrated from the old
// hub.purconstruction.com repo on 2026-04-19 (chain P11).
//
// Single catchall handles every /hub/* URL (except /hub/commande/* which
// remains pinned to the Batch BC tool at pages/hub/commande/*).
//
// Auth: client-side probe to /api/hub-check. If 401/403, redirect to
// the platform login page with a return URL so the user lands back here.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ClipboardList, Home, Package, AppWindow, DoorOpen, Layers, Tag, FileText, Receipt } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CommandePage from '@/components/hub/commande/CommandePage';
import ToiturePage from '@/components/hub/toiture/ToiturePage';
import DevisPage from '@/components/hub/devis/DevisPage';
import CatalogEmbed from '@/components/hub/catalogs/CatalogEmbed';
import CatalogChooser from '@/components/hub/catalogs/CatalogChooser';
import FichesChooser from '@/components/hub/fiches/FichesChooser';

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
  const [isAuthed, setIsAuthed] = useState(null);

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

  const tool = TOOLS[activeTool] || TOOLS[''];
  const ToolComponent = tool.component;

  return (
    <>
      <Head>
        <title>{`${tool.title} — Hub`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <DashboardLayout title={tool.title}>
        <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-4">
          {isAuthed === null && (
            <div className="text-sm text-d-muted py-8 text-center animate-pulse">Chargement…</div>
          )}
          {isAuthed === false && (
            <div className="text-sm text-d-muted py-8 text-center">Redirection…</div>
          )}
          {isAuthed === true && (
            <ToolComponent tool={tool} />
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
