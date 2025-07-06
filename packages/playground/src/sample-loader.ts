import mozart_turkish_march from './samples/mozart_turkish_march.leg?raw'
import beethoven_moonlight from './samples/beethoven_moonlight.leg?raw'
import bwv9_excerpt from './samples/bwv9_excerpt.leg?raw'
import chopin_berceuse from './samples/chopin_berceuse.leg?raw'
import chopin_prelude_7 from './samples/chopin_prelude_7.leg?raw'
import einsamer_wanderer from './samples/einsamer_wanderer.leg?raw'
import minuet_G from './samples/minuet_G.leg?raw'
import wu_xi_jing from './samples/wu_xi_jing.leg?raw'
import yang_guan_san_die from './samples/yang_guan_san_die.leg?raw'
import art_of_fugue from './samples/art_of_fugue.leg?raw'
import auld_lang_syne from './samples/auld_lang_syne.leg?raw'
import one_summers_day from './samples/one_summers_day.musicxml?raw'
import mozart_piano_sonata from './samples/mozart_piano_sonata.musicxml?raw'
// Sample loader utility for legumes editor
export interface SampleFile {
  name: string
  content: string
}

export const samples: Record<string, string> = {
  'mozart_turkish_march.leg': mozart_turkish_march,
  'beethoven_moonlight.leg': beethoven_moonlight,
  'bwv9_excerpt.leg': bwv9_excerpt,
  'chopin_berceuse.leg': chopin_berceuse,
  'chopin_prelude_7.leg': chopin_prelude_7,
  'einsamer_wanderer.leg': einsamer_wanderer,
  'minuet_G.leg': minuet_G,
  'wu_xi_jing.leg': wu_xi_jing,
  'yang_guan_san_die.leg': yang_guan_san_die,
  'art_of_fugue.leg': art_of_fugue,
  'auld_lang_syne.leg': auld_lang_syne,
  'one_summers_day.musicxml': one_summers_day,
  'mozart_piano_sonata.musicxml': mozart_piano_sonata,
}

export const getSampleNames = (samples: Record<string, string>): string[] => {
  return Object.keys(samples).sort()
}

export const getSampleContent = (
  samples: Record<string, string>,
  name: string,
): string | null => {
  return samples[name] || null
}
