'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check } from 'lucide-react'
import { Alert, Button, PinInput } from '@/components/propeller'
import { AuthShell } from '@/components/auth/AuthShell'
import { useMfaVerify, useSendMfa } from '@/hooks/useAuth'
import { API_STATUS } from '@/lib/constants'
import { getAuthErrorMessage } from '@/lib/format'

const CHANNELS = [
  { value: 'email', label: 'Email', hint: 'Send to your email address' },
  { value: 'sms', label: 'SMS', hint: 'Send to your phone number' },
] as const

type ChannelValue = (typeof CHANNELS)[number]['value']

function MfaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const email = searchParams.get('email') ?? ''
  const initialStateToken = searchParams.get('stateToken') ?? ''

  const [stateToken, setStateToken] = useState(initialStateToken)
  const [otp, setOtp] = useState('')
  const [channel, setChannel] = useState<ChannelValue>('email')
  const [pickingChannel, setPickingChannel] = useState(false)
  const [pendingChannel, setPendingChannel] = useState<ChannelValue>('email')
  const [countdown, setCountdown] = useState(60)

  const verifyMutation = useMfaVerify()
  const sendMutation = useSendMfa()

  useEffect(() => {
    if (!stateToken) router.push('/auth/login')
  }, [stateToken, router])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const canResend = countdown === 0

  function handleVerify(code: string) {
    verifyMutation.mutate(
      { email, password: '', token: code, mfaChannel: channel },
      {
        onSuccess: (res) => {
          if ((res as { code?: string }).code === API_STATUS.SUCCESS) router.push('/')
        },
      },
    )
  }

  function sendCode(nextChannel: ChannelValue) {
    sendMutation.mutate(
      { stateToken, channel: nextChannel },
      {
        onSuccess: (res) => {
          const next = (res as { data?: { stateToken?: string } }).data?.stateToken
          setStateToken(next ?? stateToken)
          setChannel(nextChannel)
          setCountdown(60)
          setOtp('')
          setPickingChannel(false)
        },
      },
    )
  }

  const errorMessage =
    getAuthErrorMessage(verifyMutation.error) ??
    getAuthErrorMessage(sendMutation.error) ??
    (verifyMutation.data as { message?: string } | undefined)?.message

  if (!stateToken) return null

  const maskedEmail = email ? email.replace(/(.{2}).+(@.+)/, '$1•••$2') : ''

  if (pickingChannel) {
    return (
      <AuthShell altAction={{ label: 'Sign in', href: '/auth/login' }}>
        <div className="mb-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-warm-light mb-3">
            Two-factor
          </p>
          <h1 className="text-[32px] leading-[1.1] tracking-tight text-warm-text font-normal">
            How should we send your code?
          </h1>
        </div>

        <div
          role="radiogroup"
          aria-label="Delivery channel"
          className="rounded-[8px] border border-warm-border bg-white overflow-hidden divide-y divide-warm-border"
        >
          {CHANNELS.map((opt) => {
            const selected = pendingChannel === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setPendingChannel(opt.value)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-cream-50 focus-visible:bg-cream-50 focus-visible:outline-none"
              >
                <span
                  className={`size-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    selected
                      ? 'bg-propeller-blue-dark'
                      : 'border border-warm-border bg-white'
                  }`}
                  aria-hidden
                >
                  {selected && <Check size={10} className="text-white" strokeWidth={3} />}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-warm-text">{opt.label}</span>
                  <span className="block text-xs text-warm-muted mt-0.5">{opt.hint}</span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-6 space-y-3">
          <Button
            className="w-full"
            size="lg"
            onClick={() => sendCode(pendingChannel)}
            loading={sendMutation.isPending}
            disabled={sendMutation.isPending}
          >
            Send code
          </Button>
          <Button
            variant="ghost"
            size="md"
            className="w-full"
            onClick={() => {
              setPendingChannel(channel)
              setPickingChannel(false)
            }}
          >
            Cancel
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell altAction={{ label: 'Sign in', href: '/auth/login' }}>
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-warm-light mb-3">
          Two-factor
        </p>
        <h1 className="text-[32px] leading-[1.1] tracking-tight text-warm-text font-normal mb-3">
          Enter your 6-digit code
        </h1>
        {maskedEmail && (
          <p className="text-[15px] text-warm-muted leading-relaxed">
            Sent to <span className="font-medium text-warm-text">{maskedEmail}</span> via{' '}
            {channel === 'email' ? 'email' : 'SMS'}
          </p>
        )}
      </div>

      {errorMessage && (
        <Alert severity="danger" className="mb-5">
          {errorMessage}
        </Alert>
      )}

      <div className="space-y-6">
        <PinInput
          length={6}
          value={otp}
          onChange={setOtp}
          onComplete={handleVerify}
          disabled={verifyMutation.isPending}
          error={!!errorMessage}
          autoFocus
        />

        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={verifyMutation.isPending || otp.length < 6}
          loading={verifyMutation.isPending}
          onClick={() => handleVerify(otp)}
        >
          Verify & continue
        </Button>

        <div className="text-center text-sm text-warm-muted">
          {canResend ? (
            <button
              type="button"
              onClick={() => sendCode(channel)}
              disabled={sendMutation.isPending}
              className="font-medium text-warm-text hover:text-propeller-blue transition-colors disabled:opacity-50"
            >
              Resend code
            </button>
          ) : (
            <span>
              Didn&rsquo;t get the code? Resend in{' '}
              <span className="font-medium text-warm-text tabular-nums">{countdown}s</span>
            </span>
          )}
          <span className="mx-2 text-warm-light">·</span>
          <button
            type="button"
            onClick={() => {
              setPendingChannel(channel)
              setPickingChannel(true)
            }}
            className="font-medium text-warm-text hover:text-propeller-blue transition-colors"
          >
            Try another way
          </button>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-warm-muted">
        <Link href="/auth/login" className="font-medium text-warm-text hover:text-propeller-blue transition-colors">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  )
}

export default function MfaPage() {
  return (
    <Suspense>
      <MfaContent />
    </Suspense>
  )
}
