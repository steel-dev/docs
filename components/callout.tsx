import { AlertTriangle, Info, Star } from 'lucide-react';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { HiroSVG } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

type CalloutProps = Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'type' | 'icon'> & {
  title?: ReactNode;
  /**
   * @defaultValue info
   */
  type?: 'tip' | 'info' | 'warn' | 'help';
  icon?: ReactNode;
};

export const Callout = forwardRef<HTMLDivElement, CalloutProps>(
  ({ className, children, title, type = 'info', icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'my-6 flex flex-row items-center gap-2 rounded-lg p-4 text-sm text-foreground',
          !title && 'items-start',
          {
            tip: 'bg-[#CEEFD0] dark:bg-background dark:border dark:border-[#C2EBC4]',
            info: 'bg-[#D1E8FF] dark:bg-background dark:border dark:border-[#B3D9FF]',
            warn: 'bg-[#FDC] dark:bg-background dark:border dark:border-[#F96]',
            help: 'bg-[#EBE9E6] dark:bg-background dark:border',
          }[type],
          className,
        )}
        {...props}
      >
        {(!title && icon) ??
          {
            tip: <Star className="w-4 h-4 dark:text-[#C2EBC4]" />,
            info: <Info className="w-4 h-4 dark:text-[#B3D9FF]" />,
            warn: <AlertTriangle className="w-4 h-4 dark:text-[#F96]" />,
            help: (
              <div className="bg-primary w-fit rounded-[4px] p-[0.275rem] text-white dark:text-neutral-950 [&_svg]:size-2">
                <path d="M6.39469 3C2.863 3 0 5.73424 0 9.10709C0 12.4799 2.863 15.2142 6.39469 15.2142H13.4999C13.8923 15.2142 14.2104 15.518 14.2104 15.8928C14.2104 16.2675 13.8923 16.5713 13.4999 16.5713H0.497365C0.222678 16.5713 0 16.784 0 17.0463V21.5248C0 21.7872 0.222678 21.9998 0.497365 21.9998H13.4999C17.0316 21.9998 19.8946 19.2656 19.8946 15.8928C19.8946 12.5199 17.0316 9.78566 13.4999 9.78566H6.39469C6.00228 9.78566 5.68417 9.48186 5.68417 9.10709C5.68417 8.73233 6.00228 8.42853 6.39469 8.42853H18.4434C18.4535 8.42863 18.4636 8.42868 18.4737 8.42868H20.6053C20.9977 8.42868 21.3158 8.73248 21.3158 9.10724V21.525C21.3158 21.7873 21.5385 22 21.8132 22H26.5026C26.7773 22 27 21.7873 27 21.525V9.10724C27 5.73439 24.137 3.00015 20.6053 3.00015H19.8946V3H6.39469Z" fill="#EEEEEC"/>
              </div>
            ),
          }[type]}
        <div className="w-0 flex-1">
          <div className={cn('flex flex-row items-center gap-2', title ? 'mb-2' : 'mb-0')}>
            {title ? (
              <>
                {icon ??
                  {
                    tip: <Star className="w-4 h-4 dark:text-[#C2EBC4]" />,
                    info: <Info className="w-4 h-4 dark:text-[#B3D9FF]" />,
                    warn: <AlertTriangle className="w-4 h-4 dark:text-[#F96]" />,
                    help: (
                      <div className="bg-primary w-fit rounded-[4px] p-[0.275rem] text-white dark:text-neutral-950 [&_svg]:size-4">
                        <svg width="28" height="25" viewBox="0 0 28 25" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6.39469 3C2.863 3 0 5.73424 0 9.10709C0 12.4799 2.863 15.2142 6.39469 15.2142H13.4999C13.8923 15.2142 14.2104 15.518 14.2104 15.8928C14.2104 16.2675 13.8923 16.5713 13.4999 16.5713H0.497365C0.222678 16.5713 0 16.784 0 17.0463V21.5248C0 21.7872 0.222678 21.9998 0.497365 21.9998H13.4999C17.0316 21.9998 19.8946 19.2656 19.8946 15.8928C19.8946 12.5199 17.0316 9.78566 13.4999 9.78566H6.39469C6.00228 9.78566 5.68417 9.48186 5.68417 9.10709C5.68417 8.73233 6.00228 8.42853 6.39469 8.42853H18.4434C18.4535 8.42863 18.4636 8.42868 18.4737 8.42868H20.6053C20.9977 8.42868 21.3158 8.73248 21.3158 9.10724V21.525C21.3158 21.7873 21.5385 22 21.8132 22H26.5026C26.7773 22 27 21.7873 27 21.525V9.10724C27 5.73439 24.137 3.00015 20.6053 3.00015H19.8946V3H6.39469Z" fill="currentColor"/>
  </svg>
                      </div>
                    ),
                  }[type]}
                <div
                  className={cn(
                    'font-medium',
                    {
                      tip: 'text-foreground dark:text-[#C2EBC4]',
                      info: 'text-foreground dark:text-[#B3D9FF]',
                      warn: 'text-foreground dark:text-[#F96]',
                      help: 'font-bold text-foreground dark:text-[#EBE9E6]',
                    }[type],
                  )}
                >
                  {title}
                </div>
              </>
            ) : null}
          </div>
          <div
            className={cn(
              'callout [&_p]:m-0 [&_p]:leading-[1.5rem] [&_p_code]:bg-transparent [&_p_code]:border-0 [&_p_code]:p-0',
              type === 'help' && 'text-muted-foreground',
            )}
          >
            {children}
          </div>
        </div>
      </div>
    );
  },
);

Callout.displayName = 'Callout';
