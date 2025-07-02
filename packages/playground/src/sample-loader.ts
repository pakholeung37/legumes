import mozart_turkish_march from './samples/mozart_turkish_march.txt?raw'
import beethoven_moonlight from './samples/beethoven_moonlight.txt?raw'
// Sample loader utility for legumes editor
export interface SampleFile {
  name: string
  content: string
}

export const samples: Record<string, string> = {
  'mozart_turkish_march.txt': mozart_turkish_march,
  'beethoven_moonlight.txt': beethoven_moonlight,
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
