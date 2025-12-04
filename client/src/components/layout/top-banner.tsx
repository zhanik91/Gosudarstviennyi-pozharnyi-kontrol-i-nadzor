import mchsLogo from "@assets/_gluster_2024_11_7_416b29f7e40227e3786f083711ee1c4d_original.8_1764809618216.png";

export function GovTopBanner() {
  return (
    <div className="gov-top-banner" data-testid="gov-top-banner">
      <div className="gov-top-banner__content">
        <span className="gov-top-banner__text">
          ҚАЗАҚСТАН РЕСПУБЛИКАСЫ
          <br />
          ТӨТЕНШЕ ЖАҒДАЙЛАР МИНИСТРЛІГІ
        </span>
        <img
          src={mchsLogo}
          alt="Эмблема МЧС РК"
          className="gov-top-banner__emblem"
          data-testid="mchs-logo"
        />
        <span className="gov-top-banner__text">
          МИНИСТЕРСТВО ПО ЧРЕЗВЫЧАЙНЫМ
          <br />
          СИТУАЦИЯМ РЕСПУБЛИКИ КАЗАХСТАН
        </span>
      </div>
    </div>
  );
}

export default GovTopBanner;
