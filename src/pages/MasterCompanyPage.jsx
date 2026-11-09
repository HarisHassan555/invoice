import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CompanyFormFields from '../components/CompanyFormFields'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import { addCompany, removeCompany, updateCompany } from '../store/slices/companiesSlice'
import { companyPhonesForForm, emptyCompany, finalizeCompanyFields, normalizeCompanyPhones } from '../utils/companyFields'
import { confirmDelete, deleteAndSync } from '../utils/confirmDelete'

export default function MasterCompanyPage() {
  const dispatch = useDispatch()
  const items = useSelector((s) => s.companies.items)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [values, setValues] = useState(emptyCompany)

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setValues(emptyCompany)
  }

  const openCreate = () => {
    setEditingId(null)
    setValues(emptyCompany)
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setValues({
      ...emptyCompany,
      ...row,
      phones: companyPhonesForForm(row),
    })
    setModalOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Company"
        description="Business details, bank information, logo, and signature for invoice PDFs."
        action={
          <button type="button" onClick={openCreate} className="btn-primary">
            Add company
          </button>
        }
      />
      <DataTable
        emptyMessage="No companies yet. Click Add company to create one."
        rows={items}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          {
            key: 'phones',
            label: 'Phone',
            render: (row) => normalizeCompanyPhones(row).join(' · ') || '—',
          },
          { key: 'bankName', label: 'Bank' },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => openEdit(row)}
                  className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      !confirmDelete(
                        `Delete company "${row.name}" permanently? This cannot be undone.`,
                      )
                    ) {
                      return
                    }
                    void deleteAndSync(removeCompany(row.id))
                  }}
                  className="text-sm text-red-600 hover:text-red-800 dark:text-red-400"
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
      />

      <Modal open={modalOpen} title={editingId ? 'Edit company' : 'Add company'} onClose={closeModal}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const payload = finalizeCompanyFields(values)
            if (editingId) {
              dispatch(updateCompany({ id: editingId, ...payload }))
            } else {
              dispatch(addCompany(payload))
            }
            closeModal()
          }}
          className="space-y-4"
        >
          <CompanyFormFields values={values} onChange={setValues} showInvoiceTextDefaults />
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
            <button type="button" onClick={closeModal} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!values.name?.trim()}>
              Save company
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
