const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit')

let PNG = null
try {
  ({ PNG } = require('pngjs'))
} catch {
  PNG = null
}

const COLORS = {
  ink: '#2B2B2B',
  text: '#1F2937',
  muted: '#6B7280',
  line: '#F0DFC6',
  light: '#FFF8EE',
  total: '#FCEBD0',
  accent: '#F79920',
  white: '#FFFFFF',
}

const LAYOUT = {
  margin: 36,
  headerShift: 36,
  infoRow: 22,
  payHeader: 24,
  payRow: 24,
  totalRow: 28,
}

const FONT_DIR = path.resolve(__dirname, '..', 'assets', 'fonts')

const DEFAULT_OPERATION_CENTER = 'Office No- B-07, H-32, Syadwad Business Park, Sector 63, Noida, Uttar Pradesh - 201301'

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

const logoCache = new Map()

const toPlain = (value) => value?.get ? value.get({ plain: true }) : value || {}
const cleanText = (value, fallback = '—') => {
  const text = String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ').trim()
  return text || fallback
}
const number = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
const amount = (value) => number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const dayCount = (value) => {
  const parsed = Number(value)
  if (value === null || value === undefined || value === '' || !Number.isFinite(parsed)) return '—'
  return Number.isInteger(parsed) ? String(parsed) : String(Number(parsed.toFixed(2)))
}
const displayWebsite = (value) => String(value ?? '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '')
const safeFilenamePart = (value) => cleanText(value, 'employee').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48) || 'employee'

function dateLabel(value) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(`${String(value).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const belowHundred = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`)

const belowThousand = (n) => {
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  return [hundreds ? `${ONES[hundreds]} Hundred` : '', rest ? belowHundred(rest) : ''].filter(Boolean).join(' ')
}

function integerToWords(n) {
  if (n === 0) return 'Zero'
  const crore = Math.floor(n / 10000000)
  const lakh = Math.floor(n / 100000) % 100
  const thousand = Math.floor(n / 1000) % 100
  const rest = n % 1000
  return [
    crore && `${belowThousand(crore)} Crore`,
    lakh && `${belowHundred(lakh)} Lakh`,
    thousand && `${belowHundred(thousand)} Thousand`,
    rest && belowThousand(rest),
  ].filter(Boolean).join(' ')
}

function amountInWords(value) {
  const total = Math.round(Math.max(0, number(value)) * 100)
  const rupees = Math.floor(total / 100)
  const paise = total % 100
  return `${integerToWords(rupees)} Rupees${paise ? ` and ${belowHundred(paise)} Paise` : ''} Only`
}

