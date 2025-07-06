import {
  NOTE_LENGTH,
  ACCIDENTAL,
  CLEF,
  ARTICULATION,
  CUE,
  BRACKET,
} from './const'
import { HERSHEY, ascii_map, get_text_width, FONT } from './hershey'
import { Element } from './type'

function xform(
  polylines: [number, number][][],
  fn: (x: number, y: number) => [number, number],
): [number, number][][] {
  return polylines.map((p) => p.map((xy) => fn(xy[0], xy[1])))
}

function cubic_bezier(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  t: number,
): [number, number] {
  let s = 1 - t
  let s2 = s * s
  let s3 = s * s2
  let t2 = t * t
  let t3 = t2 * t
  return [
    s3 * x0 + 3 * s2 * t * x1 + 3 * s * t2 * x2 + t3 * x3,
    s3 * y0 + 3 * s2 * t * y1 + 3 * s * t2 * y2 + t3 * y3,
  ]
}

let symbols: Record<string, [number, number][][]> = {}
function make_symbols() {
  function note_var(
    p: [number, number][][],
    stem_dir: number,
    twisted: boolean,
  ): [number, number][][] {
    if (stem_dir < 0) {
      if (twisted) {
        p = xform(p, (u, v) => [u + 5, v])
      } else {
        p = xform(p, (u, v) => [u - 6, v])
      }
    } else {
      if (twisted) {
        p = xform(p, (u, v) => [u - 6, v])
      } else {
        p = xform(p, (u, v) => [u + 5, v])
      }
    }
    return p
  }
  let p: [number, number][][]
  {
    p = HERSHEY(2370).polylines
    symbols['note_whole_up_twist'] = note_var(p, -1, true)
    symbols['note_whole_down_twist'] = note_var(p, 1, true)
    symbols['note_whole_up'] = note_var(p, -1, false)
    symbols['note_whole_down'] = note_var(p, 1, false)
  }
  {
    p = HERSHEY(2371).polylines
    p = xform(p, (u, v) => scale_axis(u, v, 1, 0.9, 0.4634))
    p = p
      .slice(0, 1)
      .concat(xform(p.slice(0, 1), (u, v) => scale_axis(u, v, 1, 0.75, 0.4634)))
    p = xform(p, (u, v) => [u * 0.82 + 0.5, v])
    symbols['note_half_up_twist'] = note_var(p, -1, true)
    symbols['note_half_down_twist'] = note_var(p, 1, true)
    symbols['note_half_up'] = note_var(p, -1, false)
    symbols['note_half_down'] = note_var(p, 1, false)
  }
  {
    p = HERSHEY(2372).polylines
    // p = p.filter((x,i)=>!(i%2));
    p = xform(p, (u, v) => scale_axis(u, v, 1, 0.8, 0.4634))
    symbols['note_fill_up_twist'] = note_var(p, -1, true)
    symbols['note_fill_down_twist'] = note_var(p, 1, true)
    symbols['note_fill_up'] = note_var(p, -1, false)
    symbols['note_fill_down'] = note_var(p, 1, false)
  }
  {
    p = HERSHEY(2317).polylines
    symbols['dot'] = xform(p, (u, v) => [u * 1.1, v * 1.1])
  }
  {
    p = HERSHEY(2325).polylines
    symbols['acc_flat'] = xform(p, (u, v) => [u * 0.7, v + 0.5])
  }
  {
    p = HERSHEY(2324).polylines
    symbols['acc_nat'] = xform(p, (u, v) => [u * 0.7, v])
  }
  {
    p = HERSHEY(2323).polylines
    p = xform(p, (u, v) => [u * 0.9, v * 1.1 - u * 0.2])
    p[3] = xform(p.slice(3, 4), (u, v) => [u, v + 0.15])[0]
    p[5] = xform(p.slice(5, 6), (u, v) => [u, v + 0.15])[0]
    symbols['acc_sharp'] = p
  }
  {
    p = HERSHEY(2380).polylines
    symbols['clef_g'] = xform(p, (u, v) => rotate(u, v, -0.15))
  }
  {
    p = HERSHEY(2381).polylines
    symbols['clef_f'] = xform(p, (u, v) => [u - 9, v])
  }
  {
    p = HERSHEY(2382).polylines
    symbols['clef_c'] = xform(p, (u, v) => [u, v * 0.9])
  }
  {
    p = HERSHEY(2376).polylines
    symbols['rest_whole'] = xform(p, (u, v) => [u * 0.85, v * 1.25 + 2.25])
  }
  {
    p = HERSHEY(2377).polylines
    symbols['rest_half'] = xform(p, (u, v) => [u, v * 1.25 + 1])
  }
  {
    p = HERSHEY(2378).polylines
    symbols['rest_quarter'] = xform(p, (u, v) => rotate(u, v, -0.1))
  }
  {
    p = HERSHEY(2379).polylines
    symbols['rest_8'] = xform(p, (u, v) => [u, v])
  }
  {
    p = HERSHEY(2379).polylines
    let q = xform(p, (u, v) => [u, v])
    q[q.length - 1][q[q.length - 1].length - 1][0] += 0.93
    q[q.length - 1][q[q.length - 1].length - 1][1] -= 3

    p = xform(p, (u, v) => [u - 3.07, v + 10])
    symbols['rest_16'] = q.concat(p)
  }
  {
    p = HERSHEY(2379).polylines
    let q = xform(p, (u, v) => [u, v])
    q[q.length - 1][q[q.length - 1].length - 1][0] += 0.93
    q[q.length - 1][q[q.length - 1].length - 1][1] -= 3

    let a = xform(q, (u, v) => [u + 3.07, v - 10])
    let c = xform(p, (u, v) => [u - 3.07, v + 10])
    symbols['rest_32'] = a.concat(q).concat(c)
  }
  {
    p = HERSHEY(2379).polylines
    let q = xform(p, (u, v) => [u, v])
    q[q.length - 1][q[q.length - 1].length - 1][0] += 0.93
    q[q.length - 1][q[q.length - 1].length - 1][1] -= 3

    let a = xform(q, (u, v) => [u + 4.07, v - 10])
    let b = xform(q, (u, v) => [u + 1, v])
    let c = xform(p, (u, v) => [u - 2.07, v + 10])
    let d = xform(p, (u, v) => [u - 5.14, v + 20])
    symbols['rest_64'] = a.concat(b).concat(c).concat(d)
  }
  {
    p = HERSHEY(2368).polylines
    p = xform(p, (u, v) => [u + 5, (v + 2.5) * 1.5])
    symbols['flag_up'] = p

    p = xform(p, (u, v) => [u, v])
    p[0].pop()
    p[0].pop()
    p[0][p[0].length - 1][1] += 3
    symbols['flag_mid_up'] = p
  }
  {
    p = HERSHEY(2369).polylines
    p = xform(p, (u, v) => [u + 5, (v - 2.5) * 1.5])
    symbols['flag_down'] = p

    p = xform(p, (u, v) => [u, v])
    p[p.length - 1].shift()
    p[p.length - 1].shift()
    p[p.length - 1][0][1] -= 3
    symbols['flag_mid_down'] = p
  }
  {
    for (let i = 0; i < 10; i++) {
      p = HERSHEY(3200 + i).polylines
      symbols['timesig_digit_' + i] = xform(p, (u, v) => [u, v * 0.85 + 1.1])
    }
  }
  {
    for (let i = 0; i < 10; i++) {
      p = HERSHEY(2200 + i).polylines
      symbols['tuplet_digit_' + i] = xform(p, (u, v) => [u * 0.5, v * 0.5])
    }
  }
  {
    p = HERSHEY(3103).polylines
    symbols['timesig_c'] = xform(p, (u, v) => [u, v * 1.2 - 2.5])
  }
  {
    p = [[]]
    for (let i = 0; i < 8; i++) {
      let a = (i / 7) * Math.PI
      p[0].push([Math.cos(a) * 6, 1 - Math.sin(a) * 6])
    }
    p.push([
      [-1, 1],
      [0, 0],
      [1, 1],
      [0, 2],
    ])
    symbols['fermata'] = p
  }
  {
    p = []
    p.push([
      [-8, 2],
      [-5, -1],
      [-2, 2],
      [1, -1],
      [4, 2],
      [7, -1],
    ])
    p.push([
      [-4, -2],
      [-1, 1],
    ])
    p.push([
      [2, -2],
      [5, 1],
    ])
    symbols['mordent'] = p
  }
  {
    p = HERSHEY(2274).polylines.slice(-2)
    p = xform(p, (u, v) => rotate(-u * 0.4, v * 0.6, Math.PI / 2))
    symbols['turn'] = p
  }
  {
    p = xform(HERSHEY(2670).polylines, (u, v) => [u * 0.8 - 4, v * 0.8]).concat(
      xform(HERSHEY(2668).polylines, (u, v) => [u * 0.8 + 4.5, v * 0.8 - 0.5]),
    )
    symbols['trill'] = p
  }
  {
    p = xform(HERSHEY(2218).polylines, (u, v) => [u, v + 8])
    symbols['flageolet'] = p
  }
  {
    p = xform(HERSHEY(3316).polylines, (u, v) => [u * 0.8 - 11, v * 0.8 - 3])
      .concat(xform(HERSHEY(3405).polylines, (u, v) => [u * 0.8 + 0, v * 0.8]))
      .concat(xform(HERSHEY(3404).polylines, (u, v) => [u * 0.8 + 8, v * 0.8]))
      .concat([
        [
          [14, 6],
          [15, 5],
          [16, 6],
          [15, 7],
        ],
      ])
    symbols['pedal_on'] = xform(p, (u, v) => [u, v + 3])
  }
  {
    p = []
    for (let i = 0; i < 8; i++) {
      let a = (i / 8) * Math.PI * 2
      p = p.concat(
        xform(
          [
            [
              [2, -2],
              [3, 0],
              [7, -0.5],
              [9, -2],
              [11, 0],
              [9, 2],
              [7, 0.5],
              [3, 0],
              [2, 2],
            ],
          ],
          (u, v) => rotate(u * 0.8, v * 0.8, a),
        ),
      )
    }
    symbols['pedal_off'] = p
  }
  {
    p = xform(HERSHEY(2407).polylines, (u, v) => [(u - 5) * 1.25, v / 78 + 0.5])
    p = xform(p, (u, v) => {
      return v < 0.5
        ? [u - 2 * (v / 0.5) - 2, v]
        : [u - (2 * (1 - v)) / 0.5 - 2, v]
    })
    symbols['brace'] = p
  }
}
make_symbols()

