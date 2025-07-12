export const SAMPLE_GLOBS = {
  ...import.meta.glob('./samples/*.leg', { query: '?raw', import: 'default' }),
  ...import.meta.glob('./samples/*.musicxml', {
    query: '?raw',
    import: 'default',
  }),
}

console.log('SAMPLE_GLOBS:', SAMPLE_GLOBS)

export const SAMPLES = Object.keys(SAMPLE_GLOBS)

console.log('SAMPLES:', SAMPLES)

export const loadSample = async (name: string): Promise<string> => {
  if (!SAMPLE_GLOBS[name]) {
    throw new Error(`Sample "${name}" not found`)
  }
  return (await SAMPLE_GLOBS[name]()) as string
}
