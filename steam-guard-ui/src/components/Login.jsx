import { useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Password } from 'primereact/password';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);
  const navigate = useNavigate();

  const showToast = (severity, summary, detail) => {
    toast.current.show({
      severity,
      summary,
      detail,
      life: 3000
    });
  };

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // Form validasyonu
    if (!email || !password) {
      showToast('warn', 'Uyarı', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (!validateEmail(email)) {
      showToast('warn', 'Uyarı', 'Geçerli bir e-posta adresi girin');
      return;
    }

    if (password.length < 6) {
      showToast('warn', 'Uyarı', 'Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      showToast('success', 'Başarılı', 'Giriş yapıldı');
      setTimeout(() => navigate('/admin'), 1000);
    } catch (error) {
      console.error('Giriş hatası:', error);
      let errorMessage = 'Giriş yapılamadı';
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Geçersiz e-posta adresi';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Bu hesap devre dışı bırakılmış';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Hatalı şifre';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin';
          break;
        case 'auth/internal-error':
          errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'E-posta veya şifre hatalı';
          break;
        default:
          errorMessage = 'Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin';
      }
      showToast('error', 'Hata', errorMessage);
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
      <Card title="Admin Girişi" style={{ width: '400px', borderRadius: '15px' }}>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-user"></i>
            </span>
            <InputText
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta"
              type="email"
              className="p-inputtext-sm"
            />
          </div>

          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-lock"></i>
            </span>
            <Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre"
              feedback={false}
              toggleMask
              className="p-inputtext-sm w-full"
              inputClassName="w-full"
              pt={{
                input: { className: 'w-full' }
              }}
            />
          </div>

          <Button
            label="Giriş Yap"
            icon="pi pi-sign-in"
            loading={loading}
            type="submit"
            className="p-button-sm"
          />
        </form>
      </Card>
    </div>
  );
} 