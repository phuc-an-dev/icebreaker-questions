import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export const alt = 'Để mình hiểu nhau hơn - Icebreaker Questions';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow Spheres */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            left: '20%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0) 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-15%',
            right: '20%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(168, 85, 247, 0) 70%)',
          }}
        />

        {/* Top Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 24px',
            borderRadius: '9999px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(96, 165, 250, 0.35)',
            color: '#60a5fa',
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '28px',
          }}
        >
          <span>✨ 230+ CÂU HỎI KẾT NỐI ĐỘI NGŨ ✨</span>
        </div>

        {/* Main Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 900,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.15,
            letterSpacing: '-1.5px',
            marginBottom: '20px',
            textShadow: '0 4px 24px rgba(0, 0, 0, 0.6)',
          }}
        >
          Để mình hiểu nhau hơn
        </div>

        {/* Subtitle / Description */}
        <div
          style={{
            fontSize: '26px',
            fontWeight: 400,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.45,
            marginBottom: '38px',
          }}
        >
          Bộ câu hỏi mình tổng hợp cho các buổi gặp mặt, hội nhóm để mấy ní đỡ phải suy nghĩ phải hỏi gì
        </div>

        {/* Cards Row Preview */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              padding: '14px 22px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#38bdf8',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            🎲 Roulette Vòng Quay
          </div>
          <div
            style={{
              padding: '14px 22px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#a78bfa',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            🎤 Chế Độ Sân Khấu (Stage View)
          </div>
          <div
            style={{
              padding: '14px 22px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#34d399',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            🎯 8 Chủ Đề Đa Dạng
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
