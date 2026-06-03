interface HealthBannerProps {
  message: string;
  severity: 'info' | 'warn' | 'critical';
  ctaLabel?: string;
  ctaTarget?: string;
}

export default function HealthBanner({
  message,
  severity,
  ctaLabel,
  ctaTarget
}: HealthBannerProps) {
  return (
    <div className={`health-banner health-banner--${severity}`}>
      <p className="health-banner__message">{message}</p>
      {ctaLabel && ctaTarget ? (
        <a href={ctaTarget} className="health-banner__cta">
          {ctaLabel}
        </a>
      ) : null}
    </div>
  );
}
