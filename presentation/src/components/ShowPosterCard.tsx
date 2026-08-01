import type { ShowData } from './ShowCard';

interface ShowPosterCardProps {
  show: ShowData;
  highlighted?: boolean;
  faded?: boolean;
}

export function ShowPosterCard({ show, highlighted = false, faded = false }: ShowPosterCardProps) {
  return (
    <div
      style={{
        width: 168,
        height: 230,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        opacity: faded ? 0.3 : 1,
        cursor: 'default',
        // 3D card tilt
        transform: highlighted
          ? 'perspective(500px) rotateY(-10deg) rotateX(5deg) translateZ(10px) scale(1.06)'
          : 'perspective(500px) rotateY(-8deg) rotateX(4deg) translateZ(0px)',
        transition: 'transform 0.4s ease, box-shadow 0.4s ease',
        // Layered shadow for depth
        boxShadow: highlighted
          ? `6px 10px 28px rgba(0,0,0,0.7), -1px -1px 6px var(--glass-06), 0 0 30px ${show.color}55`
          : '5px 8px 20px rgba(0,0,0,0.6), -1px -1px 4px var(--glass-04)',
        border: highlighted ? `1px solid ${show.color}88` : '1px solid var(--glass-08)',
      }}
    >
      {/* Poster image */}
      {show.image ? (
        <img
          src={show.image}
          alt={show.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          background: `linear-gradient(135deg, ${show.color}33, ${show.color}11)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40,
        }}>
          {show.emoji}
        </div>
      )}

      {/* Bottom gradient overlay with name */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
        padding: '20px 10px 10px',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: highlighted ? show.color : '#fff',
          fontFamily: "'Space Grotesk', sans-serif",
          lineHeight: 1.25,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}>
          {show.name}
        </div>
        <div style={{
          fontSize: 9,
          color: 'var(--glass-55)',
          marginTop: 3,
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.04em',
        }}>
          {show.genre}
        </div>
      </div>

      {/* Gloss shine overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, var(--glass-12) 0%, var(--glass-04) 40%, rgba(0,0,0,0.08) 100%)',
        pointerEvents: 'none',
        borderRadius: 12,
      }} />

      {/* Highlighted winner glow ring */}
      {highlighted && (
        <div style={{
          position: 'absolute',
          inset: -1,
          borderRadius: 12,
          border: `2px solid ${show.color}`,
          boxShadow: `inset 0 0 12px ${show.color}33`,
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}
