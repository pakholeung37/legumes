import { Drawing } from './type'

export function export_svg(
  dr: Drawing,
  { background = 'white' }: { background?: string } = {},
): string {
  let o: string = `<svg xmlns="http://www.w3.org/2000/svg" width="${dr.w}" height="${dr.h}">`
  if (background) {
    o += `<rect x="0" y="0" width="${dr.w}" height="${dr.h}" fill="${background}"></rect>`
  }
  o += `<path stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" d="`
  for (let i = 0; i < dr.polylines.length; i++) {
    o += 'M '
    for (let j = 0; j < dr.polylines[i].length; j++) {
      o += dr.polylines[i][j] + ' '
    }
  }
  o += `"/>`
  o += `</svg>`
  return o
}

export function export_animated_svg(
  dr: Drawing,
  {
    background = 'white',
    speed = 0.001,
  }: { background?: string; speed?: number } = {},
): string {
  let width = dr.w
  let height = dr.h
  let polylines = dr.polylines
  let o: string = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`
  if (background) {
    o += `<rect x="0" y="0" width="${dr.w}" height="${dr.h}" fill="${background}"></rect>`
  }
  let lengths: number[] = []
  let acc_lengths: number[] = []
  let total_l = 0
  for (let i = 0; i < polylines.length; i++) {
    let l = 0
    for (let j = 1; j < polylines[i].length; j++) {
      l += Math.hypot(
        polylines[i][j - 1][0] - polylines[i][j][0],
        polylines[i][j - 1][1] - polylines[i][j][1],
      )
    }

    lengths.push(l)
    acc_lengths.push(total_l)
    total_l += l
  }

  for (let i = 0; i < polylines.length; i++) {
    let l = lengths[i]
    o += `
    <path
      stroke="black"
      stroke-width="1.5"
      fill="none"
      stroke-dasharray="${l}"
      stroke-dashoffset="${l}"
      d="M`
    for (let j = 0; j < polylines[i].length; j++) {
      o += polylines[i][j] + ' '
    }
    let t = speed * l
    o += `">
    <animate id="a${i}"
      attributeName="stroke-dashoffset"
      fill="freeze"
      from="${l}" to="${0}" dur="${t}s"
      begin="${acc_lengths[i] * speed}s;a${i}.end+${1 + speed * total_l}s"/>
    />
    <animate id="b${i}"
      attributeName="stroke-dashoffset"
      fill="freeze"
      from="${0}" to="${l}" dur="${1}s"
      begin="${speed * total_l}s;b${i}.end+${speed * total_l}s"/>
    />
    </path>`
  }
  //begin="${i}s;a${i}.end+${polylines.length-i}s" />
  o += `</svg>`
  return o
}

export function export_mock_svg(dr: Drawing): string {
  let width = dr.w
  let height = dr.h
  let elements = dr.elements
  let o: string = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`
  for (let i = 0; i < elements.length; i++) {
    let elt = elements[i]
    let { tag, x, y, w, h } = elt
    if (tag == 'note_head') {
      if (elt.stem_dir < 0) {
        if (elt.twisted) {
          o += `<rect x="${x}" y="${y - 2}" width="${10}" height="${4}" fill="blue"/>`
        } else {
          o += `<rect x="${x - 10}" y="${y - 2}" width="${10}" height="${4}" fill="blue"/>`
        }
      } else {
        if (!elt.twisted) {
          o += `<rect x="${x}" y="${y - 2}" width="${10}" height="${4}" fill="blue"/>`
        } else {
          o += `<rect x="${x - 10}" y="${y - 2}" width="${10}" height="${4}" fill="blue"/>`
        }
      }
      o += `<text x="${x}" y="${y}" font-size="8" fill="red">${elt.duration}</text>`
    } else if (tag == 'rest') {
      o += `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" fill="rgba(0,255,0,0.2)" stroke="black"/>`
      o += `<text x="${x - w / 2}" y="${y - h / 2}" font-size="8">${elt.duration}</text>`
    } else if (tag == 'accidental' || tag == 'clef' || tag == 'timesig_digit') {
      o += `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" fill="rgba(255,255,0,0.2)" stroke="black"/>`
    } else if (tag == 'beam') {
      o += `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}" stroke="brown" stroke-width="3"/>`
    } else if (tag == 'line') {
      o += `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}" stroke="black"/>`
    } else if (tag == 'dbg') {
      o += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${elt.color}" opacity="0.1"/>`
    } else {
      o += `<rect x="${x}" y="${y}" width="${w || 1}" height="${h || 1}" fill="rgba(0,0,0,0.2)" stroke="black"/>`
      o += `<text x="${x}" y="${y}" font-size="5">${tag}</text>`
    }
    //
  }
  o += `</svg>`
  return o
}

export function export_pdf(dr: Drawing): string {
  let width = dr.w
  let height = dr.h
  let polylines = dr.polylines
  var head = `%PDF-1.1\n%%¥±ë\n1 0 obj\n<< /Type /Catalog\n/Pages 2 0 R\n>>endobj
    2 0 obj\n<< /Type /Pages\n/Kids [3 0 R]\n/Count 1\n/MediaBox [0 0 ${width} ${height}]\n>>\nendobj
    3 0 obj\n<< /Type /Page\n/Parent 2 0 R\n/Resources\n<< /Font\n<< /F1\n<< /Type /Font
    /Subtype /Type1\n/BaseFont /Times-Roman\n>>\n>>\n>>\n/Contents [`
  var pdf = ''
  var count = 4
  for (var i = 0; i < polylines.length; i++) {
    pdf += `${count} 0 obj \n<< /Length 0 >>\n stream\n 1 j 1 J 1.5 w\n`
    for (var j = 0; j < polylines[i].length; j++) {
      var [x, y] = polylines[i][j]
      pdf += `${x} ${height - y} ${j ? 'l' : 'm'} `
    }
    pdf += '\nS\nendstream\nendobj\n'
    head += `${count} 0 R `
    count++
  }
  head += ']\n>>\nendobj\n'
  pdf += '\ntrailer\n<< /Root 1 0 R \n /Size 0\n >>startxref\n\n%%EOF\n'
  return head + pdf
}

