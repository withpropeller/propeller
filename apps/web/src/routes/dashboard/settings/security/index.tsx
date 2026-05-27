'use client'

import { useState } from 'react'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import {
  Button,
  Chip,
  Skeleton,
  TextInput,
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  ModalDialog,
  ModalDialogContent,
  ModalDialogHeader,
  ModalDialogTitle,
  ModalDialogDescription,
  ModalDialogBody,
  ModalDialogFooter,
  ModalDialogClose,
  toast,
} from '@/lib/pax'
import { useAuthControllerChangePassword } from '@/api/auth/auth'
import {
  useProfileControllerGetMFA,
  useProfileControllerSetup2FA,
  useProfileControllerDeactivate2FA,
  useProfileControllerUpdate2FA,
  useProfileControllerActivate2FA,
  useProfileControllerSend2FA,
} from '@/api/me/me'

// ── Password input (eye toggle) ─────────────────────────────────────────────
function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <TextInput
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        className="pr-10"
        autoFocus={autoFocus}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-content-tertiary hover:text-content-primary transition-colors"
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

// ── Shared row shell (used by Password + MFA channels) ────────────────────
function SettingRow({
  icon: Icon,
  title,
  description,
  chips,
  actions,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  title: string
  description: string
  chips?: React.ReactNode
  actions: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-surface-secondary flex items-center justify-center shrink-0 mt-0.5">
          <Icon size={16} className="text-content-secondary" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-content-primary">{title}</p>
            {chips}
          </div>
          <p className="text-xs text-content-tertiary mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">{actions}</div>
    </div>
  )
}

// ── Change Password modal ─────────────────────────────────────────────────
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '' })
  const [errors, setErrors] = useState<{ oldPassword?: string; newPassword?: string }>({})

  const { mutateAsync, isPending } = useAuthControllerChangePassword()

  function validate() {
    const e: typeof errors = {}
    if (!form.oldPassword) e.oldPassword = 'Enter your current password.'
    if (!form.newPassword) e.newPassword = 'Enter a new password.'
    else if (form.newPassword.length < 8) e.newPassword = 'Must be at least 8 characters.'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const v = validate()
    if (Object.keys(v).length > 0) {
      setErrors(v)
      return
    }
    try {
      await mutateAsync({
        data: { ...form, mfaChannel: 'email' },
      } as any)
      toast({ title: 'Password updated', severity: 'success' } as any)
      onClose()
    } catch (err: any) {
      toast({
        title: 'Failed to update password',
        description: err?.response?.data?.message || err?.message || 'Something went wrong.',
        severity: 'danger',
      } as any)
    }
  }

  function update(key: keyof typeof form, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  return (
    <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalDialogContent size="sm" showCloseButton>
        <ModalDialogHeader className="gap-1">
          <ModalDialogTitle>Update password</ModalDialogTitle>
          <ModalDialogDescription>
            Choose a strong password you don't use anywhere else.
          </ModalDialogDescription>
        </ModalDialogHeader>

        <form onSubmit={handleSubmit}>
          <ModalDialogBody className="space-y-4">
            <Field>
              <FieldLabel htmlFor="oldPassword">Current password</FieldLabel>
              <PasswordInput
                id="oldPassword"
                value={form.oldPassword}
                onChange={(v) => update('oldPassword', v)}
                placeholder="Your current password"
                autoFocus
              />
              {errors.oldPassword && <FieldError errors={[{ message: errors.oldPassword }]} />}
            </Field>

            <Field>
              <FieldLabel htmlFor="newPassword">New password</FieldLabel>
              <PasswordInput
                id="newPassword"
                value={form.newPassword}
                onChange={(v) => update('newPassword', v)}
                placeholder="Choose a strong password"
              />
              {errors.newPassword ? (
                <FieldError errors={[{ message: errors.newPassword }]} />
              ) : (
                <FieldDescription>
                  At least 8 characters. Mix upper and lowercase, a number, and a symbol.
                </FieldDescription>
              )}
            </Field>
          </ModalDialogBody>

          <ModalDialogFooter className="pt-6">
            <ModalDialogClose asChild>
              <Button type="button" variant="outline" color="secondary">
                Cancel
              </Button>
            </ModalDialogClose>
            <Button type="submit" color="primary" loading={isPending} disabled={isPending}>
              Update password
            </Button>
          </ModalDialogFooter>
        </form>
      </ModalDialogContent>
    </ModalDialog>
  )
}

