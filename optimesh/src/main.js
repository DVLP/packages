import { meshSimplifier } from './MeshSimplifier';

function editorAction(editor) {
  if (!editor.selected) {
    return alert('select an object');
  }
  if (!editor.selected.isMesh) {
    return alert('select valid geometry');
  }

  const selected = editor.selected;

  meshSimplifier(editor.selected.geometry, 0.5).then(simplified => {
    selected.geometry = simplified;
  });
}

const editorPlugin = {
  name: 'optimesh',
  humanName: 'OptiMesh',
  nativeAction: meshSimplifier,
  editorAction: editorAction,
};

const OptiMesh = {
  meshSimplifier,
  editorPlugin
};

export default { OptiMesh };
export { meshSimplifier };
export { editorPlugin };
