# events

## Intent

### Goals

- **DO** convert (x,y) points to vexflow elements in the rendering.
- **DO** provide a single event listener on the SVG for handling user interactions.
- **DO** connect the rendering output to user interactions.

### Non-goals

- **DO NOT** depend on the MusicXML document to make calculations.
- **DO NOT** declare events — other modules should declare the events they need.

## Design

vexml uses a single event listener for an entire score. See https://github.com/stringsync/vexml/issues/159#issuecomment-2144005865.
