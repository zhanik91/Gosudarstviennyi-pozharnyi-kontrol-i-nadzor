import { emblemDataUrl } from "@/assets/emblem";

export function GovTopBanner() {
  const hasEmblem = Boolean(emblemDataUrl);

  return (
    <div className="gov-top-banner">
      <div className="gov-top-banner__content">
        <span className="gov-top-banner__text">
codex/add-header-logo-and-update-footer-text-izsg6v
          ҚАЗАҚСТАН РЕСПУБЛИКАСЫНЫҢ ТЖМ ӨРТКЕ ҚАРСЫ ҚЫЗМЕТ КОМИТЕТІ
          ҚР ТЖМ ӨРТКЕ ҚАРСЫ ҚЫЗМЕТ КОМИТЕТІ
main
        </span>
        {hasEmblem ? (
          <img
            src={emblemDataUrl}
            alt="Эмблема МЧС РК"
            className="gov-top-banner__emblem"
          />
        ) : (
          <div className="gov-top-banner__emblem gov-top-banner__emblem--placeholder" aria-hidden="true" />
        )}
        <span className="gov-top-banner__text">
          КОМИТЕТ ПРОТИВОПОЖАРНОЙ СЛУЖБЫ МЧС РК
        </span>
      </div>
    </div>
  );
}

export default GovTopBanner;
