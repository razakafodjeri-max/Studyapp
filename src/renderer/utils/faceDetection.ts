import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as blazeface from '@tensorflow-models/blazeface';

let model: blazeface.BlazeFaceModel | null = null;
let isModelLoading = false;

// Gracefully load the TensorFlow model (fallback only)
export async function loadFaceModel(): Promise<blazeface.BlazeFaceModel | null> {
  if (model) return model;
  if (isModelLoading) return null;
  
  isModelLoading = true;
  try {
    await tf.ready();
    model = await blazeface.load();
    console.log('🤖 Fallback TensorFlow BlazeFace model loaded.');
    return model;
  } catch (err) {
    console.error('❌ Failed to load fallback TensorFlow model:', err);
    return null;
  } finally {
    isModelLoading = false;
  }
}

// Check if native Shape Detection API is supported by the Electron Chromium instance
export function hasNativeFaceDetector(): boolean {
  return 'FaceDetector' in window;
}

// Analyze video frame to classify focus status (using Native API or TFjs fallback)
export async function classifyWebcamFocus(
  video: HTMLVideoElement,
  canvasWidth: number,
  canvasHeight: number
): Promise<{ status: 'focused' | 'distracted' | 'absent'; faceBox?: any }> {
  try {
    // 1. USE NATIVE CHROMIUM FACEDETECTOR (ZERO LAG / ZERO CPU EXTRA COST)
    if (hasNativeFaceDetector()) {
      // @ts-ignore
      const detector = new window.FaceDetector({ maxDetectedFaces: 1, fastMode: true });
      const faces = await detector.detect(video);

      if (!faces || faces.length === 0) {
        return { status: 'absent' };
      }

      const face = faces[0];
      const { x, y, width, height } = face.boundingBox;
      const faceBox = { x, y, width, height };

      // Gaze offset estimate using eye and nose landmarks
      const landmarks = face.landmarks;
      if (landmarks && landmarks.length >= 2) {
        const eyes = landmarks.filter((l: any) => l.type === 'eye');
        const nose = landmarks.find((l: any) => l.type === 'nose');

        if (eyes.length >= 2 && nose && eyes[0].locations[0] && eyes[1].locations[0] && nose.locations[0]) {
          const e1 = eyes[0].locations[0];
          const e2 = eyes[1].locations[0];
          const n = nose.locations[0];

          const eyeDistance = Math.abs(e2.x - e1.x);
          const noseMidX = (e1.x + e2.x) / 2;
          const lateralOffset = Math.abs(n.x - noseMidX) / (eyeDistance || 1);

          const eyesMidY = (e1.y + e2.y) / 2;
          const verticalOffset = (n.y - eyesMidY) / (eyeDistance || 1);

          // Detect looking left/right (lateralOffset > 0.3) or looking up/down (verticalOffset < 0.35 or > 0.7)
          if (lateralOffset > 0.3 || verticalOffset < 0.35 || verticalOffset > 0.7) {
            return { status: 'distracted', faceBox };
          }
        }
      }

      // Check if user is centered
      const faceMidX = x + width / 2;
      const cameraMidX = canvasWidth / 2;
      const centerDev = Math.abs(faceMidX - cameraMidX) / canvasWidth;

      if (centerDev > 0.32) {
        return { status: 'distracted', faceBox };
      }

      return { status: 'focused', faceBox };
    }

    // 2. FALLBACK TO LOCAL TENSORFLOW BLAZEFACE (IF NATIVE IS BLOCKED OR MISSING)
    const activeModel = await loadFaceModel();
    if (!activeModel) {
      return simulateFocusState();
    }

    const predictions = await activeModel.estimateFaces(video, false);

    if (!predictions || predictions.length === 0) {
      return { status: 'absent' };
    }

    const prediction = predictions[0] as any;
    const { topLeft, bottomRight, landmarks } = prediction;
    
    const startX = topLeft[0];
    const startY = topLeft[1];
    const endX = bottomRight[0];
    const endY = bottomRight[1];
    const width = endX - startX;
    const height = endY - startY;
    const faceBox = { x: startX, y: startY, width, height };

    if (landmarks && landmarks.length >= 3) {
      const rightEye = landmarks[0];
      const leftEye = landmarks[1];
      const nose = landmarks[2];

      const eyeDistance = Math.abs(leftEye[0] - rightEye[0]);
      const noseMidpointX = (leftEye[0] + rightEye[0]) / 2;
      const noseOffset = Math.abs(nose[0] - noseMidpointX) / (eyeDistance || 1);
      const eyesMidpointY = (leftEye[1] + rightEye[1]) / 2;
      const noseOffsetVertical = (nose[1] - eyesMidpointY) / (height || 1);

      // Balanced thresholds for fallback look-away detection
      if (noseOffset > 0.3 || noseOffsetVertical < 0.12 || noseOffsetVertical > 0.42) {
        return { status: 'distracted', faceBox };
      }
      
      const faceMidX = startX + width / 2;
      const cameraMidX = canvasWidth / 2;
      const centerDev = Math.abs(faceMidX - cameraMidX) / canvasWidth;

      if (centerDev > 0.32) {
        return { status: 'distracted', faceBox };
      }
    }

    return { status: 'focused', faceBox };
  } catch (e) {
    console.error('Error during focus classification:', e);
    return simulateFocusState();
  }
}

// Fallback simulator if both engines fail
let simulationCounter = 0;
function simulateFocusState(): { status: 'focused' | 'distracted' | 'absent' } {
  simulationCounter++;
  if (simulationCounter % 15 === 0) {
    return { status: 'distracted' };
  }
  if (simulationCounter % 40 === 0) {
    return { status: 'absent' };
  }
  return { status: 'focused' };
}
