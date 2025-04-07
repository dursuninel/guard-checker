import { useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Link } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function SteamGuard() {
  const [username, setUsername] = useState('');
  const [guardCode, setGuardCode] = useState('');
  const [gameName, setGameName] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);

  const showToast = (severity, summary, detail) => {
    toast.current.show({
      severity,
      summary,
      detail,
      life: 5000
    });
  };

  const handleError = (error) => {
    console.error('Error details:', error);
    switch (error.code) {
      case 'not-found':
        showToast('error', 'Hesap Bulunamadı', 'Belirtilen kullanıcı adına ait hesap bulunamadı.');
        break;
      case 'unauthenticated':
        showToast('error', 'Yetkilendirme Hatası', 'E-posta hesabına erişim sağlanamadı. Lütfen hesap bilgilerini kontrol edin.');
        break;
      case 'unavailable':
        showToast('error', 'Bağlantı Hatası', 'E-posta sunucusuna bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
        break;
      case 'deadline-exceeded':
        showToast('error', 'Zaman Aşımı', 'E-posta sunucusu yanıt vermedi. Lütfen tekrar deneyin.');
        break;
      case 'invalid-argument':
        showToast('error', 'Geçersiz Değer', error.message || 'Geçersiz kullanıcı adı.');
        break;
      default:
        showToast('error', 'Hata', error.message || 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const fetchGuardCode = async () => {
    if (!username || username.trim() === '') {
      showToast('warn', 'Uyarı', 'Lütfen kullanıcı adı giriniz');
      return;
    }

    setLoading(true);
    try {
      const functions = getFunctions(undefined, 'us-central1');
      const getSteamGuardCode = httpsCallable(functions, 'getSteamGuardCode');
      const requestData = { username: username.trim() };
      console.log('Gönderilen veri:', requestData);
      const result = await getSteamGuardCode(requestData);
      console.log('Gelen sonuç:', result);
      const data = result.data;

      if (data.code) {
        setGuardCode(data.code);
        setGameName(data.gamename);
        showToast('success', 'Başarılı', 'Steam Guard kodu alındı');
      } else if (data.message) {
        showToast('info', 'Bilgi', data.message);
      } else {
        showToast('info', 'Bilgi', 'Son 20 dakika içinde gelen Steam Guard kodu bulunamadı. Lütfen Steam Guard kodunun gelmesini bekleyin ve tekrar deneyin.');
      }
    } catch (error) {
      console.error('Hata detayı:', error);
      handleError(error.customData?.message ? error : { ...error, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)'
    }}>
      <Toast ref={toast} />
      <Card title="Steam Guard Kod Kontrolü" style={{ width: '400px', borderRadius: '15px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-user"></i>
            </span>
            <InputText
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Steam kullanıcı adı"
              onKeyPress={(e) => e.key === 'Enter' && fetchGuardCode()}
            />
          </div>

          <Button
            label="Kodu Al"
            icon="pi pi-refresh"
            loading={loading}
            onClick={fetchGuardCode}
          />

          {guardCode && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: '#f8f9fa',
              borderRadius: '8px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0', color: '#2d3748' }}>Steam Guard Kodu</h3>
              {gameName && (
                <div style={{
                  fontSize: '14px',
                  color: '#4a5568',
                  marginTop: '5px'
                }}>
                  {gameName}
                </div>
              )}
              <div style={{
                fontSize: '32px',
                letterSpacing: '5px',
                fontWeight: 'bold',
                color: '#1a365d',
                marginTop: '10px',
                userSelect: 'all'
              }}>
                {guardCode}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#718096',
                marginTop: '8px'
              }}>
                (Kodu kopyalamak için tıklayın)
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 