function scale_axis(
  x: number,
  y: number,
  sx: number,
  sy: number,
  th: number,
): [number, number] {
  let u = x * Math.cos(th) - y * Math.sin(th)
  let v = x * Math.sin(th) + y * Math.cos(th)
  u *= sx
  v *= sy
  return [
    u * Math.cos(-th) - v * Math.sin(-th),
    u * Math.sin(-th) + v * Math.cos(-th),
  ]
}
function rotate(x: number, y: number, th: number): [number, number] {
  let u = x * Math.cos(th) - y * Math.sin(th)
  let v = x * Math.sin(th) + y * Math.cos(th)
  return [u, v]
}

function build_slur_bezier(elt: Element) {
  let { tag, x, y, w, h } = elt

  elt.pts = []
  elt.pts1 = []
  let n = 20
  let sh = 0 //elt.dir*8;

  let x0 = elt.x
  let y0 = elt.y
  let x3 = elt.x + elt.w
  let y3 = elt.y1

  let a = Math.atan2(y3 - y0, x3 - x0) + (Math.PI / 2) * elt.dir
  let hx = Math.cos(a) * h
  let hy = Math.sin(a) * h

  let m0x = x0 * 0.8 + x3 * 0.2
  let m0y = y0 * 0.8 + y3 * 0.2
  let m1x = x0 * 0.2 + x3 * 0.8
  let m1y = y0 * 0.2 + y3 * 0.8
  let x1a = m0x + hx
  let y1a = m0y + hy
  let x2a = m1x + hx
  let y2a = m1y + hy

  let x1b = elt.x + elt.w * 0.2
  let y1b = elt.y + elt.dir * h
  let x2b = elt.x + elt.w * 0.8
  let y2b = elt.y1 + elt.dir * h

  let x1 = x1a * 0.5 + x1b * 0.5
  let y1 = y1a * 0.5 + y1b * 0.5
  let x2 = x2a * 0.5 + x2b * 0.5
  let y2 = y2a * 0.5 + y2b * 0.5

  y0 += sh
  y1 += sh
  y2 += sh
  y3 += sh

  elt.control = [
    [x0, y0],
    [x1, y1],
    [x2, y2],
    [x3, y3],
  ]

  let p: [number, number][] = []
  for (let i = 0; i < n; i++) {
    let t = i / (n - 1)
    elt.pts.push(cubic_bezier(x0, y0, x1, y1, x2, y2, x3, y3, t))
  }

  p = []
  for (let i = 2; i < n - 2; i++) {
    let t = 1 - i / (n - 1)
    elt.pts1.push(
      cubic_bezier(x0, y0, x1, y1 - elt.dir, x2, y2 - elt.dir, x3, y3, t),
    )
  }
}

