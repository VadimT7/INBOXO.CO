import { ThreeElements } from '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      ambientLight: any;
      directionalLight: any;
      meshStandardMaterial: any;
    }
  }
} 