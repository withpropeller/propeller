'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { Permission } from '@/lib/permissions'
import { PermissionGate } from '@/components/PermissionGate'
import {
  Users, UserPlus, UserMinus, Shield, Search, RotateCcw, X,
} from 'lucide-react'
import {
  Button,
  Chip,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
  Tooltip as PaxTooltip,
  toast,
} from '@/lib/pax'
import {
  useTeamControllerGetMembers,
  useTeamControllerInvite,
  useTeamControllerRevokeInvite,
  useTeamControllerDeactivate,
} from '@/apiu/team/team'
import type { ApiHydratedUser } from '@/apiu/model'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { InviteTeamMemberModal } from '@/components/ui/InviteTeamMemberModal'
import { RolePermissionsModal } from '@/components/ui/RolePermissionsModal'
import { RevokeAccessDialog } from '@/components/ui/RevokeAccessDialog'
import { formatDate, formatRelativeTime } from '@/lib/format'
import { avatarColor } from '@/lib/avatar'
import { useAuth } from '@/context/AuthContext'

function initialsFor(member: ApiHydratedUser): string {
  const first = member.firstName?.[0]
  const last  = member.lastName?.[0]
  if (first && last) return (first + last).toUpperCase()
  if (first) return first.toUpperCase()
  return (member.email?.[0] ?? '?').toUpperCase()
}

