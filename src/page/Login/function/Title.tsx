import { Canvas } from "@react-three/fiber";
import { Center, Float, Text } from "@react-three/drei";

interface Title3DProps {
  text?: string;
}

function Title({ text = "智链采" }: Title3DProps) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 620,
        height: 120,
        background: "transparent",
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 9], fov: 24 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[3, 4, 5]} intensity={2.2} color="#9ad7ff" />
        <directionalLight position={[-4, -2, 3]} intensity={1.6} color="#ff7e9b" />

        <Float speed={1.8} rotationIntensity={0.12} floatIntensity={0.8}>
          <Center>
            <group>
              <Text
                position={[-2.25, 0, 0.2]}
                fontSize={0.82}
                letterSpacing={0.04}
                color="#60a5fa"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.05}
                outlineColor="#dbeafe"
                fillOpacity={1}
              >
                {text}
              </Text>

              <Text
                position={[2.1, 0, -0.3]}
                fontSize={0.88}
                letterSpacing={0.05}
                color="#fb7185"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.05}
                outlineColor="#ffe4e6"
                fillOpacity={1}
              >
                Z-LINK
              </Text>

              <Text
                position={[2.1, 0, -0.9]}
                fontSize={0.88}
                letterSpacing={0.05}
                color="#fda4af"
                anchorX="center"
                anchorY="middle"
                fillOpacity={0.22}
              >
                Z-LINK
              </Text>
            </group>
          </Center>
        </Float>
      </Canvas>
    </div>
  );
}

export default Title;
