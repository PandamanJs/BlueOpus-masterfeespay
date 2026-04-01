import svgPaths from "./svg-9jggie13xs";
import imgMasterFeesSocialMediaLogoRemovebgPreviewRemovebgPreview1 from "figma:asset/15208e289d877eb8334ae7c27ebdb81b421618d1.png";

function Icon4({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="absolute left-[15.99px] size-[15.988px] top-[19.58px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.9884 15.9884">
        {children}
      </svg>
    </div>
  );
}

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="absolute bg-[#f5f4f7] h-[55.146px] left-0 rounded-[16.4px] top-0 w-[317.165px]">
      <div className="content-stretch flex items-center overflow-clip pl-[44px] pr-[16px] py-[14px] relative rounded-[inherit] size-full">
        <p className="font-['Segoe_UI:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[16px] text-[rgba(0,0,0,0.3)] text-nowrap tracking-[-0.176px]">{children}</p>
      </div>
      <div aria-hidden="true" className="absolute border-[1.601px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[16.4px]" />
    </div>
  );
}
type Text1Props = {
  text: string;
};

function Text1({ text }: Text1Props) {
  return <Wrapper>{text}</Wrapper>;
}
type LabelTextProps = {
  text: string;
};

function LabelText({ text }: LabelTextProps) {
  return (
    <div className="h-[20.017px] relative shrink-0 w-full">
      <p className="absolute font-['IBM_Plex_Sans:Medium',sans-serif] leading-[20px] left-[3.98px] not-italic text-[14px] text-[rgba(0,54,48,0.7)] text-nowrap top-[0.6px] tracking-[-0.176px]">{text}</p>
    </div>
  );
}

function Container() {
  return <div className="absolute border-[#e6e6e6] border-[0px_0px_1.601px] border-solid h-[72.986px] left-0 top-0 w-[416.348px]" data-name="Container" />;
}

function Paragraph() {
  return (
    <div className="absolute content-stretch flex h-[30.425px] items-start left-[46.96px] top-[0.28px] w-[110.467px]" data-name="Paragraph">
      <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#003630] text-[20px] text-nowrap tracking-[-0.3px]">master-fees</p>
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute h-[30.976px] left-[113px] top-[16.99px] w-[157.432px]" data-name="Container">
      <div className="absolute left-[-3px] size-[43px] top-[-7px]" data-name="Master-fees_social_media_Logo-removebg-preview-removebg-preview 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgMasterFeesSocialMediaLogoRemovebgPreviewRemovebgPreview1} />
      </div>
      <Paragraph />
    </div>
  );
}

function Container2() {
  return (
    <div className="bg-white h-[72.986px] relative shrink-0 w-full" data-name="Container">
      <Container />
      <Container1 />
    </div>
  );
}

function Container3() {
  return <div className="h-[377.416px] shrink-0 w-full" data-name="Container" />;
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[23.995px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23.9951 23.9951">
        <g id="Icon">
          <path d={svgPaths.p3da4f000} id="Vector" stroke="var(--stroke-0, #003630)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.99959" />
          <path d={svgPaths.p1f6d2c00} id="Vector_2" stroke="var(--stroke-0, #003630)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.99959" />
        </g>
      </svg>
    </div>
  );
}

