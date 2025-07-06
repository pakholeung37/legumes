const noteNames = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
const name2pitch = {};

for (let octave = 0; octave <= 10; octave++) {
  for (let i = 0; i < 12; i++) {
    const noteName = noteNames[i];
    const pitch = 12 + (octave * 12) + i;
    if (pitch > 127) continue;

    let noteStr = noteName.replace('s', '#') + '_' + octave;
    if (noteName.endsWith('s')) {
        const flatName = noteNames[(i + 1) % 12].replace('s', 'b');
        noteStr = `${noteName.replace('s','#')}_${octave}`;
        const flatStr = `${flatName}_${octave}`;
        name2pitch[`${noteName.replace('s','s')}_${octave}`] = pitch;
        name2pitch[`${flatName.replace('b','b')}_${octave}`] = pitch;

    } else {
        name2pitch[`${noteName}_${octave}`] = pitch;
    }
  }
}

const name2pitchString = JSON.stringify(name2pitch, null, 2).replace(/"/g, "'");

console.log(name2pitchString);