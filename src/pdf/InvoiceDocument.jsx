import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { formatAmountInWords } from '../utils/amountInWords'
import {
  INVOICE_AUTHORIZED_SIGNATURES_LABEL,
  INVOICE_ENQUIRY_FOOTER,
} from '../utils/invoiceDocumentCopy'
import { formatMoney, invoiceSubtotal, invoiceTotal, lineTotal } from '../utils/invoiceMath'

const styles = StyleSheet.create({
  page: {
    padding: 36,
    paddingBottom: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8',
  },
  headerLeft: { flexDirection: 'row', flex: 1, gap: 10, paddingRight: 12 },
  logo: { width: 56, height: 56, objectFit: 'contain' },
  companyName: { fontSize: 12, fontWeight: 'bold', marginBottom: 3 },
  headerRight: { alignItems: 'flex-end', minWidth: 140 },
  invoiceTitle: { fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  metaLine: { flexDirection: 'row', gap: 6, marginTop: 4, fontSize: 9 },
  metaLabel: { color: '#64748b' },
  metaValue: { fontWeight: 'bold' },
  parties: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  partyCol: { flex: 1 },
  partyHeading: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 3,
    marginBottom: 8,
    color: '#334155',
  },
  partyName: { fontSize: 10, fontWeight: 'bold', marginBottom: 3 },
  line: { lineHeight: 1.4, color: '#475569', marginBottom: 2, fontSize: 9 },
  table: { borderWidth: 1, borderColor: '#94a3b8' },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8',
    paddingVertical: 6,
    paddingHorizontal: 5,
  },
  tableHeadText: { fontSize: 7, fontWeight: 'bold', color: '#334155', textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  colNum: { width: '6%' },
  colDesc: { width: '40%' },
  colQty: { width: '10%', textAlign: 'right' },
  colRate: { width: '22%', textAlign: 'right' },
  colAmt: { width: '22%', textAlign: 'right' },
  lineDescRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lineThumb: { width: 22, height: 22, objectFit: 'cover' },
  lineName: { flex: 1, fontSize: 9 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 16,
  },
  wordsCol: { flex: 1, paddingRight: 8 },
  wordsLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: 4,
  },
  wordsText: { fontSize: 9, fontWeight: 'bold', lineHeight: 1.45 },
  totalsBox: { width: 180 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  totalGrand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#0f172a',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bankBox: {
    marginTop: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bankTitle: { fontSize: 7, fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' },
  notes: { marginTop: 8, fontSize: 8, color: '#64748b', lineHeight: 1.4 },
  footer: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#94a3b8',
    backgroundColor: '#f8fafc',
    padding: 10,
    marginHorizontal: -36,
    marginBottom: -40,
    paddingBottom: 14,
    paddingHorizontal: 36,
  },
  footerTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  signatureImg: { height: 40, width: 110, objectFit: 'contain', marginTop: 6, marginBottom: 4 },
  footerAuthLabel: { fontSize: 8, fontWeight: 'bold', marginTop: 4, color: '#334155' },
  footerLine: { fontSize: 7, color: '#64748b', lineHeight: 1.45, marginTop: 6 },
})

function formatDisplayDate(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString()
}

function PartyBlock({ title, party }) {
  if (!party?.name) {
    return (
      <View style={styles.partyCol}>
        <Text style={styles.partyHeading}>{title}</Text>
        <Text style={styles.line}>—</Text>
      </View>
    )
  }
  return (
    <View style={styles.partyCol}>
      <Text style={styles.partyHeading}>{title}</Text>
      <Text style={styles.partyName}>{party.name}</Text>
      {party.address ? <Text style={styles.line}>{party.address}</Text> : null}
      {party.phone ? <Text style={styles.line}>{party.phone}</Text> : null}
      {party.email ? <Text style={styles.line}>{party.email}</Text> : null}
    </View>
  )
}

function BankDetails({ company }) {
  const rows = [
    company?.bankName ? ['Bank', company.bankName] : null,
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
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {company?.logoDataUrl ? <Image src={company.logoDataUrl} style={styles.logo} /> : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.companyName}>{company?.name ?? '—'}</Text>
              {company?.address ? <Text style={styles.line}>{company.address}</Text> : null}
              {company?.phone ? <Text style={styles.line}>{company.phone}</Text> : null}
              {company?.email ? <Text style={styles.line}>{company.email}</Text> : null}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.metaLine}>
              <Text style={styles.metaLabel}>Invoice #</Text>
              <Text style={styles.metaValue}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.metaLine}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{invoiceDate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.parties}>
          <PartyBlock title="Billed by" party={company} />
          <PartyBlock title="Billed to" party={customer} />
        </View>

        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.tableHeadText, styles.colNum]}>S.No</Text>
            <Text style={[styles.tableHeadText, styles.colDesc]}>Item</Text>
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

        <View style={styles.summaryRow}>
          <View style={styles.wordsCol}>
            <Text style={styles.wordsLabel}>Amount in words</Text>
            <Text style={styles.wordsText}>{formatAmountInWords(total)}</Text>
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

        <BankDetails company={company} />
        {invoice.notes ? <Text style={styles.notes}>{invoice.notes}</Text> : null}

        <View style={styles.footer}>
          {company?.signatureDataUrl ? (
            <Image src={company.signatureDataUrl} style={styles.signatureImg} />
          ) : (
            <View style={{ height: 28 }} />
          )}
          <Text style={styles.footerAuthLabel}>{INVOICE_AUTHORIZED_SIGNATURES_LABEL}</Text>
          <Text style={styles.footerLine}>{INVOICE_ENQUIRY_FOOTER}</Text>
        </View>
      </Page>
    </Document>
  )
}
