import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, AlertDescription, Button, PinInput } from '@/lib/pax'
import { Check } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import { useMfaVerify, useSendMfa } from '@/hooks/useAuth'
import { API_STATUS } from '@/lib/constants'
import { getAuthErrorMessage } from '@/lib/format'

const CHANNELS = [
  { value: 'email', label: 'Email', hint: 'Send to your email address' },
  { value: 'sms', label: 'SMS', hint: 'Send to your phone number' },
] as const

type ChannelValue = (typeof CHANNELS)[number]['value']

export default function MfaPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

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
    if (!stateToken) navigate('/auth/login')
  }, [stateToken, navigate])

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
        onSuccess: (res: any) => {
          if (res.code === API_STATUS.SUCCESS) navigate('/')
        },
      }
    )
  }

  function sendCode(nextChannel: ChannelValue) {
    sendMutation.mutate(
      { stateToken, channel: nextChannel },
      {
        onSuccess: (res: any) => {
          setStateToken(res.data?.stateToken ?? stateToken)
          setChannel(nextChannel)
          setCountdown(60)
          setOtp('')
          setPickingChannel(false)
        },
      }
    )
  }

  const errorMessage =
    getAuthErrorMessage(verifyMutation.error) ??
    getAuthErrorMessage(sendMutation.error) ??
    (verifyMutation.data as any)?.message

  if (!stateToken) return null

  const maskedEmail = email ? email.replace(/(.{2}).+(@.+)/, '$1•••$2') : ''

  if (pickingChannel) {
    return (
      <AuthShell altAction={{ label: 'Sign in', href: '/auth/login' }}>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-content-primary leading-tight">
            How should we send
            <br />
            your code?
          </h1>
        </div>

        <div
          role="radiogroup"
          aria-label="Delivery channel"
          className="rounded-lg border border-border-primary-main bg-surface-primary divide-y divide-border-primary-light overflow-hidden"
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
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-secondary focus-visible:bg-surface-secondary focus-visible:outline-none"
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    selected
                      ? 'bg-action-primary-main'
                      : 'border border-border-tertiary-main bg-surface-primary'
                  }`}
                  aria-hidden
                >
                  {selected && <Check size={10} className="text-white" strokeWidth={3} />}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-content-primary">
                    {opt.label}
                  </span>
                  <span className="block text-xs text-content-tertiary mt-0.5">
                    {opt.hint}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-6 space-y-3">
          <Button
            variant="default"
            className="w-full"
            onClick={() => sendCode(pendingChannel)}
            loading={sendMutation.isPending}
            disabled={sendMutation.isPending}
          >
            Send code
          </Button>
          <Button
            variant="ghost"
            color="secondary"
            size="sm"
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
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-content-primary leading-tight">
          Enter verification code
        </h1>
        <p className="text-sm text-content-secondary mt-2">
          We sent a code to {maskedEmail} via {channel}
        </p>
      </div>

      {errorMessage && (
        <Alert severity="danger" className="mb-6">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center mb-8">
        <PinInput
          length={6}
          onComplete={handleVerify}
          disabled={verifyMutation.isPending}
        />
      </div>

      <div className="text-center space-y-3">
        {canResend ? (
          <>
            <button
              type="button"
              onClick={() => sendCode(channel)}
              disabled={sendMutation.isPending}
              className="text-sm font-medium text-content-secondary hover:text-content-primary transition-colors disabled:opacity-50"
            >
              {sendMutation.isPending ? 'Sending…' : 'Resend code'}
            </button>
            <br />
          </>
        ) : (
          <p className="text-sm text-content-tertiary">
            Resend code in {countdown}s
          </p>
        )}
        <button
          type="button"
          onClick={() => setPickingChannel(true)}
          className="text-sm font-medium text-content-secondary hover:text-content-primary transition-colors"
        >
          Try a different method
        </button>
      </div>
    </AuthShell>
  )
}