function resolveLocalLogo(logo) {
  if (!logo || /^https?:\/\//i.test(String(logo))) return null
  const backendRoot = path.resolve(__dirname, '..')
  const uploadsRoot = path.resolve(backendRoot, 'uploads')
  const relative = String(logo).replace(/\\/g, '/').replace(/^\/+/, '')
  if (!relative.startsWith('uploads/')) return null
  const candidate = path.resolve(backendRoot, relative)
  const relativeToUploads = path.relative(uploadsRoot, candidate)
  if (!relativeToUploads || relativeToUploads.startsWith('..') || path.isAbsolute(relativeToUploads)) return null
  if (!/\.(png|jpe?g)$/i.test(candidate)) return null
  try {
    const realUploadsRoot = fs.realpathSync(uploadsRoot)
    const realCandidate = fs.realpathSync(candidate)
    const realRelative = path.relative(realUploadsRoot, realCandidate)
    if (!realRelative || realRelative.startsWith('..') || path.isAbsolute(realRelative)) return null
    if (fs.lstatSync(candidate).isSymbolicLink()) return null
    return fs.statSync(candidate).isFile() ? candidate : null
  } catch {
    return null
  }
}

function prepareLogo(logoPath) {
  const original = { source: logoPath, trimmed: false }
  if (!PNG || !/\.png$/i.test(logoPath)) return original
  try {
    const key = `${logoPath}:${fs.statSync(logoPath).mtimeMs}`
    if (logoCache.has(key)) return logoCache.get(key)

    const png = PNG.sync.read(fs.readFileSync(logoPath))
    const { width, height, data } = png
    let minX = width
    let minY = height
    let maxX = -1
    let maxY = -1
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (width * y + x) << 2
        const visible = data[index + 3] > 10
        const white = data[index] > 245 && data[index + 1] > 245 && data[index + 2] > 245
        if (visible && !white) {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }
    if (maxX < minX || maxY < minY) return original

    const cropWidth = maxX - minX + 1
    const cropHeight = maxY - minY + 1
    const cropped = new PNG({ width: cropWidth, height: cropHeight })
    PNG.bitblt(png, cropped, minX, minY, cropWidth, cropHeight, 0, 0)

    const result = { source: PNG.sync.write(cropped), trimmed: true }
    if (logoCache.size >= 20) logoCache.clear()
    logoCache.set(key, result)
    return result
  } catch {
    return original
  }
}

function setupFonts(doc) {
  const regularPath = path.join(FONT_DIR, 'DejaVuSans.ttf')
  const boldPath = path.join(FONT_DIR, 'DejaVuSans-Bold.ttf')
  if (fs.existsSync(regularPath) && fs.existsSync(boldPath)) {
    doc.registerFont('SlipRegular', regularPath)
    doc.registerFont('SlipBold', boldPath)
    return { regular: 'SlipRegular', bold: 'SlipBold', rupee: '₹' }
  }
  return { regular: 'Helvetica', bold: 'Helvetica-Bold', rupee: 'INR' }
}

function fit(doc, text, width, font, size) {
  doc.font(font).fontSize(size)
  let value = cleanText(text)
  if (doc.widthOfString(value) <= width) return value
  while (value.length > 1 && doc.widthOfString(`${value}…`) > width) value = value.slice(0, -1)
  return `${value}…`
}

function put(doc, text, x, y, { font, size, color, width, align = 'left', wrap = false, lineGap = 0 }) {
  doc.font(font).fontSize(size).fillColor(color)
  doc.text(text, x, y, { width, align, lineBreak: wrap, lineGap, baseline: 'alphabetic' })
}

function drawInfoTable(doc, fonts, x, y, width, rows) {
  const half = width / 2
  const height = LAYOUT.infoRow * rows.length
  const valueX = 105
  const valueWidth = half - valueX - 10

  doc.save().rect(x, y, width, height).lineWidth(0.6).fillAndStroke(COLORS.light, COLORS.line).restore()
  doc.save().lineWidth(0.6).strokeColor(COLORS.line)
  rows.forEach((_, index) => {
    if (index) doc.moveTo(x, y + LAYOUT.infoRow * index).lineTo(x + width, y + LAYOUT.infoRow * index).stroke()
  })
  doc.moveTo(x + half, y).lineTo(x + half, y + height).stroke()
  doc.restore()

  rows.forEach((row, index) => {
    const baseline = y + LAYOUT.infoRow * (index + 1) - 7.5
    ;[row.slice(0, 2), row.slice(2, 4)].forEach(([label, value], column) => {
      if (!label) return
      const cellX = x + column * half
      put(doc, cleanText(label), cellX + 10, baseline, { font: fonts.bold, size: 8.5, color: COLORS.muted })
      put(doc, fit(doc, value, valueWidth, fonts.regular, 9), cellX + valueX, baseline, { font: fonts.regular, size: 9, color: COLORS.text, width: valueWidth, align: 'right' })
    })
  })
}

function drawPayTable(doc, fonts, x, y, width, title, items, rowCount) {
  doc.save().rect(x, y, width, LAYOUT.payHeader).fill(COLORS.ink).restore()
  put(doc, title.toUpperCase(), x + 10, y + 16, { font: fonts.bold, size: 9, color: COLORS.white })
  put(doc, `AMOUNT (${fonts.rupee})`, x + 10, y + 16, { font: fonts.bold, size: 9, color: COLORS.white, width: width - 20, align: 'right' })

  for (let index = 0; index < rowCount; index += 1) {
    const rowY = y + LAYOUT.payHeader + LAYOUT.payRow * index
    if (index % 2 === 0) doc.save().rect(x, rowY, width, LAYOUT.payRow).fill(COLORS.light).restore()
    const item = items[index]
    if (!item) continue
    put(doc, fit(doc, item[0], width - 130, fonts.regular, 9), x + 10, rowY + 16, { font: fonts.regular, size: 9, color: COLORS.text })
    put(doc, amount(item[1]), x + 10, rowY + 16, { font: fonts.regular, size: 9, color: COLORS.text, width: width - 20, align: 'right' })
  }
  return y + LAYOUT.payHeader + LAYOUT.payRow * rowCount
}

function drawTotal(doc, fonts, x, y, width, label, value) {
  doc.save().rect(x, y, width, LAYOUT.totalRow).fill(COLORS.total).restore()
  doc.save().moveTo(x, y).lineTo(x + width, y).lineWidth(1.2).strokeColor(COLORS.ink).stroke().restore()
  put(doc, label, x + 10, y + 19, { font: fonts.bold, size: 10, color: COLORS.ink })
  put(doc, amount(value), x + 10, y + 19, { font: fonts.bold, size: 10, color: COLORS.ink, width: width - 20, align: 'right' })
}

function renderSalarySlip(doc, payroll, employee, company) {
  const fonts = setupFonts(doc)
  const M = LAYOUT.margin
  const S = LAYOUT.headerShift
  const W = doc.page.width
  const H = doc.page.height
  const CW = W - M * 2
  const year = Number(payroll.year)
  const month = Number(payroll.month)
  const monthName = new Date(year, month - 1, 1).toLocaleString('en', { month: 'long' })
  const companyName = cleanText(company.company_name, 'HRMS')
  const logoPath = resolveLocalLogo(company.logo)
  const kyc = employee.kyc || {}

  const contactLabelX = W - M - 165
  const contactValueX = W - M - 125
  const logoWidth = contactLabelX - M - 10

  let logoDrawn = false
  if (logoPath) {
    try {
      const logo = prepareLogo(logoPath)
      const box = logo.trimmed ? { y: 8, width: logoWidth, height: 120 } : { y: 6, width: logoWidth, height: 124 }
      doc.image(logo.source, M, box.y, { fit: [box.width, box.height], align: 'left', valign: 'center' })
      logoDrawn = true
    } catch {
      logoDrawn = false
    }
  }
  if (!logoDrawn) {
    put(doc, fit(doc, companyName, logoWidth, fonts.bold, 16), M, 64 + S / 2, { font: fonts.bold, size: 16, color: COLORS.ink })
  }

  const contactRows = [
    ['CIN No:', company.cin_number],
    ['Email:', company.email],
    ['Web:', displayWebsite(company.website)],
  ].filter(([, value]) => value)
  contactRows.forEach(([label, value], index) => {
    const baseline = 41 + S / 2 + index * 14
    put(doc, label, contactLabelX, baseline, { font: fonts.bold, size: 8, color: COLORS.ink })
    put(doc, fit(doc, value, 125, fonts.regular, 8), contactValueX, baseline, { font: fonts.regular, size: 8, color: COLORS.ink })
  })

  doc.save().moveTo(M, 100 + S).lineTo(W - M, 100 + S).lineWidth(2).strokeColor(COLORS.accent).stroke().restore()

  doc.save().rect(M, 110 + S, CW, 28).fill(COLORS.ink).restore()
  doc.save().rect(M, 110 + S, 6, 28).fill(COLORS.accent).restore()
  put(doc, `PAYSLIP FOR THE MONTH OF ${monthName.toUpperCase()} ${year}`, M, 128 + S, { font: fonts.bold, size: 11, color: COLORS.white, width: CW, align: 'center' })

  put(doc, 'EMPLOYEE DETAILS', M, 166 + S, { font: fonts.bold, size: 9, color: COLORS.ink })
  doc.save().moveTo(M, 171 + S).lineTo(M + 95, 171 + S).lineWidth(1.5).strokeColor(COLORS.accent).stroke().restore()

  if (payroll.salary_revision?.effective_from) {
    const badgeWidth = 250
    const badgeX = W - M - badgeWidth
    doc.save().roundedRect(badgeX, 153 + S, badgeWidth, 18, 4).fill(COLORS.total).restore()
    put(doc, `REVISED SALARY  ·  EFFECTIVE ${dateLabel(payroll.salary_revision.effective_from).toUpperCase()}`, badgeX, 165 + S, { font: fonts.bold, size: 7, color: COLORS.ink, width: badgeWidth, align: 'center' })
  }

  const infoRows = [
    ['Employee ID', employee.employee_id, 'Employee Name', employee.name],
    ['Department', employee.department, 'Designation', employee.designation],
    ['Date of Joining', dateLabel(employee.date_of_joining), 'Location', employee.location],
    ['Working Days', dayCount(payroll.working_days), 'Paid Days', dayCount(payroll.present_days)],
    ['LOP Days', dayCount(payroll.absent_days), 'Bank Name', kyc.bank_name],
    ['Tax Regime', 'Not specified', 'Account No.', kyc.bank_account],
    ['UAN No.', kyc.uan_pf, 'PF No.', '—'],
    // ['PAN', kyc.pan, 'IFSC Code', kyc.ifsc],
    // ['PAN', kyc.pan],
  ]
  const infoTop = 180 + S
  drawInfoTable(doc, fonts, M, infoTop, CW, infoRows)

  const earnings = [
    ['Basic Salary', payroll.basic],
    ['HRA', payroll.hra],
    ['CCA / Conveyance', payroll.conveyance],
    ['Special Allowance', payroll.special_allowance],
    ['Medical Allowance', payroll.medical_allowance],
    ['Fixed Bonus', payroll.fixed_bonus],
    ['Bonus', payroll.bonus],
    ['Overtime', payroll.overtime_amount],
  ]
  const deductions = [
    ['Provident Fund', payroll.pf_deduction],
    ['Tax / Professional Tax', payroll.tax_deduction],
    ['ESI', payroll.esi_deduction],
    ['Other Deductions', payroll.other_deduction],
  ]

  const tableTop = infoTop + LAYOUT.infoRow * infoRows.length + 16
  const tableWidth = CW / 2 - 6
  const leftX = M
  const rightX = M + CW / 2 + 6
  const rowCount = Math.max(earnings.length, deductions.length)
  const tableBottom = drawPayTable(doc, fonts, leftX, tableTop, tableWidth, 'Earnings', earnings, rowCount)
  drawPayTable(doc, fonts, rightX, tableTop, tableWidth, 'Deductions', deductions, rowCount)

  const calculatedGross = earnings.reduce((sum, [, value]) => sum + number(value), 0)
  const gross = number(payroll.gross_salary) || calculatedGross
  const totalDeductions = number(payroll.total_deduction) || deductions.reduce((sum, [, value]) => sum + number(value), 0)
  const netPay = number(payroll.net_salary) || Math.max(0, gross - totalDeductions)

  drawTotal(doc, fonts, leftX, tableBottom, tableWidth, 'Gross Earnings', gross)
  drawTotal(doc, fonts, rightX, tableBottom, tableWidth, 'Total Deductions', totalDeductions)

  const netTop = tableBottom + LAYOUT.totalRow + 14
  doc.save().roundedRect(M, netTop, CW, 48, 6).fill(COLORS.accent).restore()
  doc.save().rect(M, netTop, 6, 48).fill(COLORS.ink).restore()
  put(doc, 'NET PAY ', M + 20, netTop + 19, { font: fonts.bold, size: 8.5, color: COLORS.ink })
  put(doc, amountInWords(netPay), M + 20, netTop + 35, { font: fonts.regular, size: 8.5, color: COLORS.ink })
  put(doc, `${fonts.rupee} ${amount(netPay)}`, M + 20, netTop + 33, { font: fonts.bold, size: 20, color: COLORS.ink, width: CW - 38, align: 'right' })

  const noteY = netTop + 74
  const contactMail = company.email ? cleanText(company.email) : 'the company'
  put(doc, 'This is a computer-generated salary slip and does not require a signature.', M, noteY, { font: fonts.regular, size: 8, color: COLORS.muted })
  put(doc, `This document contains confidential information. If received in error, please notify ${contactMail} and destroy all copies.`, M, noteY + 12, { font: fonts.regular, size: 8, color: COLORS.muted, width: CW, wrap: true, lineGap: 2 })

  const address = [company.address, company.city, company.state, company.pincode, company.country]
    .filter(Boolean)
    .map((value) => cleanText(value, ''))
    .filter(Boolean)
    .join(', ')
  const operationCenter = cleanText(company.operation_center, DEFAULT_OPERATION_CENTER)

  doc.save().rect(0, H - 48, W, 2).fill(COLORS.accent).restore()
  put(doc, 'Registered Address:', M, H - 30, { font: fonts.bold, size: 7.5, color: COLORS.ink })
  put(doc, fit(doc, address || 'Address not provided', CW - 100, fonts.regular, 7.5), M + 100, H - 30, { font: fonts.regular, size: 7.5, color: COLORS.text })
  put(doc, 'Operation Center:', M, H - 18, { font: fonts.bold, size: 7.5, color: COLORS.ink })
  put(doc, fit(doc, operationCenter, CW - 100, fonts.regular, 7.5), M + 100, H - 18, { font: fonts.regular, size: 7.5, color: COLORS.text })
}

function sendSalarySlipPdf(res, payrollRecord) {
  const payroll = toPlain(payrollRecord)
  const employee = toPlain(payroll.employee)
  const company = toPlain(payroll.company)
  if (!payroll.id || !employee.id || !company.id) {
    throw new Error('Required salary slip relations are unavailable.')
  }

  const filename = `SalarySlip_${safeFilenamePart(employee.employee_id)}_${Number(payroll.month)}_${Number(payroll.year)}.pdf`
  const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: 'Salary Slip', Author: cleanText(company.company_name, 'HRMS') } })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.setHeader('Cache-Control', 'private, no-store, max-age=0')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('X-Content-Type-Options', 'nosniff')

  doc.on('error', (error) => {
    console.error('Salary slip PDF stream error:', error)
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Unable to generate the salary slip.' })
    else res.destroy(error)
  })
  doc.pipe(res)
  renderSalarySlip(doc, payroll, employee, company)
  doc.end()
}

module.exports = sendSalarySlipPdf