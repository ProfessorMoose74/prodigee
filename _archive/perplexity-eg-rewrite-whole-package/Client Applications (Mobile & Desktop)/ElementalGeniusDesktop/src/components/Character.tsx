import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
// You would have 3D models for your characters
// import { AlModel } from './models/AlModel';

const Character: React.FC<{ characterName: 'Professor Al' | 'Ella' | 'Gus' }> = ({ characterName }) => {
  return (
    <div style={{ width: '300px', height: '400px' }}>
      <Canvas>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <Suspense fallback={null}>
          {/* Load the appropriate character model */}
          {/* <AlModel /> */}
          <OrbitControls />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Character;