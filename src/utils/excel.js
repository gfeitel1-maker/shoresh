// src/utils/excel.js
import ExcelJS from 'exceljs'

/** Coerce an ExcelJS cell value to a plain JS primitive */
function cellVal(v) {
  if (v == null) return ''
  if (v instanceof Date) return v
  if (typeof v === 'object') {
    if (Array.isArray(v.richText)) return v.richText.map(r => r.text).join('')
    if (v.result != null) return v.result
    return String(v)
  }
  return v
}

/**
 * Read the first sheet of an ArrayBuffer and return an array of row objects
 * keyed by the header row -- matches XLSX.utils.sheet_to_json(ws, { defval: '' })
 */
export async function readSheetRows(buffer) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)
  const ws = wb.worksheets[0]
  if (!ws) return []

  const headers = []
  const rows = []

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.values.forEach((v, i) => { headers[i] = v != null ? String(v).trim() : '' })
    } else {
      const obj = {}
      headers.forEach((h, i) => { if (h) obj[h] = cellVal(row.values[i]) })
      if (Object.values(obj).some(v => v !== '')) rows.push(obj)
    }
  })
  return rows
}

/**
 * Build and trigger a browser download of an xlsx file.
 * sheets: Array<{ name: string, rows: any[][], colWidths?: number[] }>
 */
export async function downloadXlsx(sheets, filename) {
  const wb = new ExcelJS.Workbook()
  for (const { name, rows, colWidths } of sheets) {
    const ws = wb.addWorksheet(name)
    ws.addRows(rows)
    if (colWidths) colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w })
  }
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}
