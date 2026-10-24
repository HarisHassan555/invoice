import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { formatMoney, invoiceSubtotal, invoiceTotal, lineTotal } from '../utils/invoiceMath'

const styles = StyleSheet.create({
  page: {
    padding: 36,
    paddingBottom: 48,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#0f172a',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleBlock: { flex: 1 },
  title: { fontSize: 26, fontWeight: 'bold', letterSpacing: 1 },
  logo: { width: 96, height: 64, objectFit: 'contain', objectPosition: 'right' },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  metaItem: { minWidth: 120 },
  metaLabel: { fontSize: 7, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 },
  metaValue: { fontSize: 10, fontWeight: 'bold' },
  parties: { flexDirection: 'row', gap: 24, marginTop: 18, marginBottom: 16 },
  partyCol: { flex: 1 },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#334155',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  partyName: { fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  line: { lineHeight: 1.45, color: '#475569', marginBottom: 2 },
  table: { marginTop: 4 },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
  },
  tableHeadText: { fontSize: 8, fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  colNum: { width: '5%' },
  colDesc: { width: '38%' },
  colQty: { width: '10%', textAlign: 'right' },
  colRate: { width: '22%', textAlign: 'right' },
  colAmt: { width: '25%', textAlign: 'right' },
  lineDescRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lineThumb: { width: 28, height: 28, objectFit: 'cover', borderRadius: 2 },
  lineName: { flex: 1, fontSize: 9 },
  bottom: { flexDirection: 'row', marginTop: 16, gap: 20 },
  bottomLeft: { flex: 1 },
  totalsBox: { width: 200, marginLeft: 'auto' },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalGrand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#0f172a',
    fontSize: 11,
    fontWeight: 'bold',
  },
  bankBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bankTitle: { fontSize: 8, fontWeight: 'bold', marginBottom: 6, textTransform: 'uppercase' },
  footer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signatureBlock: { alignItems: 'flex-start' },
  signatureImg: { height: 48, width: 120, objectFit: 'contain', marginBottom: 4 },
  signatureLine: { borderTopWidth: 1, borderTopColor: '#94a3b8', width: 160, paddingTop: 4 },
  notes: { marginTop: 10, fontSize: 8, color: '#64748b', lineHeight: 1.4 },
})

function formatDisplayDate(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString()
}

function PartyLines({ party, isCompany }) {
  if (!party?.name) return <Text style={styles.line}>—</Text>
  return (
    <>
      <Text style={styles.partyName}>{party.name}</Text>
      {party.address ? <Text style={styles.line}>{party.address}</Text> : null}
      {party.phone ? <Text style={styles.line}>Tel: {party.phone}</Text> : null}
      {party.email ? <Text style={styles.line}>{party.email}</Text> : null}
      {isCompany && party.website ? <Text style={styles.line}>{party.website}</Text> : null}
      {isCompany && party.taxId ? <Text style={styles.line}>Tax ID: {party.taxId}</Text> : null}
    </>
  )
}

function BankDetails({ company }) {
  const rows = [
    company?.bankName ? ['Bank name', company.bankName] : null,
    company?.accountHolder ? ['Account name', company.accountHolder] : null,
    company?.accountNumber ? ['Account no.', company.accountNumber] : null,
  ].filter(Boolean)

  if (!rows.length) return null

  return (
    <View style={styles.bankBox}>
      <Text style={styles.bankTitle}>Payment details</Text>
      {rows.map(([label, value]) => (
        <Text key={label} style={styles.line}>
          {label}: {value}
        </Text>
      ))}
    </View>
  )
}

export default function InvoiceDocument({ invoice, company, customer }) {
  const sub = invoiceSubtotal(invoice.lineItems)
  const discount = Number(invoice.additionalDiscount) || 0
  const total = invoiceTotal(invoice.lineItems, discount)
  const invoiceDate = invoice.invoiceDate
    ? formatDisplayDate(invoice.invoiceDate)
    : new Date(invoice.createdAt).toLocaleDateString()

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>INVOICE</Text>
          </View>
          {company?.logoDataUrl ? (
            <Image src={company.logoDataUrl} style={styles.logo} />
          ) : (
            <View style={{ width: 96, height: 64 }} />
          )}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Invoice number</Text>
            <Text style={styles.metaValue}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Invoice date</Text>
            <Text style={styles.metaValue}>{invoiceDate}</Text>
          </View>
        </View>

        <View style={styles.parties}>
          <View style={styles.partyCol}>
            <Text style={styles.sectionTitle}>From</Text>
            <PartyLines party={company} isCompany />
          </View>
          <View style={styles.partyCol}>
            <Text style={styles.sectionTitle}>Bill to</Text>
            <PartyLines party={customer} isCompany={false} />
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.tableHeadText, styles.colNum]}>#</Text>
            <Text style={[styles.tableHeadText, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeadText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeadText, styles.colRate]}>Rate</Text>
            <Text style={[styles.tableHeadText, styles.colAmt]}>Amount</Text>
          </View>
          {invoice.lineItems.map((line, index) => (
            <View key={line.lineId ?? line.productId ?? index} style={styles.tableRow}>
              <Text style={styles.colNum}>{index + 1}</Text>
              <View style={[styles.colDesc, styles.lineDescRow]}>
                {line.imageDataUrl ? (
                  <Image src={line.imageDataUrl} style={styles.lineThumb} />
                ) : null}
                <Text style={styles.lineName}>{line.productName}</Text>
              </View>
              <Text style={styles.colQty}>{line.quantity}</Text>
              <Text style={styles.colRate}>{formatMoney(Number(line.unitPrice))}</Text>
              <Text style={styles.colAmt}>{formatMoney(lineTotal(line))}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottom}>
          <View style={styles.bottomLeft}>
            <BankDetails company={company} />
            {invoice.notes ? <Text style={styles.notes}>{invoice.notes}</Text> : null}
          </View>
          <View style={styles.totalsBox}>
            <View style={styles.totalLine}>
              <Text>Subtotal</Text>
              <Text>{formatMoney(sub)}</Text>
            </View>
            {discount > 0 ? (
              <View style={styles.totalLine}>
                <Text>Discount</Text>
                <Text>-{formatMoney(discount)}</Text>
              </View>
            ) : null}
            <View style={[styles.totalLine, styles.totalGrand]}>
              <Text>Amount</Text>
              <Text>{formatMoney(total)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View />
          <View style={styles.signatureBlock}>
            {company?.signatureDataUrl ? (
              <Image src={company.signatureDataUrl} style={styles.signatureImg} />
            ) : (
              <View style={{ height: 48 }} />
            )}
            <View style={styles.signatureLine}>
              <Text style={{ fontSize: 8, color: '#64748b' }}>Authorized signature</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
