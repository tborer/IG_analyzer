import { ImageResponse } from 'next/og';
import { SITE_NAME } from '@/lib/site';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: '#12151C',
          padding: '80px',
        }}
      >
        <div
          style={{
            color: '#C89B3C',
            fontSize: 28,
            letterSpacing: 4,
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          Instagram Audit
        </div>
        <div style={{ color: '#EDE9E0', fontSize: 96, fontWeight: 700, lineHeight: 1.1 }}>
          {SITE_NAME}
        </div>
        <div style={{ color: '#8B93A1', fontSize: 34, marginTop: 28, maxWidth: 820 }}>
          For a different class of dating.
        </div>
      </div>
    ),
    { ...size }
  );
}
