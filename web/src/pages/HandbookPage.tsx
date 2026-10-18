// Eingebautes Handbuch: Inhaltsverzeichnis links, Kapitel rechts, auf dem Handy Kapitelwahl oben.
// Adresse /handbook/<kapitel>#<abschnitt>, damit Hilfe-Knöpfe und Suche direkt an die Stelle springen.
import { Fragment, useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ArrowLeft, ArrowRight, Lightbulb, Route } from 'lucide-react'
import { PageBody, PageHeader } from '../components/Page'
import { ProSlot } from '../pro/host'
import { ProLockButton } from '../pro/ProTeaser'
import { Select } from '../components/Select'
import { useHandbook } from '../i18n/handbook'
import type { HandbookBlock } from '../types/handbook'
import './handbook.css'

// **Beschriftung** als hervorgehobenen Oberflächenbegriff darstellen
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="hb-ui">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}

function Block({ block }: { block: HandbookBlock }) {
  switch (block.type) {
    case 'p':
      return (
        <p className="hb-p">
          <RichText text={block.text} />
        </p>
      )
    case 'steps':
      return (
        <ol className="hb-steps">
          {block.items.map((item, i) => (
            <li key={i}>
              <RichText text={item} />
            </li>
          ))}
        </ol>
      )
    case 'list':
      return (
        <ul className="hb-list">
          {block.items.map((item, i) => (
            <li key={i}>
              <RichText text={item} />
            </li>
          ))}
        </ul>
      )
    case 'tip':
      return (
        <div className="hb-note hb-tip">
          <Lightbulb size={16} />
          <p>
            <RichText text={block.text} />
          </p>
        </div>
      )
    case 'warning':
      return (
        <div className="hb-note hb-warning">
          <AlertTriangle size={16} />
          <p>
            <RichText text={block.text} />
          </p>
        </div>
      )
    case 'terms':
      return (
        <dl className="hb-terms">
          {block.items.map((item) => (
            <div key={item.term} className="hb-term">
              <dt>{item.term}</dt>
              <dd>
                <RichText text={item.text} />
              </dd>
            </div>
          ))}
        </dl>
      )
  }
}

export function HandbookPage() {
  const { t } = useTranslation()
  const chapters = useHandbook()
  const { chapter: chapterParam } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const index = Math.max(0, chapters.findIndex((c) => c.id === chapterParam))
  const chapter = chapters[index]!
  const prev = chapters[index - 1]
  const next = chapters[index + 1]

  // Unbekanntes oder fehlendes Kapitel: zum ersten Kapitel
  useEffect(() => {
    if (chapterParam !== chapter.id) navigate(`/handbook/${chapter.id}${location.hash}`, { replace: true })
  }, [chapterParam, chapter.id, location.hash, navigate])

  // Zum Abschnitt aus der Adresse springen, sonst an den Anfang
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1))
    const target = id ? document.getElementById(`hb-${id}`) : null
    if (target) {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'start', behavior: 'smooth' })
        target.classList.remove('hb-flash')
        void target.offsetWidth
        target.classList.add('hb-flash')
      })
    } else {
      window.scrollTo({ top: 0 })
    }
  }, [chapter.id, location.hash])

  const chapterOptions = useMemo(
    () => chapters.map((c, i) => ({ value: c.id, label: `${i + 1}. ${c.title}` })),
    [chapters],
  )

  return (
    <>
      <PageHeader
        eyebrow={t('handbook.eyebrow')}
        title={t('handbook.title')}
        subtitle={t('handbook.subtitle')}
        actions={
          // Geführte Touren gehören zu MixMarket Pro
          <ProSlot
            name="handbook.actions"
            fallback={<ProLockButton feature="tours" label={t('pro.feature.tours.title')} icon={<Route size={16} />} />}
          />
        }
      />
      <PageBody>
        <div className="hb">
          {/* Inhaltsverzeichnis */}
          <nav className="hb-toc" aria-label={t('handbook.contents')}>
            <div className="hb-toc-head">{t('handbook.contents')}</div>
            <ol>
              {chapters.map((c, i) => (
                <li key={c.id}>
                  <Link to={`/handbook/${c.id}`} className={c.id === chapter.id ? 'is-active' : ''}>
                    <span className="hb-toc-num font-mono">{String(i + 1).padStart(2, '0')}</span>
                    <span>{c.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </nav>

          <article className="hb-content">
            {/* Kapitelwahl auf schmalen Bildschirmen */}
            <div className="hb-mobile-select">
              <Select value={chapter.id} options={chapterOptions} onChange={(id) => navigate(`/handbook/${id}`)} />
            </div>

            <header className="hb-chapter-head">
              <div className="hb-chapter-num font-mono">{t('handbook.chapter', { number: index + 1 })}</div>
              <h2 className="hb-chapter-title font-display">{chapter.title}</h2>
              <p className="hb-chapter-summary">{chapter.summary}</p>
              {chapter.sections.length > 2 && (
                <ul className="hb-onpage" aria-label={t('handbook.onThisPage')}>
                  {chapter.sections.map((s) => (
                    <li key={s.id}>
                      <Link to={`/handbook/${chapter.id}#${s.id}`} replace>
                        {s.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </header>

            {chapter.sections.map((section) => (
              <section key={section.id} id={`hb-${section.id}`} className="hb-section">
                <h3 className="hb-section-title">{section.title}</h3>
                {section.blocks.map((block, i) => (
                  <Block key={i} block={block} />
                ))}
              </section>
            ))}

            {/* Blättern zum vorigen und nächsten Kapitel */}
            <footer className="hb-pager">
              {prev ? (
                <Link to={`/handbook/${prev.id}`} className="hb-pager-link">
                  <ArrowLeft size={16} />
                  <span>
                    <span className="hb-pager-label">{t('handbook.previous')}</span>
                    <span className="hb-pager-title">{prev.title}</span>
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link to={`/handbook/${next.id}`} className="hb-pager-link is-next">
                  <span>
                    <span className="hb-pager-label">{t('handbook.next')}</span>
                    <span className="hb-pager-title">{next.title}</span>
                  </span>
                  <ArrowRight size={16} />
                </Link>
              )}
            </footer>
          </article>
        </div>
      </PageBody>
    </>
  )
}
