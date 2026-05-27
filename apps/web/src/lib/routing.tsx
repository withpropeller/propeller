/**
 * Shim that mimics the small slice of `next/link` and `next/navigation` the app
 * uses, on top of react-router. Lets the bulk of the codebase keep its existing
 * import patterns after migrating off Next.
 */
import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react'
import {
  Link as RRLink,
  useLocation,
  useNavigate,
  useParams as useRRParams,
  useSearchParams as useRRSearchParams,
} from 'react-router-dom'

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string
  prefetch?: boolean
  replace?: boolean
  scroll?: boolean
  children?: ReactNode
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, prefetch: _prefetch, replace, scroll: _scroll, ...rest },
  ref,
) {
  return <RRLink ref={ref} to={href} replace={replace} {...rest} />
})

export default Link

export interface NavigateOptions {
  scroll?: boolean
}

export interface NextRouter {
  push: (href: string, options?: NavigateOptions) => void
  replace: (href: string, options?: NavigateOptions) => void
  back: () => void
  forward: () => void
  refresh: () => void
  prefetch: (href: string) => void
}

export function useRouter(): NextRouter {
  const navigate = useNavigate()
  return {
    push: (href) => navigate(href),
    replace: (href) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => {
      if (typeof window !== 'undefined') window.location.reload()
    },
    prefetch: () => {},
  }
}

export function usePathname(): string {
  return useLocation().pathname
}

export function useParams<
  T extends Record<string, string | string[] | undefined> = Record<string, string>,
>(): T {
  return useRRParams() as T
}

export function useSearchParams(): URLSearchParams {
  const [params] = useRRSearchParams()
  return params
}

/**
 * Client-side analogue of next/navigation's `redirect`. Triggers a navigation
 * via react-router. Returns `never` to match Next's typing; in practice the
 * call site should not render anything after invoking.
 */
export function redirect(href: string): never {
  if (typeof window !== 'undefined') {
    window.location.href = href
  }
  throw new Error(`REDIRECT:${href}`)
}
