import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, User as UserIcon, Store as StoreIcon, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'owner' ? '/dashboard' : '/pos', { replace: true });
    }
  }, [user, navigate]);

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !password) {
      setErrorMessage('Silakan masukkan email/username dan password.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      const user = await login(loginInput.trim(), password);
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else if (user.role === 'owner') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/pos', { replace: true });
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        const msg = axiosErr.response?.data?.message ||
          (axiosErr.response?.data?.errors?.login ? axiosErr.response.data.errors.login[0] : null) ||
          'Gagal masuk. Periksa kembali akun Anda.';
        setErrorMessage(msg);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Terjadi kesalahan saat masuk.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (role: 'owner' | 'kasir') => {
    setErrorMessage(null);
    if (role === 'owner') {
      setLoginInput('owner');
      setPassword('password123');
    } else {
      setLoginInput('kasir');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* App Logo & Title */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] shadow-sm">
            <StoreIcon className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Kasirku
        </h2>
        <p className="mt-1 text-center text-sm text-[var(--color-text-muted)] font-medium">
          Aplikasi Web Kasir, Inventaris & Pembukuan UMKM
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[var(--color-surface)] py-8 px-6 sm:px-8 rounded-2xl border border-[var(--color-border)] shadow-sm transition-colors">
          {/* Error notification banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-[var(--color-danger-light)] border border-[var(--color-danger)]/30 text-[var(--color-danger)] flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="loginInput" className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1.5">
                Email atau Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="loginInput"
                  name="login"
                  type="text"
                  autoComplete="username"
                  required
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="Contoh: owner atau kasir"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-hidden focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="block w-full pl-10 pr-10 py-2.5 text-sm border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-hidden focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] focus:outline-hidden focus:ring-2 focus:ring-[var(--color-primary)]/30 transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Masuk ke Akun</span>
              )}
            </button>
          </form>

          {/* Quick test accounts for easy review */}
          <div className="mt-6 pt-5 border-t border-[var(--color-border-muted)]">
            <p className="text-xs font-medium text-[var(--color-text-muted)] text-center mb-3">
              Akun Uji Coba Cepat:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('owner')}
                className="px-3 py-2 text-xs font-medium text-[var(--color-primary)] bg-[var(--color-primary-light)] hover:bg-[var(--color-primary-muted)]/20 rounded-lg transition-colors text-center cursor-pointer border border-[var(--color-primary-muted)]/30"
              >
                Owner Toko
                <span className="block text-[11px] text-[var(--color-text-muted)] font-normal">owner / password123</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('kasir')}
                className="px-3 py-2 text-xs font-medium text-[var(--color-text-primary)] bg-[var(--color-border-muted)] hover:bg-[var(--color-border)] rounded-lg transition-colors text-center cursor-pointer border border-[var(--color-border)]"
              >
                Pegawai Kasir
                <span className="block text-[11px] text-[var(--color-text-muted)] font-normal">kasir / password123</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
