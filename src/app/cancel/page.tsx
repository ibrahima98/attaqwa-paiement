export default function CancelPage() {

 
  const mobileUrl = 'attaqwa://paydunya/cancel';
  
  return (
    <html>
      <head>
        <title>Paiement annulé - At-Taqwa</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{
          __html: `
            setTimeout(() => {
              window.location.href = '${mobileUrl}';
            }, 1000);
          `
        }} />
      </head>
      <body style={{
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        margin: 0,
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px'
        }}>
          <h1 style={{ color: '#f44336', marginBottom: '1rem' }}>❌ Paiement annulé</h1>
          <p style={{ marginBottom: '1rem' }}>Votre paiement a été annulé.</p>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Vous allez être redirigé vers l&apos;application mobile...
          </p>
          <div style={{ marginTop: '2rem' }}>
            <a 
              href={mobileUrl}
              style={{
                backgroundColor: '#f44336',
                color: 'white',
                padding: '12px 24px',
                textDecoration: 'none',
                borderRadius: '5px',
                display: 'inline-block'
              }}
            >
              Retourner à l'application
            </a>
          </div>
        </div>
      </body>
    </html>
  );
} 
 
 
 