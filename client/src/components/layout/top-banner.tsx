import { MchsEmblem } from "@/components/mchs-emblem";

export function GovTopBanner() {
  return (
    <div className="gov-top-banner" data-testid="gov-top-banner">
      <div className="gov-top-banner__content">
        <span className="gov-top-banner__text">
          ҚАЗАҚСТАН РЕСПУБЛИКАСЫ
          <br />
          ТӨТЕНШЕ ЖАҒДАЙЛАР МИНИСТРЛІГІ
        </span>
        <MchsEmblem
          className="gov-top-banner__emblem"
          data-testid="mchs-logo"
          title="Эмблема МЧС РК"
        />
        <span className="gov-top-banner__text">
          МИНИСТЕРСТВО ПО ЧРЕЗВЫЧАЙНЫМ
          <br />
          СИТУАЦИЯМ РЕСПУБЛИКИ КАЗАХСТАН
        </span>
      </div>
      <div className="gov-top-banner__subtitle">
        Комитет противопожарной службы МЧС РК
      </div>
    </div>
  );
}

export default GovTopBanner;
