import Link from 'next/link';
import { fr } from '@/lib/i18n/fr';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
            MF
          </div>
          <span className="font-semibold text-foreground">{fr.appName}</span>
        </div>
        <Link
          href="/setup"
          className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          Commencer
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light text-primary text-sm font-medium mb-6">
            {fr.landing.badge}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
            {fr.landing.title}
            <br />
            <span className="text-primary">{fr.landing.titleHighlight}</span>
          </h1>
          <p className="text-lg text-muted max-w-lg mx-auto mb-8">
            {fr.landing.description}
          </p>
          <Link
            href="/setup"
            className="inline-block px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors text-base"
          >
            {fr.landing.cta}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mt-20 mb-16">
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-xl bg-fresh-bg text-fresh flex items-center justify-center mx-auto mb-3 text-xl">
              📸
            </div>
            <h3 className="font-semibold text-foreground mb-1">{fr.landing.features.scan.title}</h3>
            <p className="text-sm text-muted">{fr.landing.features.scan.description}</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-xl bg-warning-bg text-warning-color flex items-center justify-center mx-auto mb-3 text-xl">
              ⏰
            </div>
            <h3 className="font-semibold text-foreground mb-1">{fr.landing.features.expiration.title}</h3>
            <p className="text-sm text-muted">{fr.landing.features.expiration.description}</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center mx-auto mb-3 text-xl">
              🗣️
            </div>
            <h3 className="font-semibold text-foreground mb-1">{fr.landing.features.voice.title}</h3>
            <p className="text-sm text-muted">{fr.landing.features.voice.description}</p>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-muted">
        {fr.appName} &mdash; {fr.tagline}
      </footer>
    </div>
  );
}