function build_cue(elt: Element) {
  let { tag, x, y, w, h } = elt

  elt.pts = []
  function push_all(p: [number, number][][]) {
    for (let i = 0; i < p.length; i++) {
      if (p[i].length <= 1) continue
      elt.pts.push(p[i])
    }
  }
  if (elt.text == CUE.PEDAL_ON) {
    let p = symbols['pedal_on']
    let scl = elt.h / 24
    push_all(xform(p, (u, v) => [x + u * scl, y + v * scl + h / 2]))
  } else if (elt.text == CUE.PEDAL_OFF) {
    let p = symbols['pedal_off']
    let scl = elt.h / 24
    push_all(xform(p, (u, v) => [x + u * scl, y + v * scl + h / 2]))
  } else if (
    elt.text == CUE.PIANISSISSIMO ||
    elt.text == CUE.PIANISSIMO ||
    elt.text == CUE.PIANO ||
    elt.text == CUE.MEZZO_PIANO ||
    elt.text == CUE.MEZZO_FORTE ||
    elt.text == CUE.FORTE ||
    elt.text == CUE.FORTISSIMO ||
    elt.text == CUE.FORTISSISSIMO ||
    elt.text == CUE.SFORZANDO
  ) {
    let v = get_text_width(elt.text, FONT.TRIPLEX_ITALIC)
    let scl = elt.h / 30
    let dx = (-v / 2) * scl
    for (let i = 0; i < elt.text.length; i++) {
      if (elt.text[i] == ' ') {
        dx += 10 * scl
        continue
      }
      let a = ascii_map(elt.text[i], FONT.TRIPLEX_ITALIC)
      if (a === undefined) {
        continue
      }
      let e = HERSHEY(a)
      push_all(
        xform(e.polylines, (u, v) => [
          x + dx + (u - e.xmin) * scl,
          y + (v + 14) * scl,
        ]),
      )
      dx += (e.xmax - e.xmin - 3) * scl
    }
  } else {
    let v = get_text_width(elt.text, FONT.DUPLEX_ITALIC)
    let scl = elt.h / 40
    let dx = 0
    for (let i = 0; i < elt.text.length; i++) {
      if (elt.text[i] == ' ') {
        dx += 10 * scl
        continue
      }
      let a = ascii_map(elt.text[i], FONT.DUPLEX_ITALIC)
      if (a === undefined) {
        continue
      }
      let e = HERSHEY(a)
      push_all(
        xform(e.polylines, (u, v) => [
          x + dx + (u - e.xmin) * scl,
          y + (v + 18) * scl,
        ]),
      )
      dx += (e.xmax - e.xmin) * scl
    }
  }
}

