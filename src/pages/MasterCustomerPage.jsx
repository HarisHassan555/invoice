import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import DataTable from '../components/DataTable'
import MasterDataForm from '../components/MasterDataForm'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import { addCustomer, removeCustomer } from '../store/slices/customersSlice'

const FIELDS = [
  { name: 'name', label: 'Customer name', required: true },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone' },
  { name: 'address', label: 'Address', type: 'textarea', fullWidth: true },
]

const empty = { name: '', email: '', phone: '', address: '' }

export default function MasterCustomerPage() {
  const dispatch = useDispatch()
  const items = useSelector((s) => s.customers.items)
  const [modalOpen, setModalOpen] = useState(false)
  const [values, setValues] = useState(empty)

  const onChange = (name, value) => setValues((v) => ({ ...v, [name]: value }))

  const closeModal = () => {
    setModalOpen(false)
    setValues(empty)
  }

  return (
    <div>
      <PageHeader
        title="Customer"
        description="Clients you bill — select them when creating an invoice."
        action={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-primary"
          >
            Add customer
          </button>
        }
      />
      <DataTable
        emptyMessage="No customers yet. Click Add customer to create one."
        rows={items}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <button
                type="button"
                onClick={() => dispatch(removeCustomer(row.id))}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            ),
          },
        ]}
      />

      <Modal open={modalOpen} title="Add customer" onClose={closeModal}>
        <MasterDataForm
          fields={FIELDS}
          values={values}
          onChange={onChange}
          submitLabel="Save customer"
          onCancel={closeModal}
          onSubmit={() => {
            dispatch(addCustomer(values))
            closeModal()
          }}
        />
      </Modal>
    </div>
  )
}
