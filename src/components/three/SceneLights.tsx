export function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#93c5fd', '#0b0f19', 0.5]} />
      <directionalLight position={[6, 10, 6]} intensity={1.4} />
      <directionalLight position={[-6, 4, -6]} intensity={0.4} />
    </>
  );
}
