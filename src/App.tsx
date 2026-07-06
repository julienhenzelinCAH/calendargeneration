import { useState } from 'react';
import { Sidebar, Topbar, Button } from './ds';
import type { NavItemDef } from './ds/Sidebar';
import { useStore } from './store/AppStore';
import { Accueil } from './screens/Accueil';
import { Dashboard } from './screens/Dashboard';
import { Apercu } from './screens/Apercu';
import { Feries } from './screens/Feries';
import { Configuration } from './screens/Configuration';

export type ScreenKey = 'accueil' | 'dashboard' | 'apercu' | 'feries' | 'config';

const NAV: NavItemDef[] = [
	{ key: 'accueil', label: 'Accueil', icon: 'home' },
	{ key: 'dashboard', label: 'Tableau de bord', icon: 'rectangle-stack' },
	{ key: 'apercu', label: 'Aperçu', icon: 'calendar-days' },
	{ key: 'feries', label: 'Fériés & vacances', icon: 'calendar' },
	{ key: 'config', label: 'Configuration', icon: 'cog' },
];

const TITLES: Record<ScreenKey, { title: string; subtitle: string }> = {
	accueil: { title: 'Accueil', subtitle: 'Connexion au classeur et statut des onglets' },
	dashboard: { title: 'Tableau de bord', subtitle: 'Année scolaire, volées et cours à reporter' },
	apercu: { title: 'Aperçu', subtitle: 'Rendu du calendrier et export PDF' },
	feries: { title: 'Fériés & vacances', subtitle: 'Éditables, mémorisés par année scolaire' },
	config: { title: 'Configuration', subtitle: 'Onglets, palettes et textes de pied de page' },
};

export function App() {
	const [screen, setScreen] = useState<ScreenKey>('accueil');
	const store = useStore();
	const meta = TITLES[screen];

	return (
		<div style={{ display: 'flex', height: '100%', background: 'var(--surface-page)' }}>
			<Sidebar items={NAV} activeKey={screen} onSelect={(k) => setScreen(k as ScreenKey)} />
			<div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
				<Topbar
					title={meta.title}
					subtitle={meta.subtitle}
					right={
						<>
							<span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-intl)' }}>
								Année {store.year}–{store.year + 1}
							</span>
							<Button
								variant="outline"
								size="sm"
								icon="arrow-path"
								loading={store.loading}
								loadingText="Chargement…"
								onClick={store.loadAll}
							>
								Recharger les données
							</Button>
						</>
					}
				/>
				<main style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: 'var(--surface-subtle)' }}>
					<div style={{ maxWidth: 1250, margin: '0 auto', padding: '28px 32px 64px' }}>
						{screen === 'accueil' && <Accueil goto={setScreen} />}
						{screen === 'dashboard' && <Dashboard goto={setScreen} />}
						{screen === 'apercu' && <Apercu />}
						{screen === 'feries' && <Feries />}
						{screen === 'config' && <Configuration />}
					</div>
				</main>
			</div>
		</div>
	);
}
