// src/data/modelMetrics.js
// Test-set results of the species model, shown on the "About the model" page.
// Values must come from your evaluation report - do not estimate them.
//
// Source: per-class report of the held-out test set (1,009 photos) and the
// confusion matrix in public/model/confusion_matrix.png. Accuracy per species
// is one-vs-rest: (TP + TN) / all test photos.
export const MODEL_METRICS = {
  architecture: 'MobileNetV3 (transfer learning), converted to TensorFlow.js with float16 weight quantization',
  inputSize: '320 x 320 pixels',
  overallAccuracy: 96.9, // %, 978 of 1,009 test photos correct
  minimumPerSpecies: 85, // every species reached at least this on all four metrics
  confidenceThreshold: 70, // % - below this the app says "not sure, retake"
  gateThreshold: 87, // % - below this the gate says "doesn't look like seagrass"
  confusionMatrixImage: '/model/confusion_matrix.png',
  perSpecies: [
    { species: 'Cymodocea rotundata', testImages: 50, accuracy: 99.70, precision: 94.34, recall: 100, f1: 97.09 },
    { species: 'Cymodocea serrulata', testImages: 118, accuracy: 99.11, precision: 100, recall: 92.37, f1: 96.04 },
    { species: 'Enhalus acoroides', testImages: 152, accuracy: 99.70, precision: 100, recall: 98.03, f1: 99.00 },
    { species: 'Halodule pinifolia', testImages: 95, accuracy: 98.02, precision: 87.13, recall: 92.63, f1: 89.80 },
    { species: 'Halodule uninervis', testImages: 131, accuracy: 99.80, precision: 98.50, recall: 100, f1: 99.24 },
    { species: 'Halophila minor', testImages: 29, accuracy: 99.80, precision: 100, recall: 93.10, f1: 96.43 },
    { species: 'Halophila ovalis', testImages: 217, accuracy: 99.80, precision: 99.09, recall: 100, f1: 99.54 },
    { species: 'Syringodium isoetifolium', testImages: 91, accuracy: 98.22, precision: 90.11, recall: 90.11, f1: 90.11 },
    { species: 'Thalassia hemprichii', testImages: 126, accuracy: 99.70, precision: 98.43, recall: 99.21, f1: 98.81 },
  ],
};
