import { CONFIG } from './config'
import { Score } from './type'
import { slot_pos } from './utils'

export function playhead_coords(
  score: Score,
  time_in_64th: number,
): [number, number, number, number] {
  let time = Math.max(0, time_in_64th)
  let T = 0
  let i: number
  for (i = 0; i < score.measures.length; i++) {
    if (time < T + score.measures[i].duration) {
      break
    }
    T += score.measures[i].duration
  }
  if (i >= score.measures.length) {
    return playhead_coords(score, T - 0.01)
  }
  let measure = score.measures[i]
  let t = time - T
  let it = ~~t
  let ft = t - it
  let x0 = slot_pos(measure, it)
  let x1: number
  if (measure.slots[it + 1]) {
    x1 = slot_pos(measure, it + 1)
  } else if (score.measures[i + 1] && !score.measures[i + 1].is_first_col) {
    x1 = measure.staves[0].coords.w + slot_pos(score.measures[i + 1], 0)
  } else {
    x1 = measure.staves[0].coords.w
  }
  let xf = x0 * (1 - ft) + x1 * ft
  let x = measure.staves[0].coords.x + xf + CONFIG.PAGE_MARGIN_X
  let dy = get_content_yoffset(score)
  let y0 = dy + measure.staves[0].coords.y
  let y1 =
    dy +
    measure.staves[measure.staves.length - 1].coords.y +
    CONFIG.LINE_HEIGHT * (CONFIG.LINES_PER_STAFF - 1)
  return [x, y0, x, y1]
}

export function get_content_yoffset(score: Score) {
  let dy = CONFIG.PAGE_MARGIN_Y
  for (let i = 0; i < score.title.length; i++) {
    let h = i ? CONFIG.SUBTITLE_TEXT_SIZE : CONFIG.TITLE_TEXT_SIZE
    dy += h + CONFIG.TITLE_LINE_SPACING
  }
  if (score.tempo || score.composer.length) {
    dy += CONFIG.TITLE_LINE_SPACING
    if (score.composer.length) {
      let h = CONFIG.TEMPO_COMPOSER_TEXT_SIZE
      for (let i = 0; i < score.composer.length; i++) {
        dy += CONFIG.TEMPO_COMPOSER_TEXT_SIZE + 4
      }
      dy -= CONFIG.TEMPO_COMPOSER_TEXT_SIZE + 4
    }
    dy += CONFIG.TEMPO_COMPOSER_TEXT_SIZE
  }
  dy += CONFIG.TITLE_LINE_SPACING * 1.2
  return dy
}
