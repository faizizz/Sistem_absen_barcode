import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { AuthShell } from '@/layouts/AuthShell';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { Field } from '@/components/primitives/Field';
import { toast } from '@/lib/toast';
import { Eye, EyeOff, KeyRound, Lock, LogIn } from 'lucide-react';

export default function LoginPage() {
    const { data, setData, post, processing, errors } = useForm({
        login_code: '',
        password: '',
    });
    const [showPass, setShowPass] = useState(false);

    function submit(e) {
        e.preventDefault();
        if (!canSubmit) {
            toast.error('Isi kode admin dan password terlebih dahulu.');
            return;
        }
        post('/kuasa');
    }

    const canSubmit = data.login_code.trim() !== '' && data.password !== '';

    return (
        <AuthShell
            title="Masuk Konsol Admin"
            description="Akun pengurus."
        >
            <Head title="Masuk" />
            <form onSubmit={submit} className="space-y-4">
                <Field label="Kode Admin" required value={data.login_code} error={errors.login_code} htmlFor="login_code">
                    <div className="relative">
                        <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
                        <Input
                            id="login_code"
                            value={data.login_code}
                            onChange={(e) => setData('login_code', e.target.value)}
                            placeholder="admin"
                            className="pl-10"
                            autoComplete="username"
                            autoFocus
                            required
                        />
                    </div>
                </Field>

                <Field label="Password" required value={data.password} error={errors.password} htmlFor="password">
                    <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
                        <Input
                            id="password"
                            type={showPass ? 'text' : 'password'}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                            className="pl-10 pr-12"
                            autoComplete="current-password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPass((v) => !v)}
                            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[var(--radius-sm)] text-[color:var(--text-muted)] hover:bg-[color:var(--surface-base)] hover:text-[color:var(--text-primary)]"
                            aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                        >
                            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </Field>

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={processing}
                    rightIcon={<LogIn className="h-4 w-4" />}
                    className="w-full"
                >
                    Masuk
                </Button>
            </form>
        </AuthShell>
    );
}
