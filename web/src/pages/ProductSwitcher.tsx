// Produktwahl oben in der Recherche und Fenster zum Verwalten der Produkte.
// Für jedes Produkt werden eigene Zielgruppen gebildet und Firmen getrennt bewertet.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { Loading } from '../components/Page'
import { Modal } from '../components/Modal'
import { Select } from '../components/Select'
import { useJumpTarget, useUi } from '../stores/ui'
import { useProduct } from '../stores/product'
import './products.css'

export interface Product {
  id: string
  name: string
  website: string | null
  description: string
  idealCustomer: string
  minEmployees: number | null
  _count: { cohorts: number; scores: number; prospects: number }
}

interface ProductForm {
  name: string
  website: string
  description: string
  idealCustomer: string
  minEmployees: string // als Text im Formular, leer = keine Grenze
}

const EMPTY_FORM: ProductForm = { name: '', website: '', description: '', idealCustomer: '', minEmployees: '' }

// Liste der Produkte, von mehreren Stellen genutzt
export function useProducts() {
  return useQuery({ queryKey: ['products'], queryFn: () => api.get<Product[]>('/api/products') })
}

export function ProductSwitcher() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { notify, confirm } = useUi()
  const { productId, setProductId } = useProduct()
  const productsQuery = useProducts()
  const products = productsQuery.data ?? []

  const [manageOpen, setManageOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)

  // Gespeicherte Wahl prüfen: gibt es das Produkt nicht mehr, das erste wählen.
  // Erst nach dem Neuladen der Liste prüfen, sonst würde ein gerade angelegtes
  // Produkt sofort wieder abgewählt.
  useEffect(() => {
    if (!productsQuery.data || productsQuery.isFetching) return
    if (!productId || !productsQuery.data.some((p) => p.id === productId)) {
      setProductId(productsQuery.data[0]?.id ?? null)
    }
  }, [productsQuery.data, productsQuery.isFetching, productId, setProductId])

  // Sprung aus der Suche: Produkt wählen und in der Produktverwaltung zum Bearbeiten öffnen
  useJumpTarget(
    ['products'],
    (jump) => {
      const product = productsQuery.data?.find((p) => p.id === jump.id)
      if (!product) {
        notify('error', t('search.notFound'))
        return
      }
      setProductId(product.id)
      openEdit(product)
      setManageOpen(true)
    },
    () => !!productsQuery.data && !productsQuery.isFetching,
  )

  function showError(err: unknown) {
    notify('error', err instanceof ApiError ? err.message : t('discovery.genericError'))
  }

  // Alles neu laden, was vom Produkt abhängt
  function refreshAll() {
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['cohorts'] })
    queryClient.invalidateQueries({ queryKey: ['cohortPreview'] })
    queryClient.invalidateQueries({ queryKey: ['discoveryCompanies'] })
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = {
        ...form,
        website: form.website.trim() || null,
        minEmployees: form.minEmployees.trim() ? Number(form.minEmployees.trim()) : null,
      }
      return editingId && editingId !== 'new'
        ? api.put<Product>(`/api/products/${editingId}`, body)
        : api.post<Product>('/api/products', body)
    },
    onSuccess: (saved) => {
      refreshAll()
      if (editingId === 'new') setProductId(saved.id)
      setEditingId(null)
      notify('success', t('products.saved'))
    },
    onError: showError,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/api/products/${id}`),
    onSuccess: () => {
      refreshAll()
      notify('success', t('products.deleted'))
    },
    onError: showError,
  })

  function openNew() {
    setForm(EMPTY_FORM)
    setEditingId('new')
    setManageOpen(true)
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name,
      website: p.website ?? '',
      description: p.description,
      idealCustomer: p.idealCustomer,
      minEmployees: p.minEmployees ? String(p.minEmployees) : '',
    })
    setEditingId(p.id)
  }

  async function handleDelete(p: Product) {
    const ok = await confirm({
      message: t('products.deleteConfirm', { name: p.name, scores: p._count.scores, prospects: p._count.prospects }),
      danger: true,
      confirmLabel: t('common.delete'),
    })
    if (ok) deleteMutation.mutate(p.id)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return notify('error', t('products.nameRequired'))
    if (form.description.trim().length < 20) return notify('error', t('products.descriptionRequired'))
    if (form.idealCustomer.trim().length < 20) return notify('error', t('products.idealRequired'))
    if (form.minEmployees.trim() && !/^[1-9]\d{0,5}$/.test(form.minEmployees.trim())) return notify('error', t('products.minEmployeesInvalid'))
    saveMutation.mutate()
  }

  function closeManage() {
    setManageOpen(false)
    setEditingId(null)
  }

  return (
    <>
      {/* Produktwahl */}
      <div className="product-bar" data-tour="product-bar">
        <Package size={16} className="text-tertiary" />
        <span className="product-bar-label">{t('products.forProduct')}</span>
        {productsQuery.isLoading ? (
          <span className="spinner" style={{ width: 14, height: 14 }} />
        ) : products.length === 0 ? (
          <button type="button" className="btn btn-sm btn-primary" onClick={openNew} data-tour="product-create-first">
            <Plus size={14} />
            {t('products.createFirst')}
          </button>
        ) : (
          <Select
            className="product-select"
            value={productId ?? ''}
            onChange={setProductId}
            aria-label={t('products.forProduct')}
            options={products.map((p) => ({ value: p.id, label: p.name }))}
          />
        )}
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          data-tour="product-manage"
          onClick={() => {
            // Zählungen frisch laden, sie ändern sich durch Bewertungen im Hintergrund
            void productsQuery.refetch()
            setManageOpen(true)
          }}
        >
          {t('products.manage')}
        </button>
      </div>

      {/* Produkte verwalten */}
      <Modal
        open={manageOpen}
        onClose={closeManage}
        title={editingId ? (editingId === 'new' ? t('products.new') : t('products.edit')) : t('products.title')}
        subtitle={editingId ? undefined : t('products.subtitle')}
        width={720}
        footer={
          editingId ? (
            <div className="flex items-center gap-2">
              <button className="btn btn-secondary" onClick={() => setEditingId(null)}>
                {t('common.cancel')}
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saveMutation.isPending} data-tour="product-save">
                {saveMutation.isPending && <span className="spinner" style={{ width: 16, height: 16 }} />}
                {t('common.save')}
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={openNew} data-tour="product-new">
              <Plus size={16} />
              {t('products.new')}
            </button>
          )
        }
      >
        {editingId ? (
          <form className="product-form" onSubmit={handleSave}>
            <div className="discovery-grid">
              <div className="field" data-tour="product-name">
                <label className="field-label" htmlFor="product-name">
                  {t('common.name')}
                </label>
                <input
                  id="product-name"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('products.namePlaceholder')}
                  autoFocus
                />
              </div>
              <div className="field" data-tour="product-website">
                <label className="field-label" htmlFor="product-website">
                  {t('products.website')}
                </label>
                <input
                  id="product-website"
                  className="input"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://"
                />
              </div>
            </div>
            <div className="field" data-tour="product-description">
              <label className="field-label" htmlFor="product-description">
                {t('ai.product')}
              </label>
              <textarea
                id="product-description"
                className="textarea"
                rows={7}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="field-hint">{t('ai.productHint')}</div>
            </div>
            <div className="field" data-tour="product-ideal">
              <label className="field-label" htmlFor="product-ideal">
                {t('ai.idealCustomer')}
              </label>
              <textarea
                id="product-ideal"
                className="textarea"
                rows={6}
                value={form.idealCustomer}
                onChange={(e) => setForm({ ...form, idealCustomer: e.target.value })}
              />
              <div className="field-hint">{t('ai.idealHint')}</div>
            </div>
            <div className="field product-min" data-tour="product-min">
              <label className="field-label" htmlFor="product-min">
                {t('products.minEmployees')}
              </label>
              <input
                id="product-min"
                className="input font-mono"
                inputMode="numeric"
                value={form.minEmployees}
                onChange={(e) => setForm({ ...form, minEmployees: e.target.value.replace(/[^\d]/g, '') })}
                placeholder={t('products.minEmployeesPlaceholder')}
              />
              <div className="field-hint">{t('products.minEmployeesHint')}</div>
            </div>
            <button type="submit" hidden />
          </form>
        ) : productsQuery.isLoading ? (
          <Loading />
        ) : products.length === 0 ? (
          <p className="text-tertiary">{t('products.empty')}</p>
        ) : (
          <ul className="product-list" data-tour="product-list">
            {products.map((p) => (
              <li key={p.id}>
                <div className="product-list-main">
                  <div className="product-list-name">{p.name}</div>
                  <div className="product-list-meta">
                    {p.website && <span>{p.website.replace(/^https?:\/\//, '')}</span>}
                    {p.minEmployees && <span>{t('products.minShort', { count: p.minEmployees })}</span>}
                    <span>{t('products.counts', { cohorts: p._count.cohorts, scores: p._count.scores })}</span>
                  </div>
                </div>
                <div className="data-row-actions">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => openEdit(p)}>
                    <Pencil size={14} />
                    {t('common.edit')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-icon btn-ghost btn-danger"
                    aria-label={t('common.delete')}
                    onClick={() => handleDelete(p)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  )
}