export function export_gif(
  dr: Drawing,
  { scale = 1.0, iter = 2 }: { scale?: number; iter?: number } = {},
): number[] {
  let scl = 1 / scale
  let w = ~~(dr.w / scl)
  let h = ~~(dr.h / scl)
  let polylines = dr.polylines
  // console.log(w,h);
  let data = new Array(w * h).fill(0)
  for (var i = 0; i < polylines.length; i++) {
    // console.log(polylines[i])
    for (var j = 0; j < polylines[i].length - 1; j++) {
      let x0 = polylines[i][j][0] / scl
      let y0 = polylines[i][j][1] / scl
      let x1 = polylines[i][j + 1][0] / scl
      let y1 = polylines[i][j + 1][1] / scl
      for (let k = 0; k < iter; k++) xiaolinwu(data, w, h, x0, y0, x1, y1)
    }
  }
  for (let i = 0; i < data.length; i++) {
    data[i] = 1 - data[i]
  }
  // console.log(data);
  let bytes = encode_gif(data, w, h)
  return bytes
}

function xiaolinwu(
  data: number[],
  w: number,
  h: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  //https://en.wikipedia.org/wiki/Xiaolin_Wu%27s_line_algorithm
  function plot(x: number, y: number, c: number) {
    data[y * w + x] = 1 - (1 - data[y * w + x]) * (1 - c)
  }
  function ipart(x: number) {
    return Math.floor(x)
  }
  function round(x: number) {
    return ipart(x + 0.5)
  }
  function fpart(x: number) {
    return x - Math.floor(x)
  }
  function rfpart(x: number) {
    return 1 - fpart(x)
  }

  function drawline(x0: number, y0: number, x1: number, y1: number) {
    let steep = Math.abs(y1 - y0) > Math.abs(x1 - x0)
    if (steep) {
      ;[x0, y0] = [y0, x0]
      ;[x1, y1] = [y1, x1]
    }
    if (x0 > x1) {
      ;[x0, x1] = [x1, x0]
      ;[y0, y1] = [y1, y0]
    }
    let dx = x1 - x0
    let dy = y1 - y0
    let gradient = dy / dx
    if (dx == 0.0) {
      gradient = 1.0
    }
    let xend = round(x0)
    let yend = y0 + gradient * (xend - x0)
    let xgap = rfpart(x0 + 0.5)
    let xpxl1 = xend
    let ypxl1 = ipart(yend)
    if (steep) {
      plot(ypxl1, xpxl1, rfpart(yend) * xgap)
      plot(ypxl1 + 1, xpxl1, fpart(yend) * xgap)
    } else {
      plot(xpxl1, ypxl1, rfpart(yend) * xgap)
      plot(xpxl1, ypxl1 + 1, fpart(yend) * xgap)
    }
    let intery = yend + gradient
    xend = round(x1)
    yend = y1 + gradient * (xend - x1)
    xgap = fpart(x1 + 0.5)
    let xpxl2 = xend
    let ypxl2 = ipart(yend)
    if (steep) {
      plot(ypxl2, xpxl2, rfpart(yend) * xgap)
      plot(ypxl2 + 1, xpxl2, fpart(yend) * xgap)
    } else {
      plot(xpxl2, ypxl2, rfpart(yend) * xgap)
      plot(xpxl2, ypxl2 + 1, fpart(yend) * xgap)
    }
    if (steep) {
      for (let x = xpxl1 + 1; x <= xpxl2 - 1; x++) {
        plot(ipart(intery), x, rfpart(intery))
        plot(ipart(intery) + 1, x, fpart(intery))
        intery = intery + gradient
      }
    } else {
      for (let x = xpxl1 + 1; x <= xpxl2 - 1; x++) {
        plot(x, ipart(intery), rfpart(intery))
        plot(x, ipart(intery) + 1, fpart(intery))
        intery = intery + gradient
      }
    }
  }
  drawline(x0, y0, x1, y1)
}
function encode_gif(data: number[], w: number, h: number) {
  let bytes = []
  bytes.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61)
  bytes.push(w & 0xff)
  bytes.push((w >> 8) & 0xff)
  bytes.push(h & 0xff)
  bytes.push((h >> 8) & 0xff)
  bytes.push(0xf6)
  bytes.push(0, 0)
  for (let i = 0; i < 127; i++) {
    bytes.push(i * 2, i * 2, i * 2)
  }
  bytes.push(0xff, 0xff, 0xff)
  bytes.push(0x2c, 0, 0, 0, 0)
  bytes.push(w & 0xff)
  bytes.push((w >> 8) & 0xff)
  bytes.push(h & 0xff)
  bytes.push((h >> 8) & 0xff)
  bytes.push(0, 7)

  let n = ~~((w * h) / 126)
  let inc = n * 126
  let exc = w * h - inc
  for (let i = 0; i < n; i++) {
    bytes.push(0x7f)
    bytes.push(0x80)
    for (let j = 0; j < 126; j++) {
      bytes.push(~~(data[i * 126 + j] * 127))
    }
  }
  if (exc) {
    bytes.push(exc + 1)
    bytes.push(0x80)
    for (let i = 0; i < exc; i++) {
      bytes.push(~~(data[inc + i] * 127))
    }
  }
  bytes.push(0x01, 0x81, 0x00, 0x3b)
  return bytes
}
