import { translate } from '@mwt-mclient/i18n';

import './styles.css';

export function App() {
  return (
    <main className="shell">
      <section className="card" aria-labelledby="page-title">
        <p className="eyebrow">{translate('app.status.foundation')}</p>
        <h1 id="page-title">{translate('app.name')}</h1>
        <p>{translate('app.summary')}</p>
        <details>
          <summary>{translate('advanced.label')}</summary>
          <p>{translate('advanced.foundationDetails')}</p>
        </details>
      </section>
    </main>
  );
}
