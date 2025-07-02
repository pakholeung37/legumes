import mozart_turkish_march from './samples/mozart_turkish_march.txt?raw'
import beethoven_moonlight from './samples/beethoven_moonlight.txt?raw'
import bwv9_excerpt from './samples/bwv9_excerpt.txt?raw'
import chopin_berceuse from './samples/chopin_berceuse.txt?raw'
import chopin_prelude_7 from './samples/chopin_prelude_7.txt?raw'
import einsamer_wanderer from './samples/einsamer_wanderer.txt?raw'
import minuet_G from './samples/minuet_G.txt?raw'
import wu_xi_jing from './samples/wu_xi_jing.txt?raw'
import yang_guan_san_die from './samples/yang_guan_san_die.txt?raw'
import art_of_fugue from './samples/art_of_fugue.txt?raw'
import auld_lang_syne from './samples/auld_lang_syne.txt?raw'
// Sample loader utility for legumes editor
export interface SampleFile {
  name: string
  content: string
}

export const samples: Record<string, string> = {
  'mozart_turkish_march.txt': mozart_turkish_march,
  'beethoven_moonlight.txt': beethoven_moonlight,
  'bwv9_excerpt.txt': bwv9_excerpt,
  'chopin_berceuse.txt': chopin_berceuse,
  'chopin_prelude_7.txt': chopin_prelude_7,
  'einsamer_wanderer.txt': einsamer_wanderer,
  'minuet_G.txt': minuet_G,
  'wu_xi_jing.txt': wu_xi_jing,
  'yang_guan_san_die.txt': yang_guan_san_die,
  'art_of_fugue.txt': art_of_fugue,
  'auld_lang_syne.txt': auld_lang_syne,
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
