window = {};
window.Tooth3DViewer = function() {};
try {
  Object.assign(window, { Tooth3DViewer });
  console.log("Success");
} catch(e) {
  console.error(e);
}