// ── Enable MFA channel modal (password → OTP) ─────────────────────────────
function EnableMfaModal({
  channel,
  channelLabel,
  onClose,
  onSaved,
}: {
  channel: string
  channelLabel: string
  onClose: () => void
  onSaved: () => void
}) {
  const [step, setStep] = useState<'password' | 'otp'>('password')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')

  const setup = useProfileControllerSetup2FA()
  const send = useProfileControllerSend2FA()
  const activate = useProfileControllerActivate2FA()

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await setup.mutateAsync({ data: { channel, password } } as any)
      await send.mutateAsync({ data: { channel } } as any)
      setStep('otp')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Setup failed.')
    }
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await activate.mutateAsync({ data: { channel, token: otp } } as any)
      toast({ title: `${channelLabel} authentication enabled`, severity: 'success' } as any)
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Activation failed.')
    }
  }

  const isSending = setup.isPending || send.isPending
  const isActivating = activate.isPending

  return (
    <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalDialogContent size="sm" showCloseButton>
        <ModalDialogHeader className="gap-1">
          <ModalDialogTitle>Enable {channelLabel.toLowerCase()} authentication</ModalDialogTitle>
          <ModalDialogDescription>
            {step === 'password'
              ? 'Confirm your password to start setup.'
              : `Enter the 6-digit code we sent to your ${channelLabel.toLowerCase()}.`}
          </ModalDialogDescription>
        </ModalDialogHeader>

        {step === 'password' ? (
          <form onSubmit={handlePassword}>
            <ModalDialogBody className="space-y-4">
              <Field>
                <FieldLabel htmlFor="mfa-password">Account password</FieldLabel>
                <PasswordInput
                  id="mfa-password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Enter your password"
                  autoFocus
                />
                {error && <FieldError errors={[{ message: error }]} />}
              </Field>
            </ModalDialogBody>
            <ModalDialogFooter className="pt-6">
              <ModalDialogClose asChild>
                <Button type="button" variant="outline" color="secondary">Cancel</Button>
              </ModalDialogClose>
              <Button
                type="submit"
                color="primary"
                loading={isSending}
                disabled={!password || isSending}
              >
                Send code
              </Button>
            </ModalDialogFooter>
          </form>
        ) : (
          <form onSubmit={handleOtp}>
            <ModalDialogBody className="space-y-4">
              <Field>
                <FieldLabel htmlFor="mfa-otp">6-digit code</FieldLabel>
                <TextInput
                  id="mfa-otp"
                  value={otp}
                  onChange={(e) => setOtp((e.target as HTMLInputElement).value)}
                  placeholder="123456"
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                  className="tracking-[0.3em] font-mono"
                />
                {error && <FieldError errors={[{ message: error }]} />}
              </Field>
            </ModalDialogBody>
            <ModalDialogFooter className="pt-6">
              <Button
                type="button"
                variant="outline"
                color="secondary"
                onClick={() => { setStep('password'); setOtp(''); setError('') }}
              >
                Back
              </Button>
              <Button
                type="submit"
                color="primary"
                loading={isActivating}
                disabled={otp.length < 6 || isActivating}
              >
                Verify &amp; enable
              </Button>
            </ModalDialogFooter>
          </form>
        )}
      </ModalDialogContent>
    </ModalDialog>
  )
}

// ── Disable MFA channel modal ─────────────────────────────────────────────
function DisableMfaModal({
  channel,
  channelLabel,
  onClose,
  onSaved,
}: {
  channel: string
  channelLabel: string
  onClose: () => void
  onSaved: () => void
}) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const { mutateAsync, isPending } = useProfileControllerDeactivate2FA()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await mutateAsync({ data: { channel, password } } as any)
      toast({ title: `${channelLabel} authentication disabled`, severity: 'success' } as any)
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Could not disable.')
    }
  }

  return (
    <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalDialogContent size="sm" showCloseButton>
        <ModalDialogHeader className="gap-1">
          <ModalDialogTitle>Disable {channelLabel.toLowerCase()} authentication?</ModalDialogTitle>
          <ModalDialogDescription>
            Your account will no longer require a code at sign-in. Confirm your password to continue.
          </ModalDialogDescription>
        </ModalDialogHeader>

        <form onSubmit={handleSubmit}>
          <ModalDialogBody className="space-y-4">
            <Field>
              <FieldLabel htmlFor="disable-password">Account password</FieldLabel>
              <PasswordInput
                id="disable-password"
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                autoFocus
              />
              {error && <FieldError errors={[{ message: error }]} />}
            </Field>
          </ModalDialogBody>
          <ModalDialogFooter className="pt-6">
            <ModalDialogClose asChild>
              <Button type="button" variant="outline" color="secondary">Cancel</Button>
            </ModalDialogClose>
            <Button
              type="submit"
              color="danger"
              loading={isPending}
              disabled={!password || isPending}
            >
              Disable
            </Button>
          </ModalDialogFooter>
        </form>
      </ModalDialogContent>
    </ModalDialog>
  )
}