export function bounding_box(p: [number, number][][] | [number, number][]): {
  x: number
  y: number
  w: number
  h: number
} {
  let xmin = Infinity
  let ymin = Infinity
  let xmax = -Infinity
  let ymax = -Infinity
  for (let i = 0; i < p.length; i++) {
    if (Array.isArray(p[i][0])) {
      for (let j = 0; j < p[i].length; j++) {
        xmin = Math.min(xmin, p[i][j][0])
        ymin = Math.min(ymin, p[i][j][1])
        xmax = Math.max(xmax, p[i][j][0])
        ymax = Math.max(ymax, p[i][j][1])
      }
    } else {
      xmin = Math.min(xmin, (p[i] as [number, number])[0])
      ymin = Math.min(ymin, (p[i] as [number, number])[1])
      xmax = Math.max(xmax, (p[i] as [number, number])[0])
      ymax = Math.max(ymax, (p[i] as [number, number])[1])
    }
  }
  // xmin -=1;
  // ymin -=1;
  // xmax +=1;
  // ymax +=1;
  return { x: xmin, y: ymin, w: xmax - xmin, h: ymax - ymin }
}
function box_overlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  return (
    a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y
  )
}
function point_in_box(x, y, b: { x: number; y: number; w: number; h: number }) {
  // return b.x <= x && x <= (b.x+b.w) && b.y <= y && y <= (b.y+b.h);
  return b.x <= x && x <= b.x + b.w && b.y <= y && y <= b.y + b.h
}

