import { useGame } from '@/context/GameContext';

export default function FloatTexts() {
  const { floatTexts } = useGame();

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {floatTexts.map((ft) => (
        <div
          key={ft.id}
          className="floating-text text-sm"
          style={{
            left: ft.x,
            top: ft.y,
            color: ft.color,
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          {ft.text}
        </div>
      ))}
    </div>
  );
}