// ── MFA channel row ───────────────────────────────────────────────────────
type MfaState = 'off' | 'enabled' | 'default'

function MfaChannelRow({
  icon,
  label,
  description,
  state,
  onEnable,
  onDisable,
  onSetDefault,
  isBusy,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  label: string
  description: string
  state: MfaState
  onEnable: () => void
  onDisable: () => void
  onSetDefault?: () => void
  isBusy: boolean
}) {
  const chips =
    state === 'default' ? (
      <Chip variant="status" color="success" className="!bg-feedback-success-light !border-feedback-success-border">
        Default
      </Chip>
    ) : state === 'enabled' ? (
      <Chip variant="status" color="success" className="!bg-feedback-success-light !border-feedback-success-border">
        Enabled
      </Chip>
    ) : (
      <Chip variant="status" color="secondary">Off</Chip>
    )

  const actions = (
    <>
      {state === 'off' && (
        <Button variant="outline" color="secondary" size="sm" onClick={onEnable} disabled={isBusy}>
          Enable
        </Button>
      )}
      {state === 'enabled' && onSetDefault && (
        <Button variant="outline" color="secondary" size="sm" onClick={onSetDefault} disabled={isBusy}>
          Set as default
        </Button>
      )}
      {(state === 'enabled' || state === 'default') && (
        <Button variant="ghost" color="danger" size="sm" onClick={onDisable} disabled={isBusy}>
          Disable
        </Button>
      )}
    </>
  )

  return (
    <SettingRow icon={icon} title={label} description={description} chips={chips} actions={actions} />
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function SecurityPage() {
  const { data, isLoading, refetch } = useProfileControllerGetMFA()
  const channels: any[] = (data as any)?.data?.data ?? []
  const emailChannel = channels.find((c: any) => c.channel === 'email')
  const emailState: MfaState = emailChannel?.default
    ? 'default'
    : emailChannel?.enabled
    ? 'enabled'
    : 'off'

  const setDefault = useProfileControllerUpdate2FA()

  const [passwordOpen, setPasswordOpen] = useState(false)
  const [mfaAction, setMfaAction] = useState<'enable-email' | 'disable-email' | null>(null)

  async function handleSetDefault(channel: string) {
    try {
      await setDefault.mutateAsync({ data: { channel } } as any)
      toast({ title: 'Default method updated', severity: 'success' } as any)
      refetch()
    } catch (err: any) {
      toast({
        title: 'Failed to update default',
        description: err?.response?.data?.message || err?.message || 'Something went wrong.',
        severity: 'danger',
      } as any)
    }
  }

  if (isLoading) return <SecuritySkeleton />

  return (
    <div className="space-y-8 pb-16">
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-content-primary leading-snug">Security</h1>
        <p className="text-sm text-content-tertiary mt-1">
          Manage how you sign in and protect your account.
        </p>
      </div>

      {/* ── Password ──────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-lg font-semibold text-content-primary mb-4">Password</h3>

        <div className="rounded-xl border border-border-primary-light bg-surface-primary">
          <SettingRow
            icon={Lock}
            title="Account password"
            description="Used to sign in to your dashboard."
            actions={
              <Button
                variant="outline"
                color="secondary"
                size="sm"
                onClick={() => setPasswordOpen(true)}
              >
                Update password
              </Button>
            }
          />
        </div>
      </div>

      {/* ── Multi-factor authentication ──────────────────────────────── */}
      <div>
        <h3 className="text-lg font-semibold text-content-primary mb-4">
          Multi-factor authentication
        </h3>

        <div className="rounded-xl border border-border-primary-light divide-y divide-border-primary-light bg-surface-primary">
          <MfaChannelRow
            icon={Mail}
            label="Email"
            description="We'll email a 6-digit code to your registered address."
            state={emailState}
            onEnable={() => setMfaAction('enable-email')}
            onDisable={() => setMfaAction('disable-email')}
            onSetDefault={
              emailState === 'enabled' ? () => handleSetDefault('email') : undefined
            }
            isBusy={setDefault.isPending}
          />
        </div>
      </div>

      {passwordOpen && <ChangePasswordModal onClose={() => setPasswordOpen(false)} />}
      {mfaAction === 'enable-email' && (
        <EnableMfaModal
          channel="email"
          channelLabel="Email"
          onClose={() => setMfaAction(null)}
          onSaved={refetch}
        />
      )}
      {mfaAction === 'disable-email' && (
        <DisableMfaModal
          channel="email"
          channelLabel="Email"
          onClose={() => setMfaAction(null)}
          onSaved={refetch}
        />
      )}
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────
function SecuritySkeleton() {
  return (
    <div className="space-y-8 pb-16">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-[72px] rounded-xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-[72px] rounded-xl" />
      </div>
    </div>
  )
}