export function cue_evade_slur(elements: Element[]) {
  let slurs: Element[] = []
  let cues: Element[] = []
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].tag == 'cue') {
      if (!elements[i].pts) {
        build_cue(elements[i])
      }
      if (!elements[i].bbox) {
        elements[i].bbox = bounding_box(elements[i].pts)
      }
      cues.push(elements[i])
    } else if (elements[i].tag == 'slur') {
      if (!elements[i].pts) {
        build_slur_bezier(elements[i])
      }
      if (!elements[i].bbox) {
        elements[i].bbox = bounding_box(elements[i].pts)
      }
      slurs.push(elements[i])
    } else if (elements[i].tag == 'cresc') {
      let { x, y, w, h, x1, y1, w1, h1 } = elements[i]
      elements[i].bbox = bounding_box([
        [x, y],
        [x + w, y + h],
        [x1, y1],
        [x1 + w1, y1 + h1],
      ])
      cues.push(elements[i])
    }
  }
  function resolve_(cue: Element, depth: number = 5) {
    if (depth <= 0) {
      return
    }
    for (let j = 0; j < slurs.length; j++) {
      if (box_overlap(cue.bbox, slurs[j].bbox)) {
        let hit = false
        let dir: number = null
        for (let k = 0; k < slurs[j].pts.length; k++) {
          if (point_in_box(slurs[j].pts[k][0], slurs[j].pts[k][1], cue.bbox)) {
            hit = true
            dir =
              cue.bbox.y + cue.bbox.h / 2 <
              slurs[j].bbox.y + slurs[j].bbox.h / 2
                ? -1
                : 1
            break
          }
        }
        if (hit) {
          let d = dir * Math.min(4, Math.max(2, depth))
          cue.y += d
          cue.bbox.y += d
          if (cue.y1 != undefined) {
            cue.y1 += d
          }
          cue.pts = null
          return resolve_(cue, depth - 1)
        }
      }
    }
  }
  for (let i = 0; i < cues.length; i++) {
    resolve_(cues[i])
  }
}

export function slur_evade_note(elements: Element[]) {
  let slurs: Element[] = []
  let notes: Element[] = []
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].tag == 'note_head') {
      let elt = elements[i]
      let { x, y, w, h } = elt
      x -= 1
      y -= 1
      w += 2
      h += 2
      if (!elt.bbox) {
        if (elt.stem_dir < 0) {
          if (elt.twisted) {
            elt.bbox = { x, y: y - h / 2, w, h }
          } else {
            elt.bbox = { x: x - w, y: y - h / 2, w, h }
          }
        } else {
          if (!elt.twisted) {
            elt.bbox = { x: x, y: y - h / 2, w, h }
          } else {
            elt.bbox = { x: x - w, y: y - h / 2, w, h }
          }
        }
      }
      notes.push(elements[i])
    } else if (elements[i].tag == 'slur') {
      if (!elements[i].pts) {
        build_slur_bezier(elements[i])
      }
      if (!elements[i].bbox) {
        elements[i].bbox = bounding_box(elements[i].pts)
      }
      slurs.push(elements[i])
    }
  }
  function resolve_(slur: Element, depth: number = 5) {
    if (depth <= 0) {
      return
    }
    for (let j = 0; j < notes.length; j++) {
      if (box_overlap(slur.bbox, notes[j].bbox)) {
        let hit = false
        let dir: number = slur.dir
        for (let k = 0; k < slur.pts.length; k++) {
          if (point_in_box(slur.pts[k][0], slur.pts[k][1], notes[j].bbox)) {
            hit = true
            break
          }
        }
        if (hit) {
          let d = dir * Math.min(4, Math.max(2, depth))
          slur.y += d
          slur.y1 += d
          slur.bbox.y += d
          slur.pts.forEach((xy: [number, number]) => {
            xy[1] += d
          })
          slur.pts1.forEach((xy: [number, number]) => {
            xy[1] += d
          })
          return resolve_(slur, depth - 1)
        }
      }
    }
  }
  for (let i = 0; i < slurs.length; i++) {
    if (slurs[i].adjacent) {
      continue
    }
    resolve_(slurs[i])
  }
}

// 元素渲染策略接口
type DrawingHandler = {
  [key in Element['tag']]: (
    elt: Element,
    polylines: [number, number][][],
  ) => void
}