function Container4() {
  return (
    <div className="relative rounded-[24px] shadow-[0px_10px_15px_-3px_rgba(149,227,108,0.2),0px_4px_6px_-4px_rgba(149,227,108,0.2)] shrink-0 size-[47.99px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center pl-0 pr-[0.025px] py-0 relative size-full">
        <Icon />
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div className="h-[27.973px] relative shrink-0 w-[152.853px]" data-name="Heading 2">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['IBM_Plex_Sans:SemiBold',sans-serif] leading-[28px] left-0 not-italic text-[#003630] text-[18px] text-nowrap top-[-1.4px] tracking-[-0.396px]">Parent Information</p>
      </div>
    </div>
  );
}

function RegistrationFormPage() {
  return (
    <div className="content-stretch flex gap-[11.985px] h-[47.99px] items-center relative shrink-0 w-full" data-name="RegistrationFormPage">
      <Container4 />
      <Heading />
    </div>
  );
}

function TextInput() {
  return <Wrapper>{`Enter parent's full name`}</Wrapper>;
}

function Icon1() {
  return (
    <Icon4>
      <g id="Icon">
        <path d={svgPaths.p5427000} id="Vector" stroke="var(--stroke-0, #003630)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.3" strokeWidth="1.33237" />
        <path d={svgPaths.p36b6ae80} id="Vector_2" stroke="var(--stroke-0, #003630)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.3" strokeWidth="1.33237" />
      </g>
    </Icon4>
  );
}

function Container5() {
  return (
    <div className="h-[55.146px] relative shrink-0 w-full" data-name="Container">
      <TextInput />
      <Icon1 />
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex flex-col gap-[7.982px] h-[83.145px] items-start relative shrink-0 w-full" data-name="Container">
      <LabelText text="Full Name" />
      <Container5 />
    </div>
  );
}

function Icon2() {
  return (
    <Icon4>
      <g clipPath="url(#clip0_244_79)" id="Icon">
        <path d={svgPaths.p24d51600} id="Vector" stroke="var(--stroke-0, #003630)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.3" strokeWidth="1.33237" />
        <path d={svgPaths.p341ed680} id="Vector_2" stroke="var(--stroke-0, #003630)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.3" strokeWidth="1.33237" />
      </g>
      <defs>
        <clipPath id="clip0_244_79">
          <rect fill="white" height="15.9884" width="15.9884" />
        </clipPath>
      </defs>
    </Icon4>
  );
}

function Container7() {
  return (
    <div className="h-[55.146px] relative shrink-0 w-full" data-name="Container">
      <Text1 text="parent@example.com" />
      <Icon2 />
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex flex-col gap-[7.982px] h-[83.145px] items-start relative shrink-0 w-full" data-name="Container">
      <LabelText text="Email Address" />
      <Container7 />
    </div>
  );
}

function Icon3() {
  return (
    <Icon4>
      <g clipPath="url(#clip0_244_83)" id="Icon">
        <path d={svgPaths.p1c0a7a80} id="Vector" stroke="var(--stroke-0, #003630)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.3" strokeWidth="1.33237" />
      </g>
      <defs>
        <clipPath id="clip0_244_83">
          <rect fill="white" height="15.9884" width="15.9884" />
        </clipPath>
      </defs>
    </Icon4>
  );
}

function Container9() {
  return (
    <div className="h-[55.146px] relative shrink-0 w-full" data-name="Container">
      <Text1 text="0978123456" />
      <Icon3 />
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex flex-col gap-[7.982px] h-[83.145px] items-start relative shrink-0 w-full" data-name="Container">
      <LabelText text="Phone Number" />
      <Container9 />
    </div>
  );
}

function RegistrationFormPage1() {
  return (
    <div className="bg-[rgba(255,255,255,0.7)] h-[340.61px] relative rounded-[24px] shrink-0 w-full" data-name="RegistrationFormPage">
      <div aria-hidden="true" className="absolute border-[1.601px] border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[24px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]" />
      <div className="size-full">
        <div className="content-stretch flex flex-col gap-[19.992px] items-start pb-[1.601px] pt-[25.596px] px-[25.596px] relative size-full">
          <Container6 />
          <Container8 />
          <Container10 />
        </div>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[19.992px] h-[408.592px] items-start left-[23px] top-[122.01px] w-[368.01px]" data-name="Container">
      <RegistrationFormPage />
      <RegistrationFormPage1 />
    </div>
  );
}

function Container12() {
  return (
    <div className="bg-[#f5f4f7] h-[794px] relative shrink-0 w-full" data-name="Container">
      <div className="size-full">
        <div className="content-stretch flex flex-col gap-[31.977px] items-start pb-0 pt-[31.977px] px-[23.995px] relative size-full">
          <Container3 />
          <Container11 />
        </div>
      </div>
    </div>
  );
}

function RegistrationFormPage2() {
  return (
    <div className="absolute bg-[#f5f4f7] content-stretch flex flex-col h-[852px] items-start left-[-1px] overflow-clip top-[-1px] w-[416px]" data-name="RegistrationFormPage">
      <Container2 />
      <Container12 />
    </div>
  );
}

function Container13() {
  return <div className="absolute bg-[#003630] h-[55.997px] left-0 top-0 w-[368.358px]" data-name="Container" />;
}

function Container14() {
  return <div className="absolute bg-gradient-to-r from-[rgba(0,0,0,0)] h-[55.997px] left-[-368.36px] to-[rgba(0,0,0,0)] top-0 via-50% via-[rgba(255,255,255,0.1)] w-[368.358px]" data-name="Container" />;
}

function Container15() {
  return <div className="absolute bg-[rgba(255,255,255,0)] h-[55.997px] left-0 shadow-[0px_6px_0px_0px_rgba(0,54,48,0.25)] top-0 w-[368.358px]" data-name="Container" />;
}

function Text() {
  return (
    <div className="absolute content-stretch flex h-[23.97px] items-start left-[103.31px] top-[16.01px] w-[161.735px]" data-name="Text">
      <p className="absolute font-['IBM_Plex_Sans:SemiBold',sans-serif] leading-[24px] left-[79.5px] not-italic text-[16px] text-center text-nowrap text-white top-0 tracking-[-0.176px] translate-x-[-50%]">Next</p>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[rgba(255,255,255,0)] h-[55.997px] overflow-clip relative rounded-[24px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] shrink-0 w-full" data-name="Button">
      <Container13 />
      <Container14 />
      <Container15 />
      <Text />
    </div>
  );
}

function RegistrationFormPage3() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.7)] content-stretch flex flex-col h-[105.588px] items-start left-[-1px] pb-0 pt-[25.596px] px-[23.995px] top-[745.32px] w-[416.348px]" data-name="RegistrationFormPage">
      <div aria-hidden="true" className="absolute border-[1.601px_0px_0px] border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]" />
      <Button />
    </div>
  );
}

export default function Parents() {
  return (
    <div className="bg-[#fff5f5] border border-[#95e36c] border-solid relative size-full" data-name="Parents">
      <RegistrationFormPage2 />
      <RegistrationFormPage3 />
    </div>
  );
}