function MemberAvatar({ member }: { member: ApiHydratedUser }) {
  const color = avatarColor(member.id || member.email)
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${color}`}>
      {initialsFor(member)}
    </div>
  )
}

// ── Role helpers ─────────────────────────────────────────────────────────────
function roleLabel(roles?: unknown[]): string {
  if (!roles || roles.length === 0) return '—'
  const raw = roles[0]
  const name = typeof raw === 'string' ? raw : ((raw as any)?.name ?? (raw as any)?.slug ?? '')
  if (!name) return '—'
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function resolveRoleSlugs(roles: unknown[] | undefined): string[] {
  return (roles ?? [])
    .map((r) => (typeof r === 'string' ? r : ((r as any)?.name ?? (r as any)?.slug ?? '')))
    .filter(Boolean)
}

// ── Action buttons ───────────────────────────────────────────────────────────
function ActionIconButton({
  onClick,
  label,
  danger,
  disabled,
  children,
}: {
  onClick: () => void
  label: string
  danger?: boolean
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <TooltipProvider>
      <PaxTooltip>
        <TooltipTrigger
          type="button"
          onClick={(e) => { e.stopPropagation(); onClick() }}
          disabled={disabled}
          aria-label={label}
          className={[
            'p-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
            danger
              ? 'text-content-tertiary hover:bg-feedback-danger-light hover:text-feedback-danger-main'
              : 'text-content-tertiary hover:bg-surface-secondary hover:text-content-primary',
          ].join(' ')}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </PaxTooltip>
    </TooltipProvider>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function TeamPage() {
  const { user: currentUser } = useAuth()

  const { data, isLoading, error, refetch } = useTeamControllerGetMembers({
    expand: ['roles'],
    countTotal: true,
  })
  const members: ApiHydratedUser[] = (data as any)?.data ?? []

  const inviteMutation = useTeamControllerInvite()
  const revokeInviteMutation = useTeamControllerRevokeInvite()
  const deactivateMutation = useTeamControllerDeactivate()

  const [search, setSearch] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [showInvite, setShowInvite] = useState(false)
  const [showPermissions, setShowPermissions] = useState(false)
  const [memberToRevoke, setMemberToRevoke] = useState<ApiHydratedUser | null>(null)

  // ⌘/ focus shortcut (matches other list pages)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return members
    return members.filter((m) => {
      const name = m.fullName || [m.firstName, m.lastName].filter(Boolean).join(' ')
      return name.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
    })
  }, [members, search])

  function handleResend(member: ApiHydratedUser) {
    inviteMutation.mutate(
      { data: { email: member.email, roles: resolveRoleSlugs(member.roles as unknown[]) } },
      {
        onSuccess: () => {
          refetch()
          toast({
            title: 'Invite resent',
            description: `A new invite was sent to ${member.email}.`,
            severity: 'success',
          } as any)
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message || err?.message || 'Something went wrong.'
          toast({ title: 'Failed to resend invite', description: message, severity: 'danger' } as any)
        },
      },
    )
  }

  function handleRevoke(member: ApiHydratedUser) {
    const isPending = member.status === 'requires-activation'
    const mutation = isPending ? revokeInviteMutation : deactivateMutation
    const successTitle = isPending ? 'Invite revoked' : 'Member deactivated'
    const errorTitle = isPending ? 'Failed to revoke invite' : 'Failed to deactivate member'

    mutation.mutate(
      { id: member.id! },
      {
        onSuccess: () => {
          refetch()
          setMemberToRevoke(null)
          toast({
            title: successTitle,
            description: `${member.email} can no longer access this dashboard.`,
            severity: 'success',
          } as any)
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message || err?.message || 'Something went wrong.'
          toast({ title: errorTitle, description: message, severity: 'danger' } as any)
        },
      },
    )
  }

  const COLUMNS = [
    {
      header: 'Member',
      render: (member: ApiHydratedUser) => {
        const name =
          member.fullName ||
          [member.firstName, member.lastName].filter(Boolean).join(' ') ||
          member.email
        const isSelf = currentUser?.id === member.id
        return (
          <div className="flex items-center gap-3 min-w-0">
            <MemberAvatar member={member} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-content-primary truncate">{name}</span>
                {isSelf && (
                  <span className="text-[10px] font-medium uppercase tracking-widest px-1.5 py-0.5 rounded bg-action-primary-main/10 text-action-primary-main">
                    You
                  </span>
                )}
              </div>
              <div className="text-xs text-content-tertiary truncate">{member.email}</div>
            </div>
          </div>
        )
      },
    },
    {
      header: 'Role',
      render: (member: ApiHydratedUser) => (
        <Chip variant="status" color="secondary">{roleLabel(member.roles as unknown[])}</Chip>
      ),
    },
    {
      header: 'Status',
      render: (member: ApiHydratedUser) => <Badge variant="status" value={member.status} />,
    },
    {
      header: 'Last active',
      className: 'hidden lg:table-cell',
      render: (member: ApiHydratedUser) => (
        <span className="text-sm text-content-secondary tabular-nums">
          {member.status === 'requires-activation' ? 'Never' : formatRelativeTime(member.updatedAt)}
        </span>
      ),
    },
    {
      header: 'Joined',
      className: 'hidden md:table-cell',
      render: (member: ApiHydratedUser) => (
        <span className="text-sm text-content-secondary tabular-nums">
          {member.status === 'requires-activation'
            ? `Invited ${formatDate(member.createdAt)}`
            : formatDate(member.createdAt)}
        </span>
      ),
    },
    {
      header: '',
      className: 'w-24',
      render: (member: ApiHydratedUser) => {
        const isSelf = currentUser?.id === member.id
        if (isSelf) return null

        const pending = member.status === 'requires-activation'
        if (pending) {
          return (
            <PermissionGate permission={Permission.Team}>
              <div className="flex items-center gap-1 justify-end">
                <PermissionGate permission={Permission.TeamCreateInvite}>
                  <ActionIconButton
                    label="Resend invite"
                    onClick={() => handleResend(member)}
                    disabled={inviteMutation.isPending}
                  >
                    <RotateCcw size={14} />
                  </ActionIconButton>
                </PermissionGate>
                <PermissionGate permission={Permission.TeamDeleteInvite}>
                  <ActionIconButton
                    label="Revoke invite"
                    danger
                    onClick={() => setMemberToRevoke(member)}
                  >
                    <X size={14} />
                  </ActionIconButton>
                </PermissionGate>
              </div>
            </PermissionGate>
          )
        }

        return (
          <PermissionGate permission={Permission.TeamUpdateMember}>
            <div className="flex justify-end">
              <ActionIconButton
                label="Revoke access"
                danger
                onClick={() => setMemberToRevoke(member)}
              >
                <UserMinus size={14} />
              </ActionIconButton>
            </div>
          </PermissionGate>
        )
      },
    },
  ]

  const nameFor = (m: ApiHydratedUser) =>
    m.fullName || [m.firstName, m.lastName].filter(Boolean).join(' ') || m.email

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-content-primary leading-snug">Team</h1>
          <p className="text-sm text-content-tertiary mt-1">People with access to this dashboard.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" color="secondary" size="sm" onClick={() => setShowPermissions(true)}>
            <Shield size={14} className="mr-1.5" />
            Role permissions
          </Button>
          <PermissionGate permission={Permission.TeamCreateInvite}>
            <Button color="primary" size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus size={14} className="mr-1.5" />
              Invite member
            </Button>
          </PermissionGate>
        </div>
      </div>

      <div className="space-y-3">
        {/* Toolbar */}
        <div className="flex justify-start">
          <InputGroup className="w-60 h-8 shrink-0">
            <InputGroupAddon>
              <Search width={14} height={14} className="text-content-tertiary" />
            </InputGroupAddon>
            <InputGroupInput
              ref={searchInputRef}
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
            />
          </InputGroup>
        </div>

        {/* Table */}
        <DataTable
          data={filteredMembers}
          columns={COLUMNS}
          isLoading={isLoading}
          error={error ? ((error as any)?.message ?? 'Failed to load team members') : null}
          onRetry={refetch}
          selectable={false}
          onRowClick={() => { /* no detail view yet */ }}
          emptyState={{
            title: search ? 'No members match your search' : 'No team members yet',
            description: search
              ? 'Try a different name or email.'
              : 'Invite a teammate to collaborate on this dashboard.',
            icon: <Users width={20} height={20} />,
          }}
          resourceName="team members"
          idField="id"
        />
      </div>

      {showInvite && (
        <InviteTeamMemberModal
          onClose={() => setShowInvite(false)}
          onInvited={refetch}
        />
      )}

      {showPermissions && (
        <RolePermissionsModal onClose={() => setShowPermissions(false)} />
      )}

      {memberToRevoke && (
        <RevokeAccessDialog
          memberName={nameFor(memberToRevoke)}
          memberEmail={memberToRevoke.email}
          isPending={deactivateMutation.isPending || revokeInviteMutation.isPending}
          onClose={() => setMemberToRevoke(null)}
          onConfirm={() => handleRevoke(memberToRevoke)}
        />
      )}
    </div>
  )
}