// 元素渲染器映射表
const drawing_handler: DrawingHandler = {
  note_head: (elt: Element, polylines: [number, number][][]) => {
    const { x, y } = elt
    let key =
      (elt.stem_dir < 0 ? '_up' : '_down') + (elt.twisted ? '_twist' : '')

    if (elt.duration >= NOTE_LENGTH.WHOLE) {
      key = 'note_whole' + key
    } else if (elt.duration >= NOTE_LENGTH.HALF) {
      key = 'note_half' + key
    } else {
      key = 'note_fill' + key
    }

    let p = symbols[key]
    if (elt.mini) p = xform(p, (u, v) => [u / 2, v / 2])
    push_all(
      xform(p, (u, v) => [x + u, y + v]),
      polylines,
    )
  },

  dot: (elt: Element, polylines: [number, number][][]) => {
    const { x, y } = elt
    let p = symbols['dot']
    if (elt.mini) p = xform(p, (u, v) => [u / 2, v / 2])
    push_all(
      xform(p, (u, v) => [x + u, y + v]),
      polylines,
    )
  },

  accidental: (elt: Element, polylines: [number, number][][]) => {
    const { x, y } = elt
    let p: [number, number][][]

    if (elt.type == ACCIDENTAL.FLAT) {
      p = symbols['acc_flat']
    } else if (elt.type == ACCIDENTAL.NATURAL) {
      p = symbols['acc_nat']
    } else if (elt.type == ACCIDENTAL.SHARP) {
      p = symbols['acc_sharp']
    } else {
      return
    }

    if (elt.mini) p = xform(p, (u, v) => [u / 2, v / 2])
    push_all(
      xform(p, (u, v) => [x + u, y + v]),
      polylines,
    )
  },

  clef: (elt: Element, polylines: [number, number][][]) => {
    const { x, y } = elt
    let p: [number, number][][]

    if (elt.type == CLEF.TREBLE) {
      p = symbols['clef_g']
    } else if (elt.type == CLEF.BASS) {
      p = symbols['clef_f']
    } else {
      p = symbols['clef_c']
    }

    push_all(
      xform(p, (u, v) => [x + u, y + v]),
      polylines,
    )
  },

  rest: (elt: Element, polylines: [number, number][][]) => {
    const { x, y } = elt
    let p: [number, number][][]

    if (elt.duration == NOTE_LENGTH.WHOLE) {
      p = symbols['rest_whole']
    } else if (elt.duration == NOTE_LENGTH.HALF) {
      p = symbols['rest_half']
    } else if (elt.duration == NOTE_LENGTH.QUARTER) {
      p = symbols['rest_quarter']
    } else if (elt.duration == NOTE_LENGTH.EIGHTH) {
      p = symbols['rest_8']
    } else if (elt.duration == NOTE_LENGTH.SIXTEENTH) {
      p = symbols['rest_16']
    } else if (elt.duration == NOTE_LENGTH.THIRTYSECOND) {
      p = symbols['rest_32']
    } else if (elt.duration == NOTE_LENGTH.SIXTYFOURTH) {
      p = symbols['rest_64']
    } else {
      return
    }

    push_all(
      xform(p, (u, v) => [x + u, y + v]),
      polylines,
    )
  },

  flag: (elt: Element, polylines: [number, number][][]) => {
    const { x, y } = elt
    let p: [number, number][][]

    if (elt.stem_dir < 0) {
      p = elt.is_last ? symbols['flag_up'] : symbols['flag_mid_up']
    } else {
      p = elt.is_last ? symbols['flag_down'] : symbols['flag_mid_down']
    }

    if (elt.mini) p = xform(p, (u, v) => [u / 2, v / 2])
    push_all(
      xform(p, (u, v) => [x + u, y + v]),
      polylines,
    )
  },

  beam: (elt: Element, polylines: [number, number][][]) => {
    const { x, y, w, h } = elt
    for (let j = 0.3; j < 4.66; j += 1.09) {
      polylines.push([
        [x, y - j * elt.stem_dir],
        [x + w, y + h - j * elt.stem_dir],
      ])
    }
  },

  line: (elt: Element, polylines: [number, number][][]) => {
    const { x, y, w, h } = elt
    polylines.push([
      [x, y],
      [x + w, y + h],
    ])
  },

  cresc: (elt: Element, polylines: [number, number][][]) => {
    const { x, y, w, h } = elt
    const p: [number, number][][] = [
      [
        [x, y],
        [x + w, y + h],
      ],
      [
        [elt.x1, elt.y1],
        [elt.x1 + elt.w1, elt.y1 + elt.h1],
      ],
    ]
    push_all(p, polylines)
  },

  slur: (elt: Element, polylines: [number, number][][]) => {
    if (!elt.pts) {
      build_slur_bezier(elt)
    }
    polylines.push(elt.pts)
    polylines.push(elt.pts1)
  },

  timesig_digit: (elt: Element, polylines: [number, number][][]) => {
    const { x, y } = elt
    const p = symbols['timesig_digit_' + elt.value]
    push_all(
      xform(p, (u, v) => [x + u, y + v]),
      polylines,
    )
  },

  timesig_c: (elt: Element, polylines: [number, number][][]) => {
    const { x, y } = elt
    const p = symbols['timesig_c']
    push_all(
      xform(p, (u, v) => [x + u, y + v]),
      polylines,
    )

    if (elt.type === 'cut') {
      polylines.push([
        [x, y - 14],
        [x, y + 14],
      ])
    }
  },

  tuplet_label: (elt: Element, polylines: [number, number][][]) => {
    const { x, y, w, h } = elt
    const digits: string[] = elt.label.toString().split('')
    const mid = x + w / 2
    const mw = digits.length
    const dw = 8
    const dp = 4
    const ml = mid - (mw / 2) * dw - dp
    const mr = mid + (mw / 2) * dw + dp

    if (ml >= x && mr <= x + w) {
      polylines.push([
        [x, y],
        [x, y + h],
        [ml, y + h],
      ])
      polylines.push([
        [mr, y + h],
        [x + w, y + h],
        [x + w, y],
      ])
    }

    for (let i = 0; i < digits.length; i++) {
      const p = symbols['tuplet_digit_' + digits[i]]
      push_all(
        xform(p, (u, v) => [ml + dp + dw * i + u + 4, y + h + v]),
        polylines,
      )
    }
  },

  lyric: (elt: Element, polylines: [number, number][][]) => {
    const { x, y, w } = elt
    const scl = w / get_text_width(elt.text)
    let dx = -4 * scl

    for (let i = 0; i < elt.text.length; i++) {
      if (elt.text[i] == ' ') {
        dx += 10 * scl
        continue
      }

      const a = ascii_map(elt.text[i])
      if (a === undefined) continue

      const e = HERSHEY(a)
      push_all(
        xform(e.polylines, (u, v) => [
          x + dx + (u - e.xmin) * scl,
          y + (v + 12) * scl,
        ]),
        polylines,
      )
      dx += (e.xmax - e.xmin) * scl
    }
  },

  bold_text: (elt: Element, polylines: [number, number][][]) => {
    const { x, y, w } = elt
    const scl = w / get_text_width(elt.text, FONT.TRIPLEX, -2)
    if (isNaN(scl)) return

    let dx = 0
    for (let i = 0; i < elt.text.length; i++) {
      if (elt.text[i] == ' ') {
        dx += 10 * scl
        continue
      }

      const a = ascii_map(elt.text[i], FONT.TRIPLEX)
      if (a === undefined) continue

      const e = HERSHEY(a)
      push_all(
        xform(e.polylines, (u, v) => [
          x + dx + (u - e.xmin) * scl,
          y + (v + 12) * scl,
        ]),
        polylines,
      )
      dx += (e.xmax - e.xmin - 2) * scl
    }
  },

  regular_text: (elt: Element, polylines: [number, number][][]) => {
    const { x, y, w } = elt
    const scl = w / get_text_width(elt.text, FONT.DUPLEX, -2)
    if (isNaN(scl)) return

    let dx = 0
    for (let i = 0; i < elt.text.length; i++) {
      if (elt.text[i] == ' ') {
        dx += 10 * scl
        continue
      }

      const a = ascii_map(elt.text[i], FONT.DUPLEX)
      if (a === undefined) continue

      const e = HERSHEY(a)
      push_all(
        xform(e.polylines, (u, v) => [
          x + dx + (u - e.xmin) * scl,
          y + (v + 12) * scl,
        ]),
        polylines,
      )
      dx += (e.xmax - e.xmin - 2) * scl
    }
  },

  bracket: (elt: Element, polylines: [number, number][][]) => {
    const { x, y, h } = elt

    if (elt.type == BRACKET.BRACE) {
      const p = symbols['brace']
      push_all(
        xform(p, (u, v) => [x + u, y + v * h]),
        polylines,
      )
    } else if (elt.type == BRACKET.BRACKET) {
      polylines.push([
        [x + 5, y - 12],
        [x - 2, y - 8],
        [x - 8, y - 7],
        [x - 8, y + h + 7],
        [x - 2, y + h + 8],
        [x + 5, y + h + 12],
      ])
      polylines.push([
        [x + 5, y - 12],
        [x - 1, y - 8],
        [x - 7, y - 6],
        [x - 7, y + h + 6],
        [x - 1, y + h + 8],
        [x + 5, y + h + 12],
      ])
      polylines.push([
        [x - 6, y - 5],
        [x - 6, y + h + 5],
      ])
    }
  },

  articulation: (elt: Element, polylines: [number, number][][]) => {
    const { x, y } = elt
    if (typeof elt.type !== 'number') return

    const a = Math.abs(elt.type)

    if (a == ARTICULATION.STACCATO) {
      const p = symbols['dot']
      push_all(
        xform(p, (u, v) => [x + u, y + v]),
        polylines,
      )
    } else if (a == ARTICULATION.ACCENT) {
      polylines.push([
        [x - 5, y - 3],
        [x + 5, y],
        [x - 5, y + 3],
      ])
    } else if (a == ARTICULATION.SPICCATO) {
      polylines.push([
        [x - 1, y - 3],
        [x, y + 3],
        [x + 1, y - 3],
        [x - 1, y - 3],
      ])
    } else if (a == ARTICULATION.TENUTO) {
      polylines.push([
        [x - 4, y],
        [x + 4, y],
      ])
    } else if (a == ARTICULATION.MARCATO) {
      polylines.push([
        [x - 3, y + 3],
        [x, y - 3],
        [x + 3, y + 3],
      ])
    } else if (a == ARTICULATION.UP_BOW) {
      polylines.push([
        [x - 3, y - 3],
        [x, y + 3],
        [x + 3, y - 3],
      ])
    } else if (a == ARTICULATION.TREMBLEMENT) {
      push_all(
        [
          [
            [x - 4, y],
            [x + 4, y],
          ],
          [
            [x, y - 4],
            [x, y + 4],
          ],
        ],
        polylines,
      )
    } else if (a == ARTICULATION.FERMATA) {
      const p = symbols['fermata']
      push_all(
        xform(p, (u, v) => [x + u, y + v * elt.dir]),
        polylines,
      )
    } else if (a == ARTICULATION.MORDENT) {
      const p = symbols['mordent']
      push_all(
        xform(p, (u, v) => [x + u, y + v]),
        polylines,
      )
    } else if (a == ARTICULATION.TURN) {
      const p = symbols['turn']
      push_all(
        xform(p, (u, v) => [x + u, y + v]),
        polylines,
      )
    } else if (a == ARTICULATION.TRILL) {
      const p = symbols['trill']
      push_all(
        xform(p, (u, v) => [x + u, y + v]),
        polylines,
      )
    } else if (a == ARTICULATION.FLAGEOLET) {
      const p = symbols['flageolet']
      push_all(
        xform(p, (u, v) => [x + u, y + v]),
        polylines,
      )
    } else {
      const p = HERSHEY(ascii_map(elt.type.toString(), FONT.TRIPLEX)).polylines
      push_all(
        xform(p, (u, v) => [x + u / 2, y + v / 2]),
        polylines,
      )
    }

    if (elt.type < 0) {
      polylines.push([
        [x, y - 5],
        [x, y + 5],
      ])
    }
  },

  squiggle: (elt: Element, polylines: [number, number][][]) => {
    const { x, y, h } = elt
    const p: [number, number][] = []
    const q: [number, number][][] = []
    let f = false
    const h2 = Math.ceil(h / 8) * 8
    const y2 = y - (h2 - h) / 2

    for (let i = 0; i < h2; i += 4) {
      p.push([f ? x + 2 : x - 2, y2 + i])
      if (f && i + 4 < h2) {
        q.push([
          [x + 2.8, i + y2 + 0.8],
          [x - 1.2, i + y2 + 4.8],
        ])
      }
      f = !f
    }

    polylines.push(p)
    push_all(q, polylines)
  },

  cue: (elt: Element, polylines: [number, number][][]) => {
    if (!elt.pts) {
      build_cue(elt)
    }
    push_all(elt.pts, polylines)
  },

  dbg: (elt: Element, polylines: [number, number][][]) => {
    // do nothing
  },
}

// 辅助函数：将 polylines 添加到结果中
function push_all(p: [number, number][][], polylines: [number, number][][]) {
  for (let i = 0; i < p.length; i++) {
    if (p[i].length <= 1) continue
    polylines.push(p[i])
  }
}

export function hf_drawing_polylines(
  elements: Element[],
  width: number,
  height: number,
): number[][][] {
  const polylines: [number, number][][] = []

  for (let i = 0; i < elements.length; i++) {
    const elt = elements[i]
    const handler = drawing_handler[elt.tag]

    if (handler) {
      handler(elt, polylines)
    } else {
      console.warn(`Unknown element tag: ${elt.tag}`)
    }
  }

  return polylines
}

export function round_polylines(polylines: number[][][], accuracy: number = 2) {
  for (let i = 0; i < polylines.length; i++) {
    for (let j = 0; j < polylines[i].length; j++) {
      polylines[i][j][0] =
        Math.round(polylines[i][j][0] * Math.pow(10, accuracy)) /
        Math.pow(10, accuracy)
      polylines[i][j][1] =
        Math.round(polylines[i][j][1] * Math.pow(10, accuracy)) /
        Math.pow(10, accuracy)
    }
  }
